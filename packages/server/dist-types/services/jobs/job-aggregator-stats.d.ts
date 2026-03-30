export declare const needsRefresh: (cacheExpiry: number) => Promise<boolean>;
export declare const getJobStats: () => Promise<{
    total: number;
    bySource: Record<string, number>;
    byExperienceLevel: Record<string, number>;
    remoteCount: number;
    lastUpdated: string | null;
}>;
