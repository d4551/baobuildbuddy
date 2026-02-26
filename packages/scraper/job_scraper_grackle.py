#!/usr/bin/env python3
"""
GrackleHQ job scraper using RPA-Python.
Scrapes gaming industry job listings from gracklehq.com/jobs and outputs JSON.
"""
import json
import hashlib
import re
import sys

DEFAULT_SOURCE_URL = "https://gracklehq.com/jobs"

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
    return f"grackle-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


AGE_PATTERN = re.compile(r"^<?\d+d?$")


def scrape_jobs() -> list[dict]:
    jobs: list[dict] = []
    source_url = resolve_source_url()
    try:
        r.init(turbo_mode=True, headless_mode=True)
        r.url(source_url)
        r.wait(4)
        body = r.read("body") or ""
        r.close()

        if not body or len(body) < 100:
            return jobs

        lines = [ln.strip() for ln in body.split("\n") if ln.strip()]
        in_jobs = False
        current_title: str | None = None

        for line in lines:
            if "results" in line.lower() and not in_jobs:
                in_jobs = True
                continue
            if not in_jobs:
                continue
            if line.startswith("Filters") or line.startswith("Department"):
                break
            if AGE_PATTERN.match(line):
                continue

            if " - " in line and len(line) < 250 and current_title:
                parts = line.split(" - ", 1)
                company = parts[0].strip()
                location = parts[1].strip() if len(parts) > 1 else "Remote"
                if AGE_PATTERN.match(company):
                    current_title = None
                    continue
                jobs.append({
                    "title": current_title[:200],
                    "company": company[:100],
                    "location": location[:100],
                    "remote": "remote" in location.lower(),
                    "description": "",
                    "url": source_url,
                    "source": "grackle",
                    "postedDate": "",
                    "contentHash": content_hash(current_title, company, location),
                })
                current_title = None
            elif line and len(line) > 5 and len(line) < 250 and not AGE_PATTERN.match(line):
                current_title = line

    except Exception as e:
        try:
            r.close()
        except Exception:
            pass
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs[:50]


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
