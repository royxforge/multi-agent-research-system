from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import structlog
import json
import asyncio

from src.agents.graph import build_research_graph
from src.agents.state import AgentState
from src.config import configure_logging, get_settings
from src.schemas import ResearchRequest, ResearchResponse

settings = get_settings()
configure_logging(settings)
logger = structlog.get_logger(__name__)

app = FastAPI(title="Auto-Researcher", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.graph = build_research_graph()


@app.post("/research/stream")
async def run_research_stream(request: ResearchRequest):
    graph = getattr(app.state, "graph", None)
    if graph is None:
        graph = build_research_graph()
        app.state.graph = graph

    initial_state: AgentState = {
        "query": request.topic,
        "max_depth": request.max_depth,
        "max_search_results": request.num_papers,
        "provider": request.provider,
        "openrouter_api_key": request.openrouter_api_key,
        "model": request.model,
        "critic_strictness": request.critic_strictness,
    }

    async def event_generator():
        try:
            # Stream events from the graph
            async for event in graph.astream_events(initial_state, version="v1"):
                kind = event["event"]
                
                # Filter for node start/end events to track progress
                if kind == "on_chain_start" and event["name"] in ["research", "draft", "critique"]:
                    yield f"data: {json.dumps({'type': 'progress', 'step': event['name'], 'status': 'running'})}\n\n"
                
                elif kind == "on_chain_end" and event["name"] in ["research", "draft", "critique"]:
                    yield f"data: {json.dumps({'type': 'progress', 'step': event['name'], 'status': 'completed'})}\n\n"

            # Get final state to return the result
            final_state = await graph.ainvoke(initial_state)
            draft = final_state.get("draft")
            sources = [doc["source"] for doc in final_state.get("documents", [])]
            
            if not draft:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Workflow produced no draft'})}\n\n"
            else:
                result = ResearchResponse(final_report=draft, sources=sources, topic=request.topic)
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

    initial_state: AgentState = {
        "query": request.topic,
        "max_depth": request.max_depth,
        "max_search_results": request.num_papers,
        "provider": request.provider,
        "openrouter_api_key": request.openrouter_api_key,
        "model": request.model,
        "critic_strictness": request.critic_strictness,
    }

    logger.info("api.research.start", topic=request.topic, max_depth=request.max_depth, papers=request.num_papers, provider=request.provider, model=request.model, strictness=request.critic_strictness)
    try:
        result: AgentState = await graph.ainvoke(initial_state)
    except Exception as exc:
        logger.error("api.research.failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to complete research workflow") from exc

    draft = result.get("draft")
    if not draft:
        logger.error("api.research.empty_draft")
        raise HTTPException(status_code=424, detail="Workflow did not produce a draft")

    sources = [doc["source"] for doc in result.get("documents", [])]
    logger.info("api.research.complete", sources=len(sources))
    return ResearchResponse(final_report=draft, sources=sources, topic=request.topic)
