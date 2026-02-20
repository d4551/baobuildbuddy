import type { CareerProgress, DashboardStats, WeeklyActivity } from "@bao/shared";
export declare class StatisticsService {
    getDashboardStats(): Promise<DashboardStats>;
    getWeeklyActivity(): Promise<WeeklyActivity>;
    getCareerProgress(): Promise<CareerProgress>;
}
export declare const statisticsService: StatisticsService;
