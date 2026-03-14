import { extractHitmarkerJobs } from "../providers/hitmarker";
import { runPortalScraperScript } from "../runtime/scraper-script";

process.exitCode = await runPortalScraperScript(extractHitmarkerJobs);
