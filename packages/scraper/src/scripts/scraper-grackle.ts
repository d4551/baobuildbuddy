import { extractGrackleJobs } from "../providers/grackle";
import { runPortalScraperScript } from "../runtime/scraper-script";

process.exitCode = await runPortalScraperScript(extractGrackleJobs);
