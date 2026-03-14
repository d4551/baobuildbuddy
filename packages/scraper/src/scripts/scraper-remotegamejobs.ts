import { extractRemoteGameJobs } from "../providers/remotegamejobs";
import { runPortalScraperScript } from "../runtime/scraper-script";

process.exitCode = await runPortalScraperScript(extractRemoteGameJobs);
