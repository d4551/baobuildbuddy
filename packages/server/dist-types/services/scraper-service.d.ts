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
export declare class ScraperService {
    private scrapeJobBoard;
    scrapeStudios(): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
    scrapeGameDevNetJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeGrackleJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeWorkWithIndiesJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeRemoteGameJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeGamesJobsDirectRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapePocketGamerJobsRaw(sourceUrl?: string): Promise<ScrapedJob[]>;
    scrapeGameDevNetJobs(): Promise<{
        scraped: number;
        upserted: number;
        errors: string[];
    }>;
}
export declare const scraperService: ScraperService;
