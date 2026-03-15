import type {
  AIProviderType,
  AutomationSettings,
  EmailTransportSettings,
  NotificationPreferences,
} from "@bao/shared";
import {
  AI_PROVIDER_ID_LIST,
  API_ERROR_INIT_SETTINGS_ROW,
  API_ERROR_INVALID_AUTOMATION_PAYLOAD,
  API_ERROR_LOAD_SETTINGS,
  API_ERROR_UNKNOWN_PROVIDER,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  AI_PROVIDER_TEST_STRATEGY_BY_ID,
  APP_LANGUAGE_CODES,
  AUTOMATION_BROWSER_OPTIONS,
  automationSettingsSchema,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_SETTINGS_ID,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
  emailTransportSettingsSchema,
  MAX_PORT,
  MIN_PORT,
  SCHEMA_MAX_LENGTH_API_KEY,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MODEL,
  SCHEMA_MAX_LENGTH_SETTINGS_LABEL,
  SCHEMA_MAX_LENGTH_SETTINGS_URL,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_BOARD_RESULT_LIMIT,
  SCHEMA_MAX_PAGES_MAX,
  SCHEMA_MAX_PAGES_MIN,
  SCHEMA_PROVIDER_TIMEOUT_MAX_MS,
  SCHEMA_PROVIDER_TIMEOUT_MIN_MS,
  SCHEMA_MAX_ITEMS_BOARDS,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_ID,
  settle,
  SPEECH_PROVIDER_OPTIONS,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { DATA_EXPORT_VERSION } from "../services/data-service";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  RATE_LIMIT_SETTINGS_DURATION_MS,
  RATE_LIMIT_SETTINGS_MAX_REQUESTS,
} from "../config/rate-limit";

const VALID_PROVIDERS = AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]];
const KEY_MASK_VISIBLE_CHARS = 4;

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
  "hitmarker",
  "grackle",
  "workwithindies",
  "remotegamejobs",
  "gamesjobsdirect",
  "pocketgamer",
] as const;

const LANGUAGE_CODES = APP_LANGUAGE_CODES;
const AUTOMATION_BROWSER_IDS = AUTOMATION_BROWSER_OPTIONS;
const EMAIL_TRANSPORT_SECURITY_IDS = EMAIL_TRANSPORT_SECURITY_OPTIONS;
const EMAIL_TRANSPORT_AUTH_MODE_IDS = EMAIL_TRANSPORT_AUTH_MODE_OPTIONS;
const SPEECH_PROVIDER_IDS = SPEECH_PROVIDER_OPTIONS;

const [
  SPEECH_PROVIDER_BROWSER,
  SPEECH_PROVIDER_OPENAI,
  SPEECH_PROVIDER_HUGGINGFACE,
  SPEECH_PROVIDER_LOCAL,
  SPEECH_PROVIDER_CUSTOM,
] = SPEECH_PROVIDER_IDS;
const [
  COMPANY_BOARD_GREENHOUSE,
  COMPANY_BOARD_LEVER,
  COMPANY_BOARD_RECRUITEE,
  COMPANY_BOARD_WORKABLE,
  COMPANY_BOARD_ASHBY,
  COMPANY_BOARD_SMARTRECRUITERS,
  COMPANY_BOARD_TEAMTAILOR,
  COMPANY_BOARD_WORKDAY,
] = COMPANY_BOARD_PROVIDER_TYPES;
const [
  GAMING_PORTAL_HITMARKER,
  GAMING_PORTAL_GRACKLE,
  GAMING_PORTAL_WORKWITHINDIES,
  GAMING_PORTAL_REMOTEGAMEJOBS,
  GAMING_PORTAL_GAMESJOBS_DIRECT,
  GAMING_PORTAL_POCKETGAMER,
] = GAMING_PORTAL_IDS;
const [PROVIDER_GEMINI, PROVIDER_CLAUDE, PROVIDER_OPENAI, PROVIDER_HUGGINGFACE, PROVIDER_LOCAL] =
  VALID_PROVIDERS;
const [AUTOMATION_BROWSER_CHROME, AUTOMATION_BROWSER_CHROMIUM, AUTOMATION_BROWSER_EDGE] =
  AUTOMATION_BROWSER_IDS;
const [APP_LANGUAGE_EN_US, APP_LANGUAGE_ES_ES, APP_LANGUAGE_FR_FR, APP_LANGUAGE_JA_JP] =
  LANGUAGE_CODES;
const [
  EMAIL_TRANSPORT_SECURITY_TLS,
  EMAIL_TRANSPORT_SECURITY_STARTTLS,
  EMAIL_TRANSPORT_SECURITY_PLAIN,
] = EMAIL_TRANSPORT_SECURITY_IDS;
const [EMAIL_TRANSPORT_AUTH_PLAIN, EMAIL_TRANSPORT_AUTH_LOGIN] = EMAIL_TRANSPORT_AUTH_MODE_IDS;

const speechProviderBodySchema = t.Union([
  t.Literal(SPEECH_PROVIDER_BROWSER),
  t.Literal(SPEECH_PROVIDER_OPENAI),
  t.Literal(SPEECH_PROVIDER_HUGGINGFACE),
  t.Literal(SPEECH_PROVIDER_LOCAL),
  t.Literal(SPEECH_PROVIDER_CUSTOM),
]);

const companyBoardTypeBodySchema = t.Union([
  t.Literal(COMPANY_BOARD_GREENHOUSE),
  t.Literal(COMPANY_BOARD_LEVER),
  t.Literal(COMPANY_BOARD_RECRUITEE),
  t.Literal(COMPANY_BOARD_WORKABLE),
  t.Literal(COMPANY_BOARD_ASHBY),
  t.Literal(COMPANY_BOARD_SMARTRECRUITERS),
  t.Literal(COMPANY_BOARD_TEAMTAILOR),
  t.Literal(COMPANY_BOARD_WORKDAY),
]);

const gamingPortalIdBodySchema = t.Union([
  t.Literal(GAMING_PORTAL_HITMARKER),
  t.Literal(GAMING_PORTAL_GRACKLE),
  t.Literal(GAMING_PORTAL_WORKWITHINDIES),
  t.Literal(GAMING_PORTAL_REMOTEGAMEJOBS),
  t.Literal(GAMING_PORTAL_GAMESJOBS_DIRECT),
  t.Literal(GAMING_PORTAL_POCKETGAMER),
]);

const preferredProviderBodySchema = t.Union([
  t.Literal(PROVIDER_GEMINI),
  t.Literal(PROVIDER_CLAUDE),
  t.Literal(PROVIDER_OPENAI),
  t.Literal(PROVIDER_HUGGINGFACE),
  t.Literal(PROVIDER_LOCAL),
]);

const browserBodySchema = t.Union([
  t.Literal(AUTOMATION_BROWSER_CHROME),
  t.Literal(AUTOMATION_BROWSER_CHROMIUM),
  t.Literal(AUTOMATION_BROWSER_EDGE),
]);

const emailTransportSecurityBodySchema = t.Union([
  t.Literal(EMAIL_TRANSPORT_SECURITY_TLS),
  t.Literal(EMAIL_TRANSPORT_SECURITY_STARTTLS),
  t.Literal(EMAIL_TRANSPORT_SECURITY_PLAIN),
]);

const emailTransportAuthModeBodySchema = t.Union([
  t.Literal(EMAIL_TRANSPORT_AUTH_PLAIN),
  t.Literal(EMAIL_TRANSPORT_AUTH_LOGIN),
]);

const languageBodySchema = t.Union([
  t.Literal(APP_LANGUAGE_EN_US),
  t.Literal(APP_LANGUAGE_ES_ES),
  t.Literal(APP_LANGUAGE_FR_FR),
  t.Literal(APP_LANGUAGE_JA_JP),
]);

const apiProviderBodySchema = preferredProviderBodySchema;

const companyBoardApiTemplatesBodySchema = t.Object({
  greenhouse: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  lever: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  recruitee: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  workable: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  ashby: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  smartrecruiters: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  teamtailor: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  workday: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
});

const companyBoardConfigBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  token: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  type: companyBoardTypeBodySchema,
  enabled: t.Boolean(),
  priority: t.Number({ minimum: 0, maximum: 1000 }),
});

const greenhouseBoardConfigBodySchema = t.Object({
  board: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  company: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  enabled: t.Boolean(),
});

const leverCompanyConfigBodySchema = t.Object({
  slug: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  company: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  enabled: t.Boolean(),
});

const gamingPortalConfigBodySchema = t.Object({
  id: gamingPortalIdBodySchema,
  name: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  source: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  fallbackUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  enabled: t.Boolean(),
});

const jobProviderSettingsBodySchema = t.Object({
  providerTimeoutMs: t.Number({
    minimum: SCHEMA_PROVIDER_TIMEOUT_MIN_MS,
    maximum: SCHEMA_PROVIDER_TIMEOUT_MAX_MS,
  }),
  companyBoardResultLimit: t.Number({ minimum: 1, maximum: SCHEMA_MAX_BOARD_RESULT_LIMIT }),
  gamingBoardResultLimit: t.Number({ minimum: 1, maximum: SCHEMA_MAX_BOARD_RESULT_LIMIT }),
  unknownLocationLabel: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
  unknownCompanyLabel: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
  hitmarkerApiBaseUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  hitmarkerDefaultQuery: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
  hitmarkerDefaultLocation: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
  greenhouseApiBaseUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  greenhouseMaxPages: t.Number({ minimum: SCHEMA_MAX_PAGES_MIN, maximum: SCHEMA_MAX_PAGES_MAX }),
  greenhouseBoards: t.Array(greenhouseBoardConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
  leverApiBaseUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  leverMaxPages: t.Number({ minimum: SCHEMA_MAX_PAGES_MIN, maximum: SCHEMA_MAX_PAGES_MAX }),
  leverCompanies: t.Array(leverCompanyConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
  companyBoardApiTemplates: companyBoardApiTemplatesBodySchema,
  companyBoards: t.Array(companyBoardConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
  gamingPortals: t.Array(gamingPortalConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
});

const speechSettingsBodySchema = t.Object({
  locale: t.String({ minLength: 2, maxLength: SCHEMA_MAX_LENGTH_MICRO }),
  stt: t.Object({
    provider: speechProviderBodySchema,
    model: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_MODEL }),
    endpoint: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  }),
  tts: t.Object({
    provider: speechProviderBodySchema,
    model: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_MODEL }),
    endpoint: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
    voice: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    format: t.Union([t.Literal("mp3"), t.Literal("wav")]),
  }),
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
const emailTransportSettingsPatchSchema = emailTransportSettingsSchema.removeDefault().partial();

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

  if (!(currentParsed.success && patchParsed.success)) {
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

const mergeEmailTransportSettings = (
  current: EmailTransportSettings | null | undefined,
  patch: Partial<EmailTransportSettings> | null | undefined,
): EmailTransportSettings | null => {
  const currentParsed = emailTransportSettingsSchema.safeParse(
    current ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  );
  const patchParsed = emailTransportSettingsPatchSchema.safeParse(patch ?? {});

  if (!(currentParsed.success && patchParsed.success)) {
    return null;
  }

  const mergedCandidate: EmailTransportSettings = {
    ...currentParsed.data,
    ...patchParsed.data,
  };

  const mergedParsed = emailTransportSettingsSchema.safeParse(mergedCandidate);
  if (!mergedParsed.success) {
    return null;
  }

  return mergedParsed.data;
};

const readOrCreateSettingsRow = async () => {
  let rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  if (rows.length === 0) {
    await db.insert(settings).values({ id: DEFAULT_SETTINGS_ID });
    rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  }

  return rows[0] ?? null;
};

interface SettingsUpdateInput {
  preferredProvider?: AIProviderType;
  preferredModel?: string;
  theme?: "bao-light" | "bao-dark";
  language?: (typeof APP_LANGUAGE_CODES)[number];
  notifications?: Partial<NotificationPreferences>;
  automationSettings?: Partial<AutomationSettings>;
  emailTransportSettings?: Partial<EmailTransportSettings>;
}

const buildSettingsUpdate = (
  existingRow: typeof settings.$inferSelect,
  body: SettingsUpdateInput,
): Partial<typeof settings.$inferInsert> | null => {
  const update: Partial<typeof settings.$inferInsert> = {};

  if (body.preferredProvider !== undefined) update.preferredProvider = body.preferredProvider;
  if (body.preferredModel !== undefined) update.preferredModel = body.preferredModel;
  if (body.theme !== undefined) update.theme = body.theme;
  if (body.language !== undefined) update.language = body.language;

  if (body.notifications !== undefined) {
    const mergedNotifications = mergeNotifications(existingRow.notifications, body.notifications);
    update.notifications = toNotificationRecord(mergedNotifications);
  }

  if (body.automationSettings !== undefined) {
    const mergedAutomationSettings = mergeAutomationSettings(
      existingRow.automationSettings,
      body.automationSettings,
    );
    if (!mergedAutomationSettings) {
      return null;
    }

    update.automationSettings = mergedAutomationSettings;
  }

  if (body.emailTransportSettings !== undefined) {
    const mergedEmailTransportSettings = mergeEmailTransportSettings(
      existingRow.emailTransportSettings,
      body.emailTransportSettings,
    );
    if (!mergedEmailTransportSettings) {
      return null;
    }

    update.emailTransportSettings = mergedEmailTransportSettings;
  }

  return update;
};

export const settingsRoutes = new Elysia({ prefix: "/settings", tags: ["Settings"] })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: RATE_LIMIT_SETTINGS_DURATION_MS,
      max: RATE_LIMIT_SETTINGS_MAX_REQUESTS,
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
      return { error: API_ERROR_LOAD_SETTINGS };
    }

    const { emailTransportPassword, ...publicRow } = row;

    return {
      ...publicRow,
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
      hasGeminiKey: Boolean(row.geminiApiKey),
      hasOpenaiKey: Boolean(row.openaiApiKey),
      hasClaudeKey: Boolean(row.claudeApiKey),
      hasHuggingfaceToken: Boolean(row.huggingfaceToken),
      hasEmailTransportPassword: Boolean(emailTransportPassword),
      hasLocalKey: Boolean(row.localModelEndpoint),
    };
  })
  .put(
    "/",
    async ({ body, set }) => {
      const existingRow = await readOrCreateSettingsRow();
      if (!existingRow) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return { success: false, error: API_ERROR_INIT_SETTINGS_ROW };
      }

      const update = buildSettingsUpdate(existingRow, body);
      if (!update) {
        set.status = HTTP_STATUS_UNPROCESSABLE_ENTITY;
        return {
          success: false,
          error: API_ERROR_INVALID_AUTOMATION_PAYLOAD,
        };
      }

      await db
        .update(settings)
        .set({ ...update, updatedAt: new Date().toISOString() })
        .where(eq(settings.id, DEFAULT_SETTINGS_ID));

      return { success: true };
    },
    {
      body: t.Object({
        preferredProvider: t.Optional(preferredProviderBodySchema),
        preferredModel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
        theme: t.Optional(t.Union([t.Literal("bao-light"), t.Literal("bao-dark")])),
        language: t.Optional(languageBodySchema),
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
            defaultBrowser: t.Optional(browserBodySchema),
            enableSmartSelectors: t.Optional(t.Boolean()),
            autoSaveScreenshots: t.Optional(t.Boolean()),
            speech: t.Optional(speechSettingsBodySchema),
            jobProviders: t.Optional(jobProviderSettingsBodySchema),
          }),
        ),
        emailTransportSettings: t.Optional(
          t.Object({
            host: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL })),
            port: t.Optional(t.Number({ minimum: MIN_PORT, maximum: MAX_PORT })),
            security: t.Optional(emailTransportSecurityBodySchema),
            username: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
            fromEmail: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
            fromName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL })),
            authMethod: t.Optional(emailTransportAuthModeBodySchema),
            connectionTimeoutSeconds: t.Optional(t.Number({ minimum: 1, maximum: 120 })),
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
      if (body.emailTransportPassword !== undefined) {
        update.emailTransportPassword =
          body.emailTransportPassword.length > 0 ? body.emailTransportPassword : null;
      }
      update.updatedAt = new Date().toISOString();

      await db.update(settings).set(update).where(eq(settings.id, DEFAULT_SETTINGS_ID));
      return { success: true };
    },
    {
      body: t.Object({
        geminiApiKey: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
        openaiApiKey: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
        claudeApiKey: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
        huggingfaceToken: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
        localModelEndpoint: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
        localModelName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
        emailTransportPassword: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
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
          error: API_ERROR_UNKNOWN_PROVIDER,
        };
      }

      const endpointInput = body.provider === "local" ? body.key : "unused";
      const requestUrl = strategy.buildUrl(body.key, endpointInput);
      const requestInit = strategy.buildInit(body.key);

      const responseResult = await settle(fetch(requestUrl, requestInit));
      if (responseResult.status === "rejected") {
        return { valid: false, provider: body.provider };
      }

      return { valid: strategy.isSuccess(responseResult.value.status), provider: body.provider };
    },
    {
      body: t.Object({
        provider: apiProviderBodySchema,
        key: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_API_KEY }),
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
