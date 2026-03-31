import { isRecord } from "@bao/shared/utils/type-guards";
import type {
  AiApi,
  AuthApi,
  CoverLettersApi,
  GamificationApi,
  InterviewApi,
  JobsApi,
  PortfolioApi,
  ResumesApi,
  SettingsApi,
  SkillsApi,
  StatsApi,
  StudioAnalyticsApi,
  UserApi,
} from "./client-api-contracts";

export interface ClientApi {
  auth: AuthApi;
  user: UserApi;
  settings: SettingsApi;
  jobs: JobsApi;
  resumes: ResumesApi;
  coverLetters: CoverLettersApi;
  portfolio: PortfolioApi;
  interview: InterviewApi;
  ai: AiApi;
  gamification: GamificationApi;
  skills: SkillsApi;
  stats: StatsApi;
  studios: {
    analytics: StudioAnalyticsApi;
  };
}

const REQUIRED_API_BRANCHES = [
  "auth",
  "user",
  "settings",
  "jobs",
  "resumes",
  "coverLetters",
  "portfolio",
  "interview",
  "ai",
  "gamification",
  "skills",
  "stats",
  "studios",
] as const satisfies readonly (keyof ClientApi)[];

const isRouteGroup = (value: unknown): value is object =>
  typeof value === "function" || isRecord(value);

export function assertClientApi(value: unknown): asserts value is ClientApi {
  if (!isRouteGroup(value)) {
    throw new Error("Nuxt API client is unavailable.");
  }

  for (const branch of REQUIRED_API_BRANCHES) {
    if (!isRouteGroup(Reflect.get(value, branch))) {
      throw new Error(`Nuxt API client is missing the '${branch}' route group.`);
    }
  }
}
