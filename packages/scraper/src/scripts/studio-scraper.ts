/**
 * Emits the curated bundled studio directory as the script result.
 * No live scraping is performed; rows ship with the package.
 */
import { STUDIO_SCRAPER_ROWS } from "../data/studios.generated";
import { writeJsonResult } from "../runtime/io";

writeJsonResult(STUDIO_SCRAPER_ROWS);
