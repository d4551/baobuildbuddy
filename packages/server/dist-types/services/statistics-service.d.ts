import type { CareerProgress, DashboardStats, WeeklyActivity } from "@bao/shared";
export declare class StatisticsService {
    private runBestEffort;
    getDashboardStats(): Promise<DashboardStats>;
    private getProfileCompleteness;
    private getJobStats;
    private getResumeStats;
    private getCoverLetterCount;
    private getPortfolioProjectCount;
    private getInterviewStats;
    private getMappedSkillCount;
    private getAiStats;
    private getGamificationStats;
    private getAutomationStats;
    getWeeklyActivity(): Promise<WeeklyActivity>;
    getCareerProgress(): Promise<CareerProgress>;
}
export declare const statisticsService: StatisticsService;
