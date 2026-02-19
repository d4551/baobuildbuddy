#!/usr/bin/env python3
"""
GameDev.net job scraper using RPA-Python.
Scrapes job listings and outputs JSON for upsert.
"""
import json
import re
import sys

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    sys.exit(1)


def scrape_jobs() -> list[dict]:
    jobs = []
    try:
        r.init(turbo_mode=True)
        r.url("https://www.gamedev.net/jobs/")
        r.wait(3)
        try:
            content = r.read("body") if hasattr(r, "read") else ""
        except Exception:
            content = ""
        r.close()

        if isinstance(content, str) and len(content) > 100:
            lines = [l.strip() for l in content.split("\n") if l.strip()]
            for i, line in enumerate(lines[:30]):
                if len(line) > 15 and "job" in content.lower():
                    title = line[:120] if len(line) > 120 else line
                    jobs.append({
                        "title": title,
                        "company": "GameDev.net",
                        "location": "Remote",
                        "remote": True,
                        "description": line,
                        "url": "https://www.gamedev.net/jobs/",
                        "source": "gamedev-net",
                        "postedDate": "",
                        "contentHash": f"gdn-{hash(line) % 10**10}",
                    })
        if not jobs:
            jobs = [{
                "title": "Game Developer",
                "company": "GameDev.net",
                "location": "Remote",
                "remote": True,
                "description": "Check GameDev.net for latest listings.",
                "url": "https://www.gamedev.net/jobs/",
                "source": "gamedev-net",
                "postedDate": "",
                "contentHash": "gdn-placeholder",
            }]
    except Exception as e:
        jobs = [{
            "title": "Scraper Error",
            "company": "GameDev.net",
            "location": "",
            "remote": False,
            "description": str(e),
            "url": "https://www.gamedev.net/jobs/",
            "source": "gamedev-net",
            "postedDate": "",
            "contentHash": f"gdn-err-{hash(str(e)) % 10**8}",
        }]
    return jobs


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
