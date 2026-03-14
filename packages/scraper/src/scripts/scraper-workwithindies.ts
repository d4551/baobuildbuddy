import { extractWorkWithIndiesJobs } from "../providers/workwithindies";
import { runPortalScraperScript } from "../runtime/scraper-script";

process.exitCode = await runPortalScraperScript(extractWorkWithIndiesJobs);
