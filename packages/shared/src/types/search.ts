/**
 * Search and statistics types for dashboard and unified search
 */

export interface SearchResult {
  id: string;
  type: "job" | "studio" | "skill" | "resume" | "cover-letter";
  title: string;
  description?: string;
  matchScore?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  query: string;
  filters?: Record<string, string>;
}

export interface AutocompleteResult {
  value: string;
  type: string;
  label?: string;
}

export interface AutomationStats {
  totalRuns: number;
  successfulRuns: number;
  successRate: number;
  todayRuns: number;
  recentRuns: Array<{ id: string; type: string; status: string; createdAt: string }>;
}

export interface DashboardStats {
  profile: { completeness: number };
  jobs: { saved: number; applied: number; interviewing: number; offered: number };
  resumes: { count: number; lastUpdated: string | null };
  coverLetters: { count: number };
  portfolio: { projectCount: number };
  interviews: { totalSessions: number; averageScore: number | null };
  skills: { mappedCount: number };
  ai: { chatMessages: number; chatSessions: number };
  gamification: { level: number; xp: number; achievements: number; streak: number };
  automation: AutomationStats;
}

export interface WeeklyActivity {
  days: Array<{ date: string; actions: number; xpEarned: number }>;
  topCategory: string;
  totalXP: number;
}

export interface CareerProgress {
  skillCoverage: number;
  applicationSuccessRate: number;
  interviewTrend: number[];
}
