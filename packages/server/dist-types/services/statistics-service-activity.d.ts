import type { CareerProgress, WeeklyActivity } from "@bao/shared/types/search";
type ActionHistoryEntry = {
    action: string;
    xpGained: number;
    timestamp: string;
};
export declare const parseActionHistory: (value: unknown) => ActionHistoryEntry[];
export declare const buildWeeklyActivity: (actionHistory: ActionHistoryEntry[]) => WeeklyActivity;
export declare const buildCareerProgress: (mappedSkills: number, applicationStatuses: string[]) => CareerProgress;
export {};
