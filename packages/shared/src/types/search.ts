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

export interface DashboardStats {
  totalJobs: number;
  totalResumes: number;
  totalApplications: number;
  totalInterviews: number;
  totalStudios: number;
  totalSkillMappings: number;
  recentActivity: number;
}

export interface WeeklyActivity {
  date: string;
  actions: number;
  xpEarned: number;
  category?: string;
}

export interface CareerProgress {
  skillsGrowth: number;
  applicationsGrowth: number;
  interviewsGrowth: number;
  overallScore: number;
}
