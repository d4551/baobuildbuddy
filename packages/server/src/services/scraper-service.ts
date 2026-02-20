import { join } from "node:path";
import { generateId } from "@bao/shared";
import { eq } from "drizzle-orm";
import { SCRAPER_DIR } from "../config/paths";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { studios } from "../db/schema/studios";

type ScriptInputPayload = {
  sourceUrl?: string;
};

async function runPythonScript(scriptName: string, payload?: ScriptInputPayload): Promise<string> {
  const scriptPath = join(SCRAPER_DIR, scriptName);
  const python = process.platform === "win32" ? "python" : "python3";
  const proc = Bun.spawn([python, scriptPath], {
    cwd: SCRAPER_DIR,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (proc.stdin) {
    proc.stdin.write(JSON.stringify(payload ?? {}));
    proc.stdin.end();
  }

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Script exited ${exitCode}: ${stderr || stdout}`);
  }
  return stdout;
}

export interface ScrapedStudio {
  id: string;
  name: string;
  website?: string;
  location?: string;
  size?: string;
  type?: string;
  description?: string;
  games?: string[];
  technologies?: string[];
  interviewStyle?: string;
  remoteWork?: boolean | null;
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
  private async scrapeJobBoard(scriptName: string, sourceUrl?: string): Promise<ScrapedJob[]> {
    const output = await runPythonScript(scriptName, sourceUrl ? { sourceUrl } : undefined);
    const raw = JSON.parse(output);
    const items = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object" && "error" in raw
        ? []
        : [raw];
    return items.filter(
      (x): x is ScrapedJob =>
        x && typeof x === "object" && typeof (x as ScrapedJob).title === "string",
    );
  }

  async scrapeStudios(): Promise<{ scraped: number; upserted: number; errors: string[] }> {
    const errors: string[] = [];
    let scraped = 0;
    let upserted = 0;
    try {
      const output = await runPythonScript("studio_scraper.py");
      const raw = JSON.parse(output);
      const items = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object" && "error" in raw
          ? []
          : [raw];
      const list = items.filter(
        (x): x is ScrapedStudio =>
          x && typeof x === "object" && typeof (x as ScrapedStudio).name === "string",
      );
      scraped = list.length;
      const now = new Date().toISOString();
      for (const s of list) {
        try {
          const id = String(s.id || generateId()).trim() || generateId();
          const studioData = {
            name: String(s.name || "").slice(0, 200),
            website: s.website ? String(s.website).slice(0, 500) : null,
            location: s.location ? String(s.location).slice(0, 200) : null,
            size: s.size ? String(s.size).slice(0, 50) : null,
            type: s.type ? String(s.type).slice(0, 50) : null,
            description: s.description ? String(s.description).slice(0, 2000) : null,
            games: Array.isArray(s.games) ? s.games : [],
            technologies: Array.isArray(s.technologies) ? s.technologies : [],
            interviewStyle: s.interviewStyle ? String(s.interviewStyle).slice(0, 500) : null,
            remoteWork: s.remoteWork ?? null,
          };

          await db
            .insert(studios)
            .values({
              id,
              ...studioData,
              logo: null,
              culture: null,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: studios.id,
              set: { ...studioData, updatedAt: now },
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

  async scrapeGameDevNetJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapeJobBoard("job_scraper_gamedev.py", sourceUrl);
  }

  async scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapeJobBoard("job_scraper_grackle.py", sourceUrl);
  }

  async scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapeJobBoard("job_scraper_workwithindies.py", sourceUrl);
  }

  async scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapeJobBoard("job_scraper_remotegamejobs.py", sourceUrl);
  }

  async scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapeJobBoard("job_scraper_gamesjobsdirect.py", sourceUrl);
  }

  async scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]> {
    return this.scrapeJobBoard("job_scraper_pocketgamer.py", sourceUrl);
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
