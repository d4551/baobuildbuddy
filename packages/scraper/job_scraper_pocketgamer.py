#!/usr/bin/env python3
"""
PocketGamer.biz job scraper using RPA-Python.
Scrapes games industry jobs from pocketgamer.biz/jobs and outputs JSON.
"""
import json
import hashlib
import sys

try:
    import rpa as r
except ImportError:
    print(json.dumps({"error": "RPA not installed. Run: pip install rpa"}), file=sys.stderr)
    sys.exit(1)


def content_hash(title: str, company: str, location: str) -> str:
    raw = f"{title}|{company}|{location}".lower().strip()
    return f"pg-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_jobs() -> list[dict]:
    jobs = []
    try:
        r.init(turbo_mode=True)
        r.url("https://www.pocketgamer.biz/jobs/")
        r.wait(4)

        # PocketGamer uses <article> elements inside .featured and .index containers
        # Job titles in h1, company in .cat, description in .strap
        js_extract = """
        (function() {
            var results = [];
            var articles = document.querySelectorAll('article');
            articles.forEach(function(article) {
                var link = article.querySelector('a[href]');
                var titleEl = article.querySelector('h1, h2, h3, [class*="title"]');
                var companyEl = article.querySelector('.cat, [class*="company"], [class*="publisher"]');
                var descEl = article.querySelector('.strap, [class*="description"], [class*="summary"], p');

                var title = titleEl ? titleEl.textContent.trim() : '';
                if (!title || title.length < 3) return;

                var company = companyEl ? companyEl.textContent.trim() : 'Unknown';
                var description = descEl ? descEl.textContent.trim() : '';
                var url = link ? link.href : '';

                // Try to extract location from description
                var location = 'Unknown';
                var locMatch = description.match(/((?:London|Manchester|Brighton|Helsinki|Stockholm|Berlin|Paris|Montreal|Toronto|Vancouver|Tokyo|Seoul|Singapore|San Francisco|Los Angeles|New York|Austin|Seattle|Irvine|Remote|Worldwide|UK|USA|US|Europe)[^,.]*)/i);
                if (locMatch) {
                    location = locMatch[1].trim();
                }

                results.push({
                    title: title.substring(0, 200),
                    company: company.substring(0, 100),
                    location: location.substring(0, 100),
                    description: description.substring(0, 500),
                    url: url
                });
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

            for item in parsed[:40]:
                title = item.get("title", "").strip()
                if not title or len(title) < 3:
                    continue
                company = item.get("company", "Unknown")
                loc = item.get("location", "Unknown")
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "remote": "remote" in loc.lower(),
                    "description": item.get("description", ""),
                    "url": item.get("url", "https://www.pocketgamer.biz/jobs/"),
                    "source": "pocketgamer",
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
