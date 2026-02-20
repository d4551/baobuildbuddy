#!/usr/bin/env python3
"""
Work With Indies job scraper using RPA-Python.
Scrapes indie game studio job listings from workwithindies.com and outputs JSON.
"""
import json
import hashlib
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


def scrape_jobs() -> list[dict]:
    jobs = []
    source_url = resolve_source_url()
    try:
        r.init(turbo_mode=True)
        r.url(source_url)
        r.wait(5)  # Jetboost/JS-rendered, needs extra load time

        # Extract jobs from career links - site uses a[href*="/careers/"] pattern
        # Text format: "Company is hiring a Title to join..."
        js_extract = """
        (function() {
            var results = [];
            var links = document.querySelectorAll('a[href*="/careers/"]');
            links.forEach(function(link) {
                var text = (link.textContent || '').replace(/\\s+/g, ' ').trim();
                if (!text || text.length < 10) return;

                var title = '';
                var company = '';
                var location = 'Remote';

                // Parse "Company is hiring a Title" pattern
                var hiringMatch = text.match(/^(.+?)\\s+is hiring\\s+(?:a |an )?(.+?)(?:\\s+to\\s+|$)/i);
                if (hiringMatch) {
                    company = hiringMatch[1].trim();
                    title = hiringMatch[2].trim();
                } else {
                    // Fallback: use full text as title
                    title = text.substring(0, 150);
                }

                // Look for location hints
                var locMatch = text.match(/(?:work from|based in|located in)\\s+(?:the\\s+)?(.+?)(?:\\.|$)/i);
                if (locMatch) {
                    location = locMatch[1].trim();
                }

                if (title) {
                    results.push({
                        title: title.substring(0, 200),
                        company: company || 'Unknown',
                        location: location,
                        url: link.href || ''
                    });
                }
            });
            return JSON.stringify(results);
        })()
        """
        raw = r.dom(js_extract)
        r.close()

        if raw and isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = []

            for item in parsed[:60]:
                title = item.get("title", "").strip()
                if not title or len(title) < 3:
                    continue
                company = item.get("company", "Unknown")
                loc = item.get("location", "Remote")
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "remote": "remote" in loc.lower() or "anywhere" in loc.lower(),
                    "description": "",
                    "url": item.get("url", source_url),
                    "source": "workwithindies",
                    "postedDate": "",
                    "contentHash": content_hash(title, company, loc),
                })
    except Exception as e:
        try:
            r.close()
        except Exception:
            pass
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
