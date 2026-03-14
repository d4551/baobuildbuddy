import { extractGamesJobsDirectJobs } from "../providers/gamesjobsdirect";
import { runPortalScraperScript } from "../runtime/scraper-script";

process.exitCode = await runPortalScraperScript(extractGamesJobsDirectJobs);
