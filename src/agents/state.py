from __future__ import annotations

from typing import List, TypedDict


class DocumentPayload(TypedDict):
    source: str
    content: str


class CritiquePayload(TypedDict, total=False):
    score: float
    hallucination_score: float
    is_vague: bool
    feedback: str
    needs_revision: bool


class AgentState(TypedDict, total=False):
    query: str
    max_depth: int
    max_search_results: int
    provider: str
    openrouter_api_key: str | None
    model: str | None
    documents: List[DocumentPayload]
    draft: str
    critique: CritiquePayload
    revision_count: int
