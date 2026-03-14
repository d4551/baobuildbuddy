import { extractPocketGamerJobs } from "../providers/pocketgamer";
import { runPortalScraperScript } from "../runtime/scraper-script";

process.exitCode = await runPortalScraperScript(extractPocketGamerJobs);
