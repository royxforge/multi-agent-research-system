from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import structlog

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
    }

    logger.info("api.research.start", topic=request.topic, max_depth=request.max_depth, papers=request.num_papers, provider=request.provider, model=request.model)
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
    return ResearchResponse(final_report=draft, sources=sources)
