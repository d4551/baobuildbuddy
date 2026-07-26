import type { ApiEnvelope } from "./client-api-contracts";

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
  get(options?: { query?: { q?: string; types?: string } }): ApiRequest<{
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

export interface AutomationVerifyContextPayload {
  resumeId: string;
}

export interface AutomationRunsApi {
  get(options?: { query?: { type?: string; status?: string } }): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    get(): ApiRequest<unknown>;
  };
}

export interface AutomationApi {
  verify: {
    context: {
      get(): ApiRequest<AutomationVerifyContextPayload>;
    };
  };
  capabilities: {
    get(): ApiRequest<unknown>;
  };
  runs: AutomationRunsApi;
  "job-apply": {
    post(body: {
      jobUrl: string;
      resumeId: string;
      coverLetterId?: string;
      jobId?: string;
      customAnswers?: Record<string, string>;
      runAt?: string;
    }): ApiRequest<unknown>;
    schedule: {
      post(body: {
        jobUrl: string;
        resumeId: string;
        runAt: string;
        coverLetterId?: string;
        jobId?: string;
        customAnswers?: Record<string, string>;
      }): ApiRequest<unknown>;
    };
  };
  "email-response": {
    post(body: {
      subject: string;
      message: string;
      sender?: string;
      tone?: string;
      recipientEmail?: string;
      deliverAfterGeneration?: boolean;
      runAt?: string;
    }): ApiRequest<unknown>;
    schedule: {
      post(body: {
        subject: string;
        message: string;
        runAt: string;
        sender?: string;
        tone?: string;
        recipientEmail?: string;
        deliverAfterGeneration?: boolean;
      }): ApiRequest<unknown>;
    };
  };
  scrape: {
    post(body: { target: string }): ApiRequest<unknown>;
    schedule: {
      post(body: { target: string; runAt: string }): ApiRequest<unknown>;
    };
  };
}

export interface ScraperApi {
  studios: {
    post(body?: Record<string, never>): ApiRequest<{
      success: boolean;
      message?: string;
      count?: number;
    }>;
  };
  jobs: {
    [portalId: string]: {
      post(body?: Record<string, never>): ApiRequest<{
        success: boolean;
        message?: string;
        count?: number;
      }>;
    };
  };
}
