type ApiError = unknown;

export interface ApiEnvelope<TData = unknown> {
  data: TData | null;
  error: ApiError;
}

type ApiRequest<TData = unknown> = Promise<ApiEnvelope<TData>>;

export interface SettingsWorkspaceExportPayload {
  version: string;
  exportedAt: string;
  profile?: unknown;
  settings?: unknown;
  resumes?: unknown[];
  coverLetters?: unknown[];
  portfolio?: unknown;
  portfolioProjects?: unknown[];
  interviewSessions?: unknown[];
  gamification?: unknown;
  skillMappings?: unknown[];
  savedJobs?: unknown[];
  applications?: unknown[];
  chatHistory?: unknown[];
}

export interface SettingsWorkspaceBackupApi {
  export: {
    get(): ApiRequest<SettingsWorkspaceExportPayload>;
  };
  import: {
    post(body: SettingsWorkspaceExportPayload): ApiRequest<{ success: boolean }>;
  };
}

export interface SearchApi {
  get(options?: {
    query?: { q?: string; types?: string };
  }): ApiRequest<{
    query: string;
    results: Array<{
      type: string;
      id: string;
      title: string;
      subtitle: string;
      snippet: string;
      relevance: number;
    }>;
    counts: Record<string, number>;
    totalTime: number;
  }>;
  autocomplete: {
    get(options?: {
      query?: { prefix?: string };
    }): ApiRequest<Array<{ text: string; type: string }>>;
  };
}
