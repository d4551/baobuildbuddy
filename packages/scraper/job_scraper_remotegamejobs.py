#!/usr/bin/env python3
"""RemoteGameJobs scraper using Playwright."""
import hashlib
import json
import sys

from playwright.sync_api import sync_playwright

DEFAULT_SOURCE_URL = "https://remotegamejobs.com"


def resolve_source_url() -> str:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        url = payload.get("sourceUrl") if isinstance(payload, dict) else None
        if isinstance(url, str) and url.strip():
            return url.strip()
    except Exception:
        pass
    return DEFAULT_SOURCE_URL


def content_hash(title: str, company: str) -> str:
    raw = f"{title}|{company}|Remote".lower().strip()
    return f"rgj-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(source_url, wait_until="networkidle", timeout=20000)

        emp_types = {"full-time", "part-time", "contract", "freelance", "internship", "details"}
        boxes = page.query_selector_all(".job-box")
        for box in boxes[:50]:
            link = box.query_selector("a.has-text-black") or box.query_selector("a[href*='/jobs/']")
            if not link:
                continue
            title = link.text_content()
            if title:
                title = title.strip().split("\n")[0].strip()
            if not title or len(title) < 5:
                continue
            company = "Unknown"
            lines = [ln.strip() for ln in box.inner_text().split("\n") if ln.strip()]
            for ln in lines:
                if ln == title or ln.lower() in emp_types or ln.startswith("Remote"):
                    continue
                if 2 < len(ln) < 80:
                    company = ln
                    break
            url = link.get_attribute("href") or source_url
            if url.startswith("/"):
                url = f"https://remotegamejobs.com{url}"
            jobs.append({
                "title": title[:200], "company": company[:100], "location": "Remote",
                "remote": True, "description": "", "url": url,
                "source": "remotegamejobs", "postedDate": "",
                "contentHash": content_hash(title, company),
            })
        browser.close()
    return jobs


if __name__ == "__main__":
    print(json.dumps(scrape_jobs(), indent=2))
