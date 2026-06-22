from __future__ import annotations

import re
from typing import Any

import aiohttp
import structlog

logger = structlog.get_logger(__name__)

ARXIV_PATTERN = re.compile(r"(?:arxiv\.org/(?:abs|pdf)/(\d+\.\d+))", re.IGNORECASE)
DOI_CACHE: dict[str, str | None] = {}


def extract_arxiv_ids(urls: list[str]) -> list[str]:
    """Extract arXiv IDs from a list of URLs."""
    ids: list[str] = []
    for url in urls:
        match = ARXIV_PATTERN.search(url)
        if match:
            ids.append(match.group(1))
    return ids


async def resolve_doi(arxiv_id: str) -> str | None:
    """Resolve the DOI for an arXiv ID using the arXiv API."""
    if arxiv_id in DOI_CACHE:
        return DOI_CACHE[arxiv_id]

    url = f"http://export.arxiv.org/api/query?id_list={arxiv_id}&max_results=1"
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return None
                text = await resp.text()

        import xml.etree.ElementTree as ET
        ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}
        root = ET.fromstring(text)
        entry = root.find("atom:entry", ns)
        if entry is not None:
            doi_el = entry.find("arxiv:doi", ns)
            if doi_el is not None and doi_el.text:
                DOI_CACHE[arxiv_id] = doi_el.text
                return doi_el.text
        DOI_CACHE[arxiv_id] = None
        return None
    except Exception as exc:
        logger.warning("doi.resolve_failed", arxiv_id=arxiv_id, error=str(exc))
        DOI_CACHE[arxiv_id] = None
        return None


async def resolve_dois_batch(urls: list[str]) -> dict[str, str | None]:
    """Resolve DOIs for arXiv IDs found in the given URLs."""
    arxiv_ids = extract_arxiv_ids(urls)
    result: dict[str, str | None] = {}
    for aid in arxiv_ids:
        doi = await resolve_doi(aid)
        result[aid] = doi
    return result
