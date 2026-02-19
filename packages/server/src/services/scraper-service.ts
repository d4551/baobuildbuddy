import { generateId } from "@navi/shared";
import { eq } from "drizzle-orm";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";

const SCRAPER_DIR = join(process.cwd(), "..", "scraper");

async function runPythonScript(scriptName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(SCRAPER_DIR, scriptName);
    const python = process.platform === "win32" ? "python" : "python3";
    const proc = spawn(python, [scriptPath], {
      cwd: SCRAPER_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr?.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Script exited ${code}: ${stderr || stdout}`));
      } else {
        resolve(stdout);
      }
    });
    proc.on("error", (err) => reject(err));
  });
}

export interface ScrapedStudio {
  id: string;
  name: string;
  website?: string;
  location?: string;
  size?: string;
  type?: string;
  description?: string;
}

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  remote?: boolean;
  description?: string;
  url?: string;
  source?: string;
  postedDate?: string;
  contentHash?: string;
}

export class ScraperService {
  async scrapeStudios(): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;
    try {
      const output = await runPythonScript("studio_scraper.py");
      const raw = JSON.parse(output);
      const items = Array.isArray(raw) ? raw : raw && typeof raw === "object" && "error" in raw ? [] : [raw];
      const list = items.filter((x): x is ScrapedStudio => x && typeof x === "object" && typeof (x as ScrapedStudio).name === "string");
      scraped = list.length;
      const now = new Date().toISOString();
      for (const s of list) {
        try {
          const id = String(s.id || generateId()).trim() || generateId();
          await db
            .insert(studios)
            .values({
              id,
              name: String(s.name || "").slice(0, 200),
              logo: null,
              website: s.website ? String(s.website).slice(0, 500) : null,
              location: s.location ? String(s.location).slice(0, 200) : null,
              size: s.size ? String(s.size).slice(0, 50) : null,
              type: s.type ? String(s.type).slice(0, 50) : null,
              description: s.description ? String(s.description).slice(0, 2000) : null,
              games: [],
              technologies: [],
              culture: null,
              interviewStyle: null,
              remoteWork: null,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: studios.id,
              set: {
                name: String(s.name || "").slice(0, 200),
                website: s.website ? String(s.website).slice(0, 500) : null,
                location: s.location ? String(s.location).slice(0, 200) : null,
                size: s.size ? String(s.size).slice(0, 50) : null,
                type: s.type ? String(s.type).slice(0, 50) : null,
                description: s.description ? String(s.description).slice(0, 2000) : null,
                updatedAt: now,
              },
            });
          upserted++;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
        }
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    return { scraped, upserted, errors };
  }

  async scrapeGameDevNetJobsRaw(): Promise<ScrapedJob[]> {
    const output = await runPythonScript("job_scraper_gamedev.py");
    const raw = JSON.parse(output);
    const items = Array.isArray(raw) ? raw : raw && typeof raw === "object" && "error" in raw ? [] : [raw];
    return items.filter((x): x is ScrapedJob => x && typeof x === "object" && typeof (x as ScrapedJob).title === "string");
  }

  async scrapeGameDevNetJobs(): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;
    try {
      const list = await this.scrapeGameDevNetJobsRaw();
      scraped = list.length;
      const now = new Date().toISOString();
      for (const j of list) {
        try {
          const contentHash = String(j.contentHash || `gdn-${generateId()}`).slice(0, 100);
          const existing = await db.select().from(jobs).where(eq(jobs.contentHash, contentHash));
          if (existing.length > 0) continue; // dedupe by contentHash
          const id = generateId();
          await db.insert(jobs).values({
            id,
            title: String(j.title || "").slice(0, 200),
            company: String(j.company || "Unknown").slice(0, 200),
            location: String(j.location || "Unknown").slice(0, 200),
            remote: !!j.remote,
            hybrid: false,
            description: j.description ? String(j.description).slice(0, 5000) : null,
            url: j.url ? String(j.url).slice(0, 500) : null,
            source: j.source || "gamedev-net",
            contentHash,
            postedDate: j.postedDate ? String(j.postedDate).slice(0, 50) : null,
            type: "full-time",
            createdAt: now,
            updatedAt: now,
          });
          upserted++;
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
        }
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    return { scraped, upserted, errors };
  }
}

export const scraperService = new ScraperService();
