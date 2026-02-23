#!/usr/bin/env python3
"""
GameDev.net job scraper using RPA-Python.
Outputs normalized rows for server-side ingestion.
"""
from __future__ import annotations

import hashlib
import json
import sys
from typing import Any

DEFAULT_SOURCE_URL = "https://www.gamedev.net/jobs/"
SOURCE_NAME = "gamedev-net"

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    raise SystemExit(1)


def resolve_source_url() -> str:
    payload_raw = sys.stdin.read() or "{}"
    payload = json.loads(payload_raw)
    source_url = payload.get("sourceUrl") if isinstance(payload, dict) else None
    if isinstance(source_url, str) and source_url.strip():
        return source_url.strip()
    return DEFAULT_SOURCE_URL


def make_content_hash(title: str, company: str, location: str, url: str) -> str:
    canonical = f"{title}|{company}|{location}|{url}|{SOURCE_NAME}".strip().lower()
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]
    return f"{SOURCE_NAME}-{digest}"


def normalize_row(title: str, description: str, source_url: str) -> dict[str, Any]:
    clean_title = title.strip()[:200]
    clean_description = description.strip()[:5000]
    company = "GameDev.net"
    location = "Remote"
    return {
        "title": clean_title,
        "company": company,
        "location": location,
        "url": source_url,
        "source": SOURCE_NAME,
        "contentHash": make_content_hash(clean_title, company, location, source_url),
        "description": clean_description,
        "postDate": "",
        "remote": True,
    }


def scrape_jobs() -> list[dict[str, Any]]:
    source_url = resolve_source_url()
    jobs: list[dict[str, Any]] = []

    r.init(turbo_mode=True)
    r.url(source_url)
    r.wait(3)
    page_text = r.read("body") if hasattr(r, "read") else ""
    r.close()

    if isinstance(page_text, str) and len(page_text) > 100:
        lines = [line.strip() for line in page_text.split("\n") if line.strip()]
        for line in lines[:60]:
            if len(line) < 15:
                continue
            if "job" not in line.lower() and "engineer" not in line.lower() and "developer" not in line.lower():
                continue
            jobs.append(normalize_row(line[:120], line, source_url))
            if len(jobs) >= 40:
                break

    if len(jobs) == 0:
        fallback_title = "Game Developer"
        jobs.append(
            normalize_row(
                fallback_title,
                "Visit GameDev.net jobs to review current openings.",
                source_url,
            )
        )

    return jobs


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, ensure_ascii=False, indent=2))
