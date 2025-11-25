from __future__ import annotations

import io
import re
import urllib.request
from typing import List, Tuple

import fitz  # type: ignore
import structlog

from src.config import get_settings

logger = structlog.get_logger(__name__)

USER_AGENT = "Auto-Researcher/1.0"
REFERENCE_MARKERS = ("references", "bibliography", "acknowledgements")


def parse_pdf(url: str) -> str:
    """Download and parse a PDF into clean text optimized for LLM consumption."""

    logger.info("pdf.parse.start", url=url)
    print(f"Downloading PDF: {url}...")
    raw_bytes = _download_pdf(url)
    text = _extract_text(raw_bytes)
    cleaned = _strip_reference_sections(text)
    print(f"Parsed PDF: {url} ({len(cleaned)} chars)")
    logger.info("pdf.parse.complete", url=url, char_count=len(cleaned))
    return cleaned


def _download_pdf(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=15) as response:  # nosec: B310
        return response.read()


def _extract_text(raw_bytes: bytes) -> str:
    settings = get_settings()
    # Fetch a bit more than the limit to allow for cleanup/stripping
    char_limit = settings.max_context_chars * 2
    
    text_parts = []
    current_length = 0
    
    with fitz.open(stream=io.BytesIO(raw_bytes), filetype="pdf") as document:
        for page in document:
            page_text = _extract_page(page)
            if page_text:
                text_parts.append(page_text)
                current_length += len(page_text)
                if current_length >= char_limit:
                    break
                    
    return "\n".join(text_parts)


def _extract_page(page: fitz.Page) -> str:
    blocks: List[Tuple[float, float, float, float, str, int]] = page.get_text("blocks")  # type: ignore[assignment]
    filtered = [(x0, y0, x1, y1, text.strip()) for x0, y0, x1, y1, text, *_ in blocks if text.strip()]
    if not filtered:
        return ""

    mid_x = page.rect.width / 2
    left: List[Tuple[float, str]] = []
    right: List[Tuple[float, str]] = []
    for x0, y0, x1, _, text in filtered:
        column = left if ((x0 + x1) / 2) <= mid_x else right
        column.append((y0, text))

    is_two_column = _has_two_columns(left, right)
    if is_two_column:
        left_text = "\n".join(text for _, text in sorted(left, key=lambda b: b[0]))
        right_text = "\n".join(text for _, text in sorted(right, key=lambda b: b[0]))
        ordered = f"{left_text}\n{right_text}".strip()
    else:
        ordered = "\n".join(text for _, text in sorted(left + right, key=lambda b: b[0]))
    ordered = re.sub(r"\s+", " ", ordered)
    return ordered.strip()


def _has_two_columns(left: List[Tuple[float, str]], right: List[Tuple[float, str]]) -> bool:
    if not left or not right:
        return False
    imbalance = abs(len(left) - len(right)) / max(len(left), len(right))
    return imbalance < 0.6


def _strip_reference_sections(text: str) -> str:
    lower = text.lower()
    cutoff = len(text)
    for marker in REFERENCE_MARKERS:
        idx = lower.rfind(marker)
        if idx != -1 and idx > len(text) * 0.5:
            cutoff = min(cutoff, idx)
    cleaned = text[:cutoff]
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()
