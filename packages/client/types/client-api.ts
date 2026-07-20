import { isRecord } from "@bao/shared/utils/type-guards";
import type {
  AiApi,
  AuthApi,
  CoverLettersApi,
  GamificationApi,
  InterviewApi,
  PortfolioApi,
  ResumesApi,
  SettingsApi,
  SkillsApi,
  StatsApi,
  UserApi,
} from "./client-api-contracts";
import type { JobsApi, StudiosApi } from "./client-api-jobs-studios";
import type { AutomationApi, ScraperApi, SearchApi } from "./client-api-workspace";
export type {
  AutomationApi,
  ScraperApi,
  SearchApi,
  SettingsWorkspaceExportPayload,
} from "./client-api-workspace";

export interface ClientApi {
  auth: AuthApi;
  user: UserApi;
  settings: SettingsApi;
  jobs: JobsApi;
  resumes: ResumesApi;
  /** Eden path segment is kebab-case (`/api/cover-letters`); camelCase 404s. */
  "cover-letters": CoverLettersApi;
  portfolio: PortfolioApi;
  interview: InterviewApi;
  ai: AiApi;
  gamification: GamificationApi;
  skills: SkillsApi;
  stats: StatsApi;
  studios: StudiosApi;
  automation: AutomationApi;
  search: SearchApi;
  scraper: ScraperApi;
}

const REQUIRED_API_BRANCHES = [
  "auth",
  "user",
  "settings",
  "jobs",
  "resumes",
  "cover-letters",
  "portfolio",
  "interview",
  "ai",
  "gamification",
  "skills",
  "stats",
  "studios",
  "automation",
  "search",
  "scraper",
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
