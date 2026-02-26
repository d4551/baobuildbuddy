#!/usr/bin/env python3
"""PocketGamer.biz job scraper using Playwright."""
import hashlib
import json
import sys

from playwright.sync_api import sync_playwright

DEFAULT_SOURCE_URL = "https://www.pocketgamer.biz/jobs/"


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
    return f"pg-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(source_url, wait_until="networkidle", timeout=20000)

        articles = page.query_selector_all("article, .job-listing, [class*='job']")
        for article in articles[:40]:
            title_el = article.query_selector("h2, h3, h4, a[href*='job'], .title")
            if not title_el:
                continue
            title = (title_el.inner_text() or "").strip()
            if not title or len(title) < 5:
                continue
            company_el = article.query_selector(".cat, .company, [class*='company']")
            company = (company_el.inner_text() if company_el else "Unknown").strip()[:100]
            desc_el = article.query_selector(".strap, .description, p")
            description = (desc_el.inner_text() if desc_el else "").strip()[:500]
            link_el = article.query_selector("a[href]")
            url = (link_el.get_attribute("href") if link_el else source_url) or source_url
            if url.startswith("/"):
                url = f"https://www.pocketgamer.biz{url}"
            jobs.append({
                "title": title[:200], "company": company, "location": "Remote",
                "remote": True, "description": description, "url": url,
                "source": "pocketgamer", "postedDate": "",
                "contentHash": content_hash(title, company, "Remote"),
            })
        browser.close()
    return jobs


if __name__ == "__main__":
    print(json.dumps(scrape_jobs(), indent=2))
