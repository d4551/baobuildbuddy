#!/usr/bin/env python3
"""Work With Indies job scraper using Playwright."""
import hashlib
import json
import re
import sys

from playwright.sync_api import sync_playwright

DEFAULT_SOURCE_URL = "https://workwithindies.com"
HIRING_RE = re.compile(
    r"(.+?)\s+is hiring\s+(?:a |an )?(.+?)(?:to (?:work from|join)\s+(.+?))?(?:Learn More|$)",
    re.IGNORECASE,
)


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
    return f"wwi-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(source_url, wait_until="networkidle", timeout=25000)
        page.wait_for_timeout(3000)

        cards = page.query_selector_all("a.job-card, a[href*='/careers/']")
        for card in cards[:60]:
            text = (card.inner_text() or "").replace("\n", " ").strip()
            href = card.get_attribute("href") or ""
            m = HIRING_RE.search(text)
            if not m:
                continue
            company = m.group(1).strip()
            title = m.group(2).strip()
            location = m.group(3).strip() if m.group(3) else "Remote"
            if not title or len(title) < 3 or len(company) > 80:
                continue
            if "resume" in company.lower() or "discord" in company.lower():
                continue
            url = href if href.startswith("http") else f"https://www.workwithindies.com{href}"
            jobs.append({
                "title": title[:200], "company": company[:100], "location": location[:100],
                "remote": "remote" in location.lower() or "anywhere" in location.lower(),
                "description": "", "url": url, "source": "workwithindies", "postDate": "",
                "contentHash": content_hash(title, company, location),
            })
        browser.close()
    return jobs


if __name__ == "__main__":
    print(json.dumps(scrape_jobs(), indent=2))
