type SearchType = "jobs" | "studios" | "skills" | "resumes";
interface SearchResult {
    type: SearchType;
    id: string;
    title: string;
    subtitle: string;
    snippet: string;
    relevance: number;
}
export interface UnifiedSearchResult {
    query: string;
    results: SearchResult[];
    counts: Record<SearchType, number>;
    totalTime: number;
}
export declare class SearchService {
    searchAll(query: string, types?: SearchType[]): Promise<UnifiedSearchResult>;
    autocomplete(prefix: string): Array<{
        text: string;
        type: string;
    }>;
}
export declare const searchService: SearchService;
export {};
