from __future__ import annotations

import asyncio
import json
from functools import lru_cache
from typing import Any, List

import structlog
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama  # type: ignore
from langchain_openai import ChatOpenAI

from src.agents.state import AgentState, CritiquePayload, DocumentPayload
from src.config import get_settings
from src.tools.pdf import parse_pdf
from src.tools.search import search_papers

logger = structlog.get_logger(__name__)


@lru_cache(maxsize=4)
def _get_llm(provider: str = "ollama", model: str | None = None, base_url: str | None = None, api_key: str | None = None) -> Any:
    settings = get_settings()
    
    if provider == "openrouter":
        resolved_key = api_key or settings.openrouter_api_key
        if not resolved_key:
             raise ValueError("OpenRouter API key is required")
        
        return ChatOpenAI(
            model=model or settings.openrouter_model,
            api_key=resolved_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.2
        )

    resolved_model = model or settings.ollama_model
    resolved_base = base_url or settings.ollama_base_url
    return ChatOllama(
        model=resolved_model,
        base_url=resolved_base,
        temperature=0.2,
    )


async def research_node(state: AgentState) -> AgentState:
    query = state.get("query", "")
    limit = state.get("max_search_results")
    print(f"\n--- [1/3] Researching Topic: {query} (Target: {limit} papers) ---")
    logger.info("node.research.start", query=query, limit=limit)
    urls = search_papers(query, limit=limit)
    print(f"Found {len(urls)} potential sources. Parsing PDFs...")
    
    tasks = [asyncio.to_thread(_safe_parse_pdf, url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    documents: List[DocumentPayload] = []
    for result in results:
        if isinstance(result, Exception):
            logger.warning("node.research.parse_exception", error=str(result))
            continue
        if result:
            documents.append(result)

    print(f"Successfully parsed {len(documents)} documents.")
    logger.info("node.research.complete", documents=len(documents))
    return {
        **state,
        "documents": documents,
        "revision_count": 0,
    }


def _safe_parse_pdf(url: str) -> DocumentPayload | None:
    try:
        content = parse_pdf(url)
    except Exception as exc:  # pragma: no cover - network failure path
        logger.warning("pdf.parse.failed", url=url, error=str(exc))
        return None

    settings = get_settings()
    trimmed = content[: settings.max_context_chars]
    if not trimmed:
        return None
    return {"source": url, "content": trimmed}


async def draft_node(state: AgentState) -> AgentState:
    revisions = state.get("revision_count", 0)
    print(f"\n--- [2/3] Drafting Review (Revision {revisions}) ---")
    logger.info("node.draft.start", revisions=revisions)
    documents = state.get("documents", [])
    if not documents:
        raise ValueError("Draft node requires at least one document")

    settings = get_settings()
    provider = state.get("provider", "ollama")
    api_key = state.get("openrouter_api_key")
    model = state.get("model")
    
    llm = _get_llm(provider=provider, model=model, api_key=api_key)

    context_sections = _format_sources(documents)
    critique_feedback = (state.get("critique") or {}).get("feedback")
    prompt = _build_draft_prompt(state.get("query", ""), state.get("max_depth", 3), context_sections, critique_feedback)

    print("Generating draft with LLM...")
    response = await llm.ainvoke([SystemMessage(content="You are the Analyst agent who writes structured literature reviews."), HumanMessage(content=prompt)])
    draft_text = _coerce_content(response)
    print("Draft generation complete.")
    logger.info("node.draft.complete", char_count=len(draft_text))
    return {**state, "draft": draft_text}


def _format_sources(documents: List[DocumentPayload]) -> str:
    formatted = []
    for idx, doc in enumerate(documents, start=1):
        snippet = doc["content"][:1500]
        formatted.append(f"[S{idx}] Source: {doc['source']}\nSnippet: {snippet}")
    return "\n\n".join(formatted)


def _build_draft_prompt(topic: str, depth: int, context_sections: str, feedback: str | None) -> str:
    feedback_section = feedback or "None"
    target_length = 1500 + depth * 300
    return (
        f"Topic: {topic}\n"
        f"Depth Target: {depth}\n"
        f"Prior Critique: {feedback_section}\n"
        "You are an elite academic researcher. Write a COMPREHENSIVE, IN-DEPTH academic literature review in Markdown.\n"
        "Rules:\n"
        "1. NO FLUFF. Do not use phrases like 'The paper discusses' or 'It is important to note'. State facts directly.\n"
        "2. Prioritize quantitative data (numbers, percentages, dates) over general statements.\n"
        "3. Use bullet points for 'Key Findings' to maximize readability.\n"
        "4. WRITE AT LENGTH. Each section must be detailed and exhaustive. Do not summarize briefly.\n"
        "5. CITATIONS ARE MANDATORY. Every claim must be backed by a source [S#].\n"
        "6. SYNTHESIZE. Do not just list papers. Connect findings across sources.\n\n"
        "Structure:\n"
        "# Title\n\n"
        "## Executive Summary\n"
        "(300+ words synthesizing the core narrative and high-level conclusions)\n\n"
        "## Key Findings\n"
        "(Detailed bullet points with inline citations [S#]. Group by themes (e.g., 'Theme 1: ...'). Aim for 800+ words.)\n\n"
        "## Critical Analysis\n"
        "(Evaluate the strength of the evidence, conflicting results, and limitations of the current body of work. 300+ words.)\n\n"
        "## Methodological Notes\n"
        "(Analyze the methods used in the sources: qualitative/quantitative/review. 300+ words.)\n\n"
        "## Implications & Open Questions\n"
        "(Discuss future research directions and practical applications. 300+ words.)\n\n"
        "## References\n"
        "(List all cited sources [S#] with their titles/URLs)\n\n"
        f"Target Length: ~{target_length} words.\n\n"
        f"Evidence Bank:\n{context_sections}"
    )


async def critique_node(state: AgentState) -> AgentState:
    print("\n--- [3/3] Critiquing Draft ---")
    logger.info("node.critique.start")
    draft = state.get("draft", "")
    documents = state.get("documents", [])
    if not draft:
        raise ValueError("Critique node requires an existing draft")

    settings = get_settings()
    provider = state.get("provider", "ollama")
    api_key = state.get("openrouter_api_key")
    model = state.get("model")
    
    llm = _get_llm(provider=provider, model=model, api_key=api_key)
    context = _format_sources(documents)

    strictness = state.get("critic_strictness", 5)
    # Calculate passing threshold: 1->5.0, 5->7.0, 10->9.5
    threshold = 4.5 + (strictness * 0.5)

    strictness_instruction = "Be balanced. Ensure accuracy and good citation usage."
    if strictness <= 3:
        strictness_instruction = "Be lenient. Focus only on major factual errors. Accept general statements if they seem reasonable."
    elif strictness >= 8:
        strictness_instruction = "Be extremely strict. Nitpick every detail, require high citation density, and penalize any vague language severely."

    critique_prompt = (
        f"You are the Critic agent. Strictness Level: {strictness}/10. {strictness_instruction} "
        "Score the draft from 1-10 for accuracy and rigor. "
        "Estimate hallucination probability between 0 and 1 based on mismatches with the evidence bank. "
        "Check if the draft contains specific quantitative data or just vague generalizations. "
        "Verify that citations [S#] are used correctly and exist in the evidence bank. "
        "Respond ONLY in JSON like "
        '{"score": 8.5, "hallucination": 0.2, "vague": false, "feedback": "..."}. '
        f"\nEvidence Bank:\n{context}\n\nDraft:\n{draft}"
    )

    print(f"Analyzing draft quality (Strictness: {strictness}, Threshold: {threshold})...")
    response = await llm.ainvoke([SystemMessage(content="You are the Critic who ensures fidelity to evidence."), HumanMessage(content=critique_prompt)])
    critique_data = _parse_critique(response)

    score = critique_data.get("score", 0)
    needs_revision = bool(
        score < threshold
        or critique_data.get("hallucination_score", 0) > 0.4
        or critique_data.get("is_vague", False)
    )
    revisions = state.get("revision_count", 0)
    if needs_revision and revisions < 1:
        revisions += 1
        print(f"Critique: Needs revision (Score: {score}/{threshold}, Feedback: {critique_data.get('feedback')[:50]}...)")
    else:
        print(f"Critique: Passed (Score: {score}/{threshold})")

    payload: CritiquePayload = {
        "score": float(critique_data.get("score", 0)),
        "hallucination_score": float(critique_data.get("hallucination_score", 0)),
        "is_vague": bool(critique_data.get("is_vague", False)),
        "feedback": critique_data.get("feedback", "Provide clearer evidence alignment."),
        "needs_revision": needs_revision,
    }
    logger.info("node.critique.complete", needs_revision=needs_revision, revisions=revisions)
    return {**state, "critique": payload, "revision_count": revisions}


def _parse_critique(message: Any) -> dict[str, Any]:
    raw = _coerce_content(message)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("node.critique.json_error", raw=raw)
        data = {}
    return {
        "score": float(data.get("score", 0)),
        "hallucination_score": float(data.get("hallucination", data.get("hallucination_score", 0))),
        "is_vague": bool(data.get("vague", data.get("is_vague", False))),
        "feedback": data.get("feedback", raw),
    }


def _coerce_content(message: Any) -> str:
    content = getattr(message, "content", message)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for chunk in content:
            if isinstance(chunk, dict) and chunk.get("type") == "text":
                text_parts.append(chunk.get("text", ""))
        return "\n".join(text_parts)
    return str(content)
