#!/usr/bin/env python3
"""GameDev.net job scraper using Playwright. Site jobs board is currently defunct (404)."""
from __future__ import annotations

import hashlib
import json
import sys
from typing import Any

from playwright.sync_api import sync_playwright

DEFAULT_SOURCE_URL = "https://www.gamedev.net/jobs/"
SOURCE_NAME = "gamedev-net"


def resolve_source_url() -> str:
    payload_raw = sys.stdin.read() or "{}"
    payload = json.loads(payload_raw)
    url = payload.get("sourceUrl") if isinstance(payload, dict) else None
    if isinstance(url, str) and url.strip():
        return url.strip()
    return DEFAULT_SOURCE_URL


def make_content_hash(title: str, company: str, location: str, url: str) -> str:
    canonical = f"{title}|{company}|{location}|{url}|{SOURCE_NAME}".strip().lower()
    return f"{SOURCE_NAME}-{hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:16]}"


def scrape_jobs() -> list[dict[str, Any]]:
    source_url = resolve_source_url()
    jobs: list[dict[str, Any]] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(source_url, wait_until="domcontentloaded", timeout=15000)
        body = page.inner_text("body")
        browser.close()

    if not body or len(body) < 100:
        return jobs
    if "resolver404" in body.lower() or "not made it to production" in body.lower():
        print("GameDev.net jobs board is currently unavailable (404)", file=sys.stderr)
        return jobs

    for line in body.split("\n")[:60]:
        line = line.strip()
        if len(line) < 15:
            continue
        lower = line.lower()
        if "job" not in lower and "engineer" not in lower and "developer" not in lower:
            continue
        clean = line[:120]
        jobs.append({
            "title": clean, "company": "GameDev.net", "location": "Remote",
            "url": source_url, "source": SOURCE_NAME,
            "contentHash": make_content_hash(clean, "GameDev.net", "Remote", source_url),
            "description": clean, "postDate": "", "remote": True,
        })
        if len(jobs) >= 40:
            break
    return jobs


if __name__ == "__main__":
    print(json.dumps(scrape_jobs(), ensure_ascii=False, indent=2))
