import type { CareerProgress, WeeklyActivity } from "@bao/shared/types/search";
type ActionHistoryEntry = {
    action: string;
    xpGained: number;
    timestamp: string;
};
export declare const parseActionHistory: <T>(value: T) => ActionHistoryEntry[];
export declare const buildWeeklyActivity: (actionHistory: ActionHistoryEntry[]) => WeeklyActivity;
export declare const buildCareerProgress: (mappedSkills: number, applicationStatuses: string[]) => CareerProgress;
export {};
