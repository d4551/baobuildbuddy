import { type SearchResultType } from "@bao/shared/constants/search";
import type { SearchResult } from "@bao/shared/types/search";
type SearchType = SearchResultType;
export interface UnifiedSearchResult {
    query: string;
    results: SearchResult[];
    counts: Record<SearchType, number>;
    totalTime: number;
}
export declare class SearchService {
    private runTableQuery;
    private searchJobs;
    private searchStudios;
    private searchSkills;
    private searchResumes;
    private searchCoverLetters;
    private searchPortfolioProjects;
    private searchInterviewSessions;
    private searchAutomationRuns;
    private collectAutocomplete;
    private searchByType;
    searchAll(query: string, types?: SearchType[]): Promise<UnifiedSearchResult>;
    autocomplete(prefix: string): Promise<Array<{
        text: string;
        type: string;
    }>>;
}
export declare const searchService: SearchService;
export {};
