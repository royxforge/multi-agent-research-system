from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import structlog
import json
import asyncio
import re
import time
import uuid
from datetime import datetime

import aiohttp
import xml.etree.ElementTree as ET
from collections import Counter

from src.agents.graph import build_research_graph
from src.agents.state import AgentState
from src.config import configure_logging, get_settings
from src.schemas import ResearchRequest, ResearchResponse
from src.utils.tracing import TraceLogger
from src.tools.graph import build_citation_graph

settings = get_settings()
configure_logging(settings)
logger = structlog.get_logger(__name__)

# Never log these sensitive fields
_SENSITIVE_LOG_FIELDS = frozenset({
    "api_key",
    "openrouter_api_key",
    "encrypted_api_key",
    "encryption_iv",
    "encryption_salt",
    "encryption_passphrase",
})


def _deduplicate_documents(documents: list) -> list:
    """Merge chunks sharing the same base URL into a single document for graph generation."""
    unique = {}
    for doc in documents:
        base_url = re.sub(r'\s*\(part \d+\)$', '', doc["source"])
        if base_url in unique:
            unique[base_url]["content"] += "\n\n" + doc["content"]
        else:
            unique[base_url] = {"source": base_url, "content": doc["content"]}
    return list(unique.values())


def _safe_log_request(request: ResearchRequest) -> dict:
    """Return a sanitised dict of request fields safe for logging."""
    return {
        k: v
        for k, v in request.model_dump().items()
        if k not in _SENSITIVE_LOG_FIELDS and v is not None
    }


app = FastAPI(title="Auto-Researcher", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.graph = build_research_graph()

# ── Trending topics cache ──────────────────────────────────────────
_TRENDING_CACHE: dict[str, object] = {"topics": [], "timestamp": 0.0}
_TRENDING_CACHE_TTL = 3600  # 1 hour

_ARXIV_CATEGORY_TOPICS: dict[str, str] = {
    "cs.AI": "Advances in Artificial Intelligence",
    "cs.LG": "Machine Learning Research",
    "cs.CL": "Natural Language Processing",
    "cs.CV": "Computer Vision",
    "cs.RO": "Robotics & Autonomous Systems",
    "cs.CR": "Cybersecurity Research",
    "cs.NE": "Neural Networks & Deep Learning",
    "cs.SE": "Software Engineering",
    "cs.DB": "Data Management & Mining",
    "cs.SI": "Social & Information Networks",
    "cs.IR": "Information Retrieval",
    "cs.HC": "Human-Computer Interaction",
    "cs.MA": "Multiagent Systems",
    "cs.CY": "Computers & Society",
    "stat.ML": "Statistical Machine Learning",
    "q-bio.GN": "Genomics & Bioinformatics",
    "q-bio.NC": "Neurons & Cognition",
    "q-fin": "Quantitative Finance",
    "eess.AS": "Audio & Speech Processing",
    "eess.IV": "Image & Video Processing",
    "physics.soc-ph": "Physics & Society",
    "math.OC": "Optimization & Control",
}


async def _fetch_trending_topics() -> list[str]:
    """Fetch recent papers from arXiv and return trending topic names."""
    url = (
        "http://export.arxiv.org/api/query?"
        "search_query=all:"
        "&sortBy=submittedDate"
        "&sortOrder=descending"
        "&max_results=150"
    )
    namespaces = {
        "atom": "http://www.w3.org/2005/Atom",
        "arxiv": "http://arxiv.org/schemas/atom",
    }
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    logger.warning("arxiv.api.error", status=resp.status)
                    return []
                text = await resp.text()

        root = ET.fromstring(text)
        categories: list[str] = []
        for entry in root.findall("atom:entry", namespaces):
            primary = entry.find("arxiv:primary_category", namespaces)
            if primary is not None:
                cat = primary.get("term", "")
                if cat:
                    categories.append(cat)

        if not categories:
            return []

        # Count, sort, map to readable names, take top 5
        counts = Counter(categories)
        top = [cat for cat, _ in counts.most_common(12)]

        # Map to readable topic names
        topics: list[str] = []
        seen: set[str] = set()
        for cat in top:
            # Try exact match, then prefix match
            topic = _ARXIV_CATEGORY_TOPICS.get(cat)
            if not topic:
                prefix = cat.rsplit(".", 1)[0]
                topic = _ARXIV_CATEGORY_TOPICS.get(prefix)
            if topic and topic not in seen:
                topics.append(topic)
                seen.add(topic)
            if len(topics) >= 5:
                break

        return topics if topics else []

    except Exception as exc:
        logger.warning("trending.fetch_failed", error=str(exc))
        return []


@app.get("/trending")
async def get_trending_topics():
    """Return trending research topics based on recent arXiv submissions."""
    now = time.time()
    if now - _TRENDING_CACHE["timestamp"] > _TRENDING_CACHE_TTL or not _TRENDING_CACHE["topics"]:
        topics = await _fetch_trending_topics()
        if topics:
            _TRENDING_CACHE["topics"] = topics
            _TRENDING_CACHE["timestamp"] = now
    return {"topics": _TRENDING_CACHE["topics"]}


@app.post("/research/stream")
async def run_research_stream(request: ResearchRequest):
    graph = getattr(app.state, "graph", None)
    if graph is None:
        graph = build_research_graph()
        app.state.graph = graph

    job_id = str(uuid.uuid4())
    
    # Zero-knowledge encryption params
    encryption_passphrase = request.encryption_passphrase
    encryption_salt = request.encryption_salt

    initial_state: AgentState = {
        "query": request.topic,
        "max_depth": request.max_depth,
        "max_search_results": request.num_papers,
        "provider": request.provider,
        "openrouter_api_key": request.openrouter_api_key,
        "model": request.model,
        "critic_strictness": request.critic_strictness,
        "encrypted_api_key": request.encrypted_api_key,
        "encryption_iv": request.encryption_iv,
        "encryption_salt": encryption_salt,
        "encryption_passphrase": encryption_passphrase,
        "job_id": job_id,
        "seed": settings.default_seed,
        "temperature": settings.default_temperature,
        "top_p": settings.default_top_p,
        "metadata": {
            "job_id": job_id,
            "start_time": datetime.utcnow().isoformat(),
            "model": request.model or "default",
            "provider": request.provider,
            "retrieval_stats": {},
            "pdf_stats": {},
        }
    }

    async def event_generator():
        try:
            current_step = None
            # Stream events from the graph
            async for event in graph.astream_events(initial_state, version="v1"):
                kind = event["event"]
                
                # Filter for node start/end events to track progress
                if kind == "on_chain_start" and event["name"] in ["research", "draft", "critique"]:
                    current_step = event["name"]
                    yield f"data: {json.dumps({'type': 'progress', 'step': event['name'], 'status': 'running'})}\n\n"
                
                elif kind == "on_chain_end" and event["name"] in ["research", "draft", "critique"]:
                    yield f"data: {json.dumps({'type': 'progress', 'step': event['name'], 'status': 'completed'})}\n\n"
                    current_step = None
                
                elif kind == "on_chat_model_stream" and current_step == "draft":
                    content = event["data"]["chunk"].content
                    if content:
                        yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

            # Get final state to return the result
            final_state = await graph.ainvoke(initial_state)
            draft = final_state.get("draft")
            # Deduplicate sources by base URL (strip " (part N)" suffix)
            raw_sources = [doc["source"] for doc in final_state.get("documents", [])]
            sources = list(dict.fromkeys(
                re.sub(r'\s*\(part \d+\)$', '', s) for s in raw_sources
            ))
            
            # Save graph execution trace (encrypted at rest if passphrase provided)
            tracer = TraceLogger(
                job_id,
                encryption_passphrase=encryption_passphrase,
                encryption_salt=encryption_salt,
            )
            tracer.save_graph_execution(final_state)

            # Update end time in metadata
            metadata = final_state.get("metadata", {})
            metadata["end_time"] = datetime.utcnow().isoformat()
            tracer.save_metadata(metadata)
            
            if not draft:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Workflow produced no draft'})}\n\n"
            else:
                graph_data = build_citation_graph(_deduplicate_documents(final_state.get("documents", [])))
                result = ResearchResponse(final_report=draft, sources=sources, topic=request.topic, graph_data=graph_data)
                yield f"data: {json.dumps({'type': 'result', 'data': result.model_dump()})}\n\n"

        except Exception as e:
            logger.error("stream.error", error=str(e))
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/research", response_model=ResearchResponse)
async def run_research(request: ResearchRequest) -> ResearchResponse:
    graph = getattr(app.state, "graph", None)
    if graph is None:
        logger.warning("graph.not_initialized")
        graph = build_research_graph()
        app.state.graph = graph

    job_id = str(uuid.uuid4())

    encryption_passphrase = request.encryption_passphrase
    encryption_salt = request.encryption_salt

    initial_state: AgentState = {
        "query": request.topic,
        "max_depth": request.max_depth,
        "max_search_results": request.num_papers,
        "provider": request.provider,
        "openrouter_api_key": request.openrouter_api_key,
        "model": request.model,
        "critic_strictness": request.critic_strictness,
        "encrypted_api_key": request.encrypted_api_key,
        "encryption_iv": request.encryption_iv,
        "encryption_salt": encryption_salt,
        "encryption_passphrase": encryption_passphrase,
        "job_id": job_id,
        "seed": settings.default_seed,
        "temperature": settings.default_temperature,
        "top_p": settings.default_top_p,
        "metadata": {
            "job_id": job_id,
            "start_time": datetime.utcnow().isoformat(),
            "model": request.model or "default",
            "provider": request.provider,
            "retrieval_stats": {},
            "pdf_stats": {},
        }
    }

    log_fields = _safe_log_request(request)
    logger.info("api.research.start", **log_fields, job_id=job_id)
    try:
        result: AgentState = await graph.ainvoke(initial_state)
        
        # Save graph execution trace (encrypted at rest if passphrase provided)
        tracer = TraceLogger(
            job_id,
            encryption_passphrase=encryption_passphrase,
            encryption_salt=encryption_salt,
        )
        tracer.save_graph_execution(result)

        # Update end time in metadata
        metadata = result.get("metadata", {})
        metadata["end_time"] = datetime.utcnow().isoformat()
        tracer.save_metadata(metadata)

    except Exception as exc:
        logger.error("api.research.failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to complete research workflow") from exc

    draft = result.get("draft")
    if not draft:
        logger.error("api.research.empty_draft")
        raise HTTPException(status_code=424, detail="Workflow did not produce a draft")

    # Deduplicate sources by base URL (strip " (part N)" suffix)
    raw_sources = [doc["source"] for doc in result.get("documents", [])]
    sources = list(dict.fromkeys(
        re.sub(r'\s*\(part \d+\)$', '', s) for s in raw_sources
    ))
    logger.info("api.research.complete", sources=len(sources))
    
    graph_data = build_citation_graph(_deduplicate_documents(result.get("documents", [])))
    
    return ResearchResponse(final_report=draft, sources=sources, topic=request.topic, graph_data=graph_data)

