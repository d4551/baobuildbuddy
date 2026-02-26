#!/usr/bin/env python3
"""GrackleHQ job scraper using Playwright."""
import hashlib
import json
import sys

from playwright.sync_api import sync_playwright


DEFAULT_SOURCE_URL = "https://gracklehq.com/jobs"


def resolve_source_url() -> str:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        url = payload.get("sourceUrl") if isinstance(payload, dict) else None
        if isinstance(url, str) and url.strip():
            return url.strip()
    except Exception:
        pass
    return DEFAULT_SOURCE_URL


def content_hash(title: str, company: str, location: str) -> str:
    raw = f"{title}|{company}|{location}".lower().strip()
    return f"grackle-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(source_url, wait_until="networkidle", timeout=20000)

        listings = page.query_selector_all("div.joblisting")
        for listing in listings[:50]:
            link = listing.query_selector("a[target='_blank']") or listing.query_selector("a")
            if not link:
                continue
            title = (link.inner_text() or "").strip()
            if not title or len(title) < 3:
                continue
            full_text = listing.inner_text().replace("\n", " ").strip()
            after_title = full_text.replace(title, "", 1).strip()
            company, location = "Unknown", "Remote"
            parts = after_title.split(" - ", 1)
            if len(parts) >= 2:
                company = parts[0].strip().lstrip("- ").strip()[:100]
                location = parts[1].strip().split("  ")[0].strip()[:100]
            elif parts[0].strip():
                company = parts[0].strip().lstrip("- ").strip()[:100]
            url = link.get_attribute("href") or source_url
            if url.startswith("/"):
                url = f"https://gracklehq.com{url}"
            jobs.append({
                "title": title[:200], "company": company, "location": location,
                "remote": "remote" in location.lower(), "description": "",
                "url": url, "source": "grackle", "postedDate": "",
                "contentHash": content_hash(title, company, location),
            })
        browser.close()
    return jobs


if __name__ == "__main__":
    print(json.dumps(scrape_jobs(), indent=2))
