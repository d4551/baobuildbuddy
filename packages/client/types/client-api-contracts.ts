import type { AppDataTheme } from "@bao/shared/constants/branding";
import type { AppLanguageCode } from "@bao/shared/constants/settings";
import type { AIProviderType, AIRouting } from "@bao/shared/types/ai";
import type {
  Achievement,
  DailyChallenge,
  UserGamificationData,
} from "@bao/shared/types/gamification";
import type { InterviewConfig } from "@bao/shared/types/interview";
import type { JobTaxonomySettings } from "@bao/shared/types/jobs-taxonomy";
import type { PortfolioMetadata, PortfolioProject } from "@bao/shared/types/portfolio";
import type { CareerProgress, DashboardStats, WeeklyActivity } from "@bao/shared/types/search";
import type {
  AutomationSettings,
  BrandSettingsPatch,
  EmailTransportSettings,
  NotificationPreferences,
} from "@bao/shared/types/settings-contracts";
import type { UserProfile } from "@bao/shared/types/user";
import type { ClientProviderTestResult } from "~/utils/ai-control-plane";
import type { SettingsWorkspaceBackupApi } from "./client-api-workspace";

export type {
  SearchApi,
  SettingsWorkspaceBackupApi,
  SettingsWorkspaceExportPayload,
} from "./client-api-workspace";

type ApiError = unknown;

export interface ApiEnvelope<TData = unknown> {
  data: TData | null;
  error: ApiError;
}

type ApiRequest<TData = unknown> = Promise<ApiEnvelope<TData>>;

type JsonRecord = object;

export interface AuthStatusResponse {
  authRequired: boolean;
  bootstrapRequired: boolean;
  configured: boolean;
  setupTokenConfigured: boolean;
}

export interface AuthInitRequest {
  setupToken?: string;
}

export interface AuthInitResponse {
  configured: boolean;
  apiKey?: string;
  message?: string;
}

export interface DailyChallengesResponse {
  challenges: DailyChallenge[];
  completedCount: number;
  totalCount: number;
  date: string;
}

export interface SettingsUpdateRequest {
  aiRouting?: AIRouting;
  preferredProvider?: AIProviderType;
  preferredModel?: string;
  theme?: AppDataTheme;
  language?: AppLanguageCode;
  brandSettings?: BrandSettingsPatch;
  notifications?: Partial<NotificationPreferences>;
  automationSettings?: Partial<AutomationSettings>;
  emailTransportSettings?: Partial<EmailTransportSettings>;
}

export interface SettingsApiKeysUpdateRequest {
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  huggingfaceToken?: string;
  localModelEndpoint?: string;
  localModelName?: string;
  emailTransportPassword?: string;
}

export interface ProviderTestRequest {
  provider: AIProviderType;
  key: string;
  model?: string;
}

export interface PortfolioUpdateRequest {
  metadata: Partial<PortfolioMetadata>;
}

export interface PortfolioExportRequest {
  format?: string;
}

export interface OrderedProjectsRequest {
  orderedIds: string[];
}

export interface JobsQueryRequest {
  query?: Record<string, string>;
}

export interface SkillsReadinessQueryRequest {
  query?: {
    jobId?: string;
  };
}

export interface AuthApi {
  status: {
    get(): ApiRequest<AuthStatusResponse>;
  };
  configured: {
    get(): ApiRequest<{ configured: boolean }>;
  };
  init: {
    post(body?: AuthInitRequest): ApiRequest<AuthInitResponse>;
  };
  rotate: {
    post(): ApiRequest<{ configured: boolean; apiKey?: string; message?: string }>;
  };
  revoke: {
    post(): ApiRequest<{ configured: boolean; message?: string }>;
  };
}

export interface UserApi {
  profile: {
    get(): ApiRequest<unknown>;
    put(body: Partial<UserProfile>): ApiRequest<unknown>;
  };
}

export interface StudioAnalyticsApi {
  get(): ApiRequest<unknown>;
}

export interface SettingsApi extends SettingsWorkspaceBackupApi {
  get(): ApiRequest<unknown>;
  put(body: SettingsUpdateRequest): ApiRequest<{ success: boolean }>;
  "api-keys": {
    put(body: SettingsApiKeysUpdateRequest): ApiRequest<{ success: boolean }>;
  };
  "job-taxonomy": {
    put(body: JobTaxonomySettings): ApiRequest<{ success: boolean }>;
  };
  "test-api-key": {
    post(body: ProviderTestRequest): ApiRequest<ClientProviderTestResult>;
  };
}

export interface JobsSaveRoute {
  post(body: { jobId: string }): ApiRequest<unknown>;
  (params: {
    jobId: string;
  }): {
    delete(): ApiRequest<unknown>;
  };
}

export interface JobsApplyRoute {
  post(body: { jobId: string; notes?: string }): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    put(body: { status: string }): ApiRequest<unknown>;
  };
}

export interface JobsApi {
  get(options?: JobsQueryRequest): ApiRequest<unknown>;
  saved: {
    get(): ApiRequest<unknown>;
  };
  save: JobsSaveRoute;
  applications: {
    get(): ApiRequest<unknown>;
  };
  apply: JobsApplyRoute;
  refresh: {
    post(): ApiRequest<unknown>;
  };
  recommendations: {
    get(): ApiRequest<unknown>;
  };
}

export interface CoverLettersApi {
  get(): ApiRequest<unknown>;
  post(body: JsonRecord): ApiRequest<unknown>;
  generate: {
    post(body: JsonRecord): ApiRequest<unknown>;
  };
}

export interface ResumesRoute {
  get(): ApiRequest<unknown>;
  post(body: JsonRecord): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    get(): ApiRequest<unknown>;
    put(body: JsonRecord): ApiRequest<unknown>;
    delete(): ApiRequest<{ success: boolean; id: string }>;
    export: {
      post(body: JsonRecord): ApiRequest<unknown>;
    };
    "ai-enhance": {
      post(body: JsonRecord): ApiRequest<unknown>;
    };
    "ai-score": {
      post(body: { jobId: string }): ApiRequest<unknown>;
    };
  };
}

export interface ResumesApi extends ResumesRoute {
  "from-questions": {
    generate: {
      post(body: {
        targetRole: string;
        studioName?: string;
        experienceLevel?: string;
      }): ApiRequest<unknown>;
    };
    synthesize: {
      post(body: {
        questionsAndAnswers: Array<{
          id: string;
          question: string;
          answer: string;
          category: string;
        }>;
      }): ApiRequest<unknown>;
    };
  };
}

export interface PortfolioProjectsRoute {
  post(body: JsonRecord): ApiRequest<unknown>;
  reorder: {
    post(body: OrderedProjectsRequest): ApiRequest<unknown>;
  };
  (params: {
    id: string;
  }): {
    put(body: Partial<PortfolioProject>): ApiRequest<unknown>;
    delete(): ApiRequest<unknown>;
  };
}

export interface PortfolioApi {
  get(): ApiRequest<unknown>;
  put(body: PortfolioUpdateRequest): ApiRequest<unknown>;
  projects: PortfolioProjectsRoute;
  export: {
    post(body: PortfolioExportRequest): ApiRequest<unknown>;
  };
}

export interface InterviewSessionsRoute {
  get(): ApiRequest<unknown>;
  post(body: { studioId: string; config?: Partial<InterviewConfig> }): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    get(): ApiRequest<unknown>;
    response: {
      post(body: {
        questionId?: string;
        questionIndex?: number;
        response: string;
      }): ApiRequest<unknown>;
    };
    complete: {
      post(): ApiRequest<unknown>;
    };
  };
}

export interface InterviewApi {
  sessions: InterviewSessionsRoute;
  stats: {
    get(): ApiRequest<Record<string, number>>;
  };
}

export interface AiApi {
  chat: {
    post(body: JsonRecord): ApiRequest<unknown>;
  };
  "analyze-resume": {
    post(body: { resumeId: string }): ApiRequest<unknown>;
  };
  "generate-cover-letter": {
    post(body: JsonRecord): ApiRequest<unknown>;
  };
  "match-jobs": {
    post(body: { resumeId?: string; skills?: string[] }): ApiRequest<unknown>;
  };
  "automation-action": {
    post(body: {
      action: string;
      jobUrl: string;
      resumeId: string;
      coverLetterId?: string;
      jobId?: string;
    }): ApiRequest<{ runId?: string; status?: string; message?: string; error?: string }>;
  };
  models: {
    get(): ApiRequest<unknown>;
  };
  usage: {
    get(): ApiRequest<unknown>;
  };
}

export interface GamificationChallengesRoute {
  get(): ApiRequest<DailyChallengesResponse>;
  (params: {
    id: string;
  }): {
    complete: {
      post(): ApiRequest<unknown>;
    };
  };
}

export interface GamificationApi {
  progress: {
    get(): ApiRequest<UserGamificationData>;
  };
  achievements: {
    get(): ApiRequest<Achievement[]>;
  };
  challenges: GamificationChallengesRoute;
  weekly: {
    get(): ApiRequest<unknown>;
  };
  monthly: {
    get(): ApiRequest<unknown>;
  };
  "award-xp": {
    post(body: { amount: number; reason: string }): ApiRequest<unknown>;
  };
}

export interface SkillsMappingsRoute {
  get(): ApiRequest<unknown>;
  post(body: JsonRecord): ApiRequest<unknown>;
  (params: {
    id: string;
  }): {
    put(body: JsonRecord): ApiRequest<unknown>;
    delete(): ApiRequest<unknown>;
  };
}

export interface SkillsApi {
  mappings: SkillsMappingsRoute;
  pathways: {
    get(): ApiRequest<unknown>;
  };
  readiness: {
    get(options?: SkillsReadinessQueryRequest): ApiRequest<unknown>;
  };
  "ai-analyze": {
    post(body: JsonRecord): ApiRequest<unknown>;
  };
}

export interface StatsApi {
  dashboard: {
    get(): ApiRequest<DashboardStats>;
  };
  weekly: {
    get(): ApiRequest<WeeklyActivity>;
  };
  career: {
    get(): ApiRequest<CareerProgress>;
  };
}
