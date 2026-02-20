#!/usr/bin/env python3
"""
GamesJobsDirect scraper using RPA-Python.
Scrapes gaming industry jobs from gamesjobsdirect.com and outputs JSON.
Covers UK, USA, Canada, and Australia gaming positions.
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
    return f"gjd-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"


def scrape_page() -> list[dict]:
    """Extract jobs from the current page."""
    js_extract = """
    (function() {
        var results = [];
        // GamesJobsDirect uses <li> elements with job links containing /job/ path
        var items = document.querySelectorAll('li, [class*="job-item"], [class*="listing"]');
        items.forEach(function(item) {
            var link = item.querySelector('a[href*="/job/"]');
            if (!link) return;

            var title = (link.textContent || '').trim();
            if (!title || title.length < 3 || title === 'View & apply') return;

            var fullText = item.textContent.replace(/\\s+/g, ' ').trim();
            var company = 'Unknown';
            var location = 'Unknown';

            // Try to extract company and location from surrounding text
            var parts = fullText.replace(title, '').trim();

            // Look for location patterns (city names, countries)
            var locMatch = parts.match(/((?:London|Manchester|Brighton|Liverpool|Edinburgh|Glasgow|Bristol|Leeds|Birmingham|Oxford|Cambridge|Sheffield|Newcastle|Montreal|Toronto|Vancouver|Sydney|Melbourne|Los Angeles|San Francisco|New York|Austin|Seattle|Irvine|Boston|Chicago|Remote|Worldwide|UK|USA|US|Canada|Australia)[^,]*)/i);
            if (locMatch) {
                location = locMatch[1].trim().substring(0, 100);
            }

            // Company is usually mentioned after location or as separate text
            var companyMatch = parts.match(/(?:at|by|for|-)\\s+([A-Z][^,.|]+)/);
            if (companyMatch) {
                company = companyMatch[1].trim().substring(0, 100);
            }

            results.push({
                title: title.substring(0, 200),
                company: company,
                location: location,
                url: link.href || ''
            });
        });

        // Deduplicate by title+company
        var seen = {};
        return JSON.stringify(results.filter(function(j) {
            var key = j.title + '|' + j.company;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        }));
    })()
    """
    raw = r.dom(js_extract)
    if raw and isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return []
    return []


def scrape_jobs() -> list[dict]:
    jobs = []
    try:
        r.init(turbo_mode=True)
        r.url("https://www.gamesjobsdirect.com/results")
        r.wait(4)

        # Scrape first 2 pages
        for page in range(2):
            page_jobs = scrape_page()
            for item in page_jobs:
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
                    "description": "",
                    "url": item.get("url", "https://www.gamesjobsdirect.com/results"),
                    "source": "gamesjobsdirect",
                    "postedDate": "",
                    "contentHash": content_hash(title, company, loc),
                })

            # Try to go to next page
            if page < 1:
                try:
                    r.url(f"https://www.gamesjobsdirect.com/results?page={page + 2}")
                    r.wait(3)
                except Exception:
                    break

        r.close()
    except Exception as e:
        try:
            r.close()
        except Exception:
            pass
        print(f"Scraper error: {e}", file=sys.stderr)

    return jobs[:80]  # Cap at 80 jobs across pages


if __name__ == "__main__":
    result = scrape_jobs()
    print(json.dumps(result, indent=2))
