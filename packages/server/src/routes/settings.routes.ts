import {
  AI_PROVIDER_ID_LIST,
  AI_PROVIDER_TEST_STRATEGY_BY_ID,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_SETTINGS_ID,
  automationSettingsSchema,
} from "@bao/shared";
import type { AIProviderType, AutomationSettings, NotificationPreferences } from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { DATA_EXPORT_VERSION } from "../services/data-service";

const VALID_PROVIDERS = AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]];

const SETTINGS_RATE_LIMIT_DURATION_MS = 60_000;
const SETTINGS_RATE_LIMIT_MAX_REQUESTS = 10;
const KEY_MASK_VISIBLE_CHARS = 4;
const MODEL_MAX_LENGTH = 200;
const LANGUAGE_MAX_LENGTH = 10;
const API_KEY_MAX_LENGTH = 500;
const SETTINGS_LABEL_MAX_LENGTH = 120;
const URL_MAX_LENGTH = 200;

const COMPANY_BOARD_PROVIDER_TYPES = [
  "greenhouse",
  "lever",
  "recruitee",
  "workable",
  "ashby",
  "smartrecruiters",
  "teamtailor",
  "workday",
] as const;

const GAMING_PORTAL_IDS = [
  "gamedev-net",
  "grackle",
  "workwithindies",
  "remotegamejobs",
  "gamesjobsdirect",
  "pocketgamer",
] as const;

const companyBoardApiTemplatesBodySchema = t.Object({
  greenhouse: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  lever: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  recruitee: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  workable: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  ashby: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  smartrecruiters: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  teamtailor: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  workday: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
});

const companyBoardConfigBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  token: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  type: t.Union(COMPANY_BOARD_PROVIDER_TYPES.map((providerType) => t.Literal(providerType))),
  enabled: t.Boolean(),
  priority: t.Number({ minimum: 0, maximum: 1000 }),
});

const greenhouseBoardConfigBodySchema = t.Object({
  board: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  company: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  enabled: t.Boolean(),
});

const leverCompanyConfigBodySchema = t.Object({
  slug: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  company: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  enabled: t.Boolean(),
});

const gamingPortalConfigBodySchema = t.Object({
  id: t.Union(GAMING_PORTAL_IDS.map((portalId) => t.Literal(portalId))),
  name: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  source: t.String({ minLength: 1, maxLength: SETTINGS_LABEL_MAX_LENGTH }),
  fallbackUrl: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  enabled: t.Boolean(),
});

const jobProviderSettingsBodySchema = t.Object({
  providerTimeoutMs: t.Number({ minimum: 1000, maximum: 120000 }),
  companyBoardResultLimit: t.Number({ minimum: 1, maximum: 200 }),
  gamingBoardResultLimit: t.Number({ minimum: 1, maximum: 200 }),
  unknownLocationLabel: t.String({ minLength: 1, maxLength: 100 }),
  unknownCompanyLabel: t.String({ minLength: 1, maxLength: 100 }),
  hitmarkerApiBaseUrl: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  hitmarkerDefaultQuery: t.String({ minLength: 1, maxLength: 100 }),
  hitmarkerDefaultLocation: t.String({ minLength: 1, maxLength: 100 }),
  greenhouseApiBaseUrl: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  greenhouseMaxPages: t.Number({ minimum: 1, maximum: 20 }),
  greenhouseBoards: t.Array(greenhouseBoardConfigBodySchema, { maxItems: 500 }),
  leverApiBaseUrl: t.String({ minLength: 1, maxLength: URL_MAX_LENGTH }),
  leverMaxPages: t.Number({ minimum: 1, maximum: 20 }),
  leverCompanies: t.Array(leverCompanyConfigBodySchema, { maxItems: 500 }),
  companyBoardApiTemplates: companyBoardApiTemplatesBodySchema,
  companyBoards: t.Array(companyBoardConfigBodySchema, { maxItems: 500 }),
  gamingPortals: t.Array(gamingPortalConfigBodySchema, { maxItems: 50 }),
});

const jsonValueBodySchema = t.Recursive((Self) =>
  t.Union([
    t.String(),
    t.Number(),
    t.Boolean(),
    t.Null(),
    t.Array(Self),
    t.Record(t.String(), Self),
  ]),
);

const nullableJsonValueBodySchema = t.Union([jsonValueBodySchema, t.Null()]);

const automationSettingsPatchSchema = automationSettingsSchema.removeDefault().partial();

const normalizeNotificationPreferences = (
  current: Record<string, boolean> | NotificationPreferences | null | undefined,
): NotificationPreferences => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  achievements:
    typeof current?.achievements === "boolean"
      ? current.achievements
      : DEFAULT_NOTIFICATION_PREFERENCES.achievements,
  dailyChallenges:
    typeof current?.dailyChallenges === "boolean"
      ? current.dailyChallenges
      : DEFAULT_NOTIFICATION_PREFERENCES.dailyChallenges,
  levelUp:
    typeof current?.levelUp === "boolean"
      ? current.levelUp
      : DEFAULT_NOTIFICATION_PREFERENCES.levelUp,
  jobAlerts:
    typeof current?.jobAlerts === "boolean"
      ? current.jobAlerts
      : DEFAULT_NOTIFICATION_PREFERENCES.jobAlerts,
});

const toNotificationRecord = (value: NotificationPreferences): Record<string, boolean> => ({
  achievements: value.achievements,
  dailyChallenges: value.dailyChallenges,
  levelUp: value.levelUp,
  jobAlerts: value.jobAlerts,
});

const mergeNotifications = (
  current: Record<string, boolean> | NotificationPreferences | null | undefined,
  patch: Partial<NotificationPreferences> | null | undefined,
): NotificationPreferences => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...normalizeNotificationPreferences(current),
  ...(patch ?? {}),
});

const mergeAutomationSettings = (
  current: AutomationSettings | null | undefined,
  patch: Partial<AutomationSettings> | null | undefined,
): AutomationSettings | null => {
  const currentParsed = automationSettingsSchema.safeParse(current);
  const patchParsed = automationSettingsPatchSchema.safeParse(patch ?? {});

  if (!currentParsed.success || !patchParsed.success) {
    return null;
  }

  const mergedCandidate: AutomationSettings = {
    ...currentParsed.data,
    ...patchParsed.data,
    jobProviders: patchParsed.data.jobProviders ?? currentParsed.data.jobProviders,
  };

  const mergedParsed = automationSettingsSchema.safeParse(mergedCandidate);
  if (!mergedParsed.success) {
    return null;
  }

  return mergedParsed.data;
};

const resolveRateLimitClientKey = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    const firstHop = forwardedFor.split(",")[0]?.trim();
    if (firstHop) return firstHop;
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip");
  if (cloudflareIp && cloudflareIp.trim().length > 0) {
    return cloudflareIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return new URL(request.url).host;
};

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: SETTINGS_RATE_LIMIT_DURATION_MS,
      max: SETTINGS_RATE_LIMIT_MAX_REQUESTS,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .get("/", async () => {
    let rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
    if (rows.length === 0) {
      await db.insert(settings).values({ id: DEFAULT_SETTINGS_ID });
      rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
    }

    const row = rows[0];
    if (!row) {
      return { error: "Failed to load settings" };
    }

    return {
      ...row,
      geminiApiKey: row.geminiApiKey
        ? `***${row.geminiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}`
        : null,
      openaiApiKey: row.openaiApiKey
        ? `***${row.openaiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}`
        : null,
      claudeApiKey: row.claudeApiKey
        ? `***${row.claudeApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}`
        : null,
      huggingfaceToken: row.huggingfaceToken
        ? `***${row.huggingfaceToken.slice(-KEY_MASK_VISIBLE_CHARS)}`
        : null,
      hasGeminiKey: !!row.geminiApiKey,
      hasOpenaiKey: !!row.openaiApiKey,
      hasClaudeKey: !!row.claudeApiKey,
      hasHuggingfaceToken: !!row.huggingfaceToken,
      hasLocalKey: !!row.localModelEndpoint,
    };
  })
  .put(
    "/",
    async ({ body, set }) => {
      let existing = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
      if (existing.length === 0) {
        await db.insert(settings).values({ id: DEFAULT_SETTINGS_ID });
        existing = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
      }

      const existingRow = existing[0];
      if (!existingRow) {
        set.status = 500;
        return { success: false, error: "Failed to initialize settings row" };
      }

      const update: Partial<typeof settings.$inferInsert> = {};

      if (body.preferredProvider !== undefined) update.preferredProvider = body.preferredProvider;
      if (body.preferredModel !== undefined) update.preferredModel = body.preferredModel;
      if (body.theme !== undefined) update.theme = body.theme;
      if (body.language !== undefined) update.language = body.language;

      if (body.notifications !== undefined) {
        const mergedNotifications = mergeNotifications(
          existingRow.notifications,
          body.notifications,
        );
        update.notifications = toNotificationRecord(mergedNotifications);
      }

      if (body.automationSettings !== undefined) {
        const mergedAutomationSettings = mergeAutomationSettings(
          existingRow.automationSettings,
          body.automationSettings,
        );

        if (!mergedAutomationSettings) {
          set.status = 422;
          return {
            success: false,
            error: "Invalid automationSettings payload",
          };
        }

        update.automationSettings = mergedAutomationSettings;
      }

      await db
        .update(settings)
        .set({ ...update, updatedAt: new Date().toISOString() })
        .where(eq(settings.id, DEFAULT_SETTINGS_ID));

      return { success: true };
    },
    {
      body: t.Object({
        preferredProvider: t.Optional(
          t.Union(VALID_PROVIDERS.map((provider) => t.Literal(provider))),
        ),
        preferredModel: t.Optional(t.String({ maxLength: MODEL_MAX_LENGTH })),
        theme: t.Optional(t.Union([t.Literal("bao-light"), t.Literal("bao-dark")])),
        language: t.Optional(t.String({ maxLength: LANGUAGE_MAX_LENGTH })),
        notifications: t.Optional(
          t.Object({
            achievements: t.Optional(t.Boolean()),
            dailyChallenges: t.Optional(t.Boolean()),
            jobAlerts: t.Optional(t.Boolean()),
            levelUp: t.Optional(t.Boolean()),
          }),
        ),
        automationSettings: t.Optional(
          t.Object({
            headless: t.Optional(t.Boolean()),
            defaultTimeout: t.Optional(t.Number({ minimum: 1, maximum: 120 })),
            screenshotRetention: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
            maxConcurrentRuns: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
            defaultBrowser: t.Optional(
              t.Union([t.Literal("chrome"), t.Literal("chromium"), t.Literal("edge")]),
            ),
            enableSmartSelectors: t.Optional(t.Boolean()),
            autoSaveScreenshots: t.Optional(t.Boolean()),
            jobProviders: t.Optional(jobProviderSettingsBodySchema),
          }),
        ),
      }),
    },
  )
  .put(
    "/api-keys",
    async ({ body }) => {
      const existing = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
      if (existing.length === 0) {
        await db.insert(settings).values({ id: DEFAULT_SETTINGS_ID });
      }

      const update: Partial<typeof settings.$inferInsert> = {};
      if (body.geminiApiKey !== undefined) update.geminiApiKey = body.geminiApiKey;
      if (body.openaiApiKey !== undefined) update.openaiApiKey = body.openaiApiKey;
      if (body.claudeApiKey !== undefined) update.claudeApiKey = body.claudeApiKey;
      if (body.huggingfaceToken !== undefined) update.huggingfaceToken = body.huggingfaceToken;
      if (body.localModelEndpoint !== undefined)
        update.localModelEndpoint = body.localModelEndpoint;
      if (body.localModelName !== undefined) update.localModelName = body.localModelName;
      update.updatedAt = new Date().toISOString();

      await db.update(settings).set(update).where(eq(settings.id, DEFAULT_SETTINGS_ID));
      return { success: true };
    },
    {
      body: t.Object({
        geminiApiKey: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        openaiApiKey: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        claudeApiKey: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        huggingfaceToken: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        localModelEndpoint: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        localModelName: t.Optional(t.String({ maxLength: MODEL_MAX_LENGTH })),
      }),
    },
  )
  .post(
    "/test-api-key",
    async ({ body }) => {
      const strategy = (() => {
        switch (body.provider) {
          case "gemini":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.gemini;
          case "openai":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.openai;
          case "claude":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.claude;
          case "local":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.local;
          case "huggingface":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.huggingface;
          default:
            return null;
        }
      })();

      if (!strategy) {
        return {
          valid: false,
          provider: body.provider,
          error: "Unknown provider",
        };
      }

      const endpointInput = body.provider === "local" ? body.key : "unused";
      const requestUrl = strategy.buildUrl(body.key, endpointInput);
      const requestInit = strategy.buildInit(body.key);

      try {
        const response = await fetch(requestUrl, requestInit).catch(() => null);
        if (!response) {
          return { valid: false, provider: body.provider };
        }
        return { valid: strategy.isSuccess(response.status), provider: body.provider };
      } catch {
        return { valid: false, provider: body.provider, error: "Connection failed" };
      }
    },
    {
      body: t.Object({
        provider: t.Union(VALID_PROVIDERS.map((provider) => t.Literal(provider))),
        key: t.String({ minLength: 1, maxLength: API_KEY_MAX_LENGTH }),
      }),
    },
  )
  .get("/export", async () => {
    const { dataService } = await import("../services/data-service");
    return dataService.exportAll();
  })
  .post(
    "/import",
    async ({ body }) => {
      const { dataService } = await import("../services/data-service");
      const payload = {
        version: body.version,
        exportedAt: body.exportedAt,
        profile: body.profile,
        settings: body.settings,
        resumes: body.resumes,
        coverLetters: body.coverLetters,
        portfolio: body.portfolio,
        portfolioProjects: body.portfolioProjects,
        interviewSessions: body.interviewSessions,
        gamification: body.gamification,
        skillMappings: body.skillMappings,
        savedJobs: body.savedJobs,
        applications: body.applications,
        chatHistory: body.chatHistory,
      };
      return dataService.importAll(payload);
    },
    {
      body: t.Object({
        version: t.Literal(DATA_EXPORT_VERSION),
        exportedAt: t.String(),
        profile: nullableJsonValueBodySchema,
        settings: nullableJsonValueBodySchema,
        resumes: t.Array(jsonValueBodySchema),
        coverLetters: t.Array(jsonValueBodySchema),
        portfolio: nullableJsonValueBodySchema,
        portfolioProjects: t.Array(jsonValueBodySchema),
        interviewSessions: t.Array(jsonValueBodySchema),
        gamification: nullableJsonValueBodySchema,
        applications: t.Array(jsonValueBodySchema),
        chatHistory: t.Array(jsonValueBodySchema),
        savedJobs: t.Array(jsonValueBodySchema),
        skillMappings: t.Array(jsonValueBodySchema),
      }),
    },
  );
