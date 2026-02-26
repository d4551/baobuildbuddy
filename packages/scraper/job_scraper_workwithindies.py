#!/usr/bin/env python3
"""
Work With Indies job scraper using RPA-Python.
Scrapes indie game studio job listings from workwithindies.com and outputs JSON.
"""
import json
import hashlib
import re
import sys

DEFAULT_SOURCE_URL = "https://workwithindies.com"

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    sys.exit(1)


def resolve_source_url() -> str:
    try:
        payload = json.loads(sys.stdin.read() or "{}")
        source_url = payload.get("sourceUrl") if isinstance(payload, dict) else None
        if isinstance(source_url, str) and source_url.strip():
            return source_url.strip()
    except Exception:
        pass

    return DEFAULT_SOURCE_URL


def content_hash(title: str, company: str, location: str) -> str:
    raw = f"{title}|{company}|{location}".lower().strip()
    return f"wwi-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


HIRING_PATTERN = re.compile(
    r"(.+?)\s+is hiring\s+(?:a |an )?(.+?)(?:to (?:work from|join their team in|join)\s+(.+?))?(?:Learn More|$)",
    re.IGNORECASE,
)


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    try:
        r.init(turbo_mode=True, headless_mode=True)
        r.url(source_url)
        r.wait(5)
        body = r.read("body") or ""
        r.close()

        if not body or len(body) < 100:
            return jobs

        for match in HIRING_PATTERN.finditer(body):
            company = match.group(1).strip()
            title = match.group(2).strip()
            location = match.group(3).strip() if match.group(3) else "Remote"

            if not title or len(title) < 3:
                continue
            if title.lower().startswith("learn more"):
                continue
            if len(company) > 80 or "resume" in company.lower() or "discord" in company.lower():
                continue

            jobs.append({
                "title": title[:200],
                "company": company[:100],
                "location": location[:100],
                "remote": "remote" in location.lower() or "anywhere" in location.lower(),
                "description": "",
                "url": source_url,
                "source": "workwithindies",
                "postDate": "",
                "contentHash": content_hash(title, company, location),
            })

    except Exception as e:
        try:
            r.close()
        except Exception:
            pass
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs[:60]


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
