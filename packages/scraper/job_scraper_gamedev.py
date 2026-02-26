#!/usr/bin/env python3
"""
Hitmarker gaming jobs scraper using Playwright.
Replaces the defunct GameDev.net scraper. Hitmarker is the leading
gaming/esports job board with active listings.
"""
from __future__ import annotations

import hashlib
import json
import sys
from typing import Any

from playwright.sync_api import sync_playwright

DEFAULT_SOURCE_URL = "https://hitmarker.net/jobs"
SOURCE_NAME = "hitmarker-scraper"


def resolve_source_url() -> str:
    payload_raw = sys.stdin.read() or "{}"
    payload = json.loads(payload_raw)
    url = payload.get("sourceUrl") if isinstance(payload, dict) else None
    if isinstance(url, str) and url.strip():
        return url.strip()
    return DEFAULT_SOURCE_URL


def make_content_hash(title: str, company: str, location: str) -> str:
    canonical = f"{title}|{company}|{location}|{SOURCE_NAME}".strip().lower()
    return f"{SOURCE_NAME}-{hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:16]}"


def scrape_jobs() -> list[dict[str, Any]]:
    source_url = resolve_source_url()
    jobs: list[dict[str, Any]] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(source_url, wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(2000)

        cards = page.query_selector_all("a[href*='/jobs/']")
        seen: set[str] = set()
        for card in cards[:60]:
            href = card.get_attribute("href") or ""
            if not href or href in seen or "/jobs/" not in href:
                continue
            seen.add(href)

            text = (card.inner_text() or "").strip()
            lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
            if len(lines) < 2:
                continue

            title = lines[0]
            company = lines[1] if len(lines) > 1 else "Unknown"
            location = "Remote"
            for ln in lines[2:]:
                if any(kw in ln.lower() for kw in ["remote", "usa", "uk", "europe", "canada", "worldwide"]):
                    location = ln
                    break

            if len(title) < 5:
                continue

            url = href if href.startswith("http") else f"https://hitmarker.net{href}"
            jobs.append({
                "title": title[:200],
                "company": company[:100],
                "location": location[:100],
                "url": url,
                "source": SOURCE_NAME,
                "contentHash": make_content_hash(title, company, location),
                "description": "",
                "postDate": "",
                "remote": "remote" in location.lower(),
            })

        browser.close()

    return jobs[:40]


if __name__ == "__main__":
    print(json.dumps(scrape_jobs(), ensure_ascii=False, indent=2))
