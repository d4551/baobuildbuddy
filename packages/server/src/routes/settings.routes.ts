import type {
  AIRouting,
  AIProviderType,
  AppDataTheme,
  AutomationSettings,
  BrandSettings,
  BrandSettingsPatch,
  EmailTransportSettings,
  NotificationPreferences,
} from "@bao/shared";
import {
  AI_PROVIDER_ID_LIST,
  AI_PROVIDER_TEST_STRATEGY_BY_ID,
  API_ERROR_INIT_SETTINGS_ROW,
  API_ERROR_INVALID_AUTOMATION_PAYLOAD,
  API_ERROR_LOAD_SETTINGS,
  API_ERROR_UNKNOWN_PROVIDER,
  APP_LANGUAGE_CODES,
  AUTOMATION_BROWSER_OPTIONS,
  automationSettingsSchema,
  brandSettingsPatchSchema,
  brandSettingsSchema,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_SETTINGS_ID,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
  emailTransportSettingsSchema,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  MAX_PORT,
  MIN_PORT,
  mergeBrandSettings,
  normalizeAIRouting,
  normalizeAppDataTheme,
  resolveBrandSettings,
  SCHEMA_MAX_BOARD_RESULT_LIMIT,
  SCHEMA_MAX_ITEMS_BOARDS,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_API_KEY,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_MODEL,
  SCHEMA_MAX_LENGTH_SETTINGS_LABEL,
  SCHEMA_MAX_LENGTH_SETTINGS_URL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_PAGES_MAX,
  SCHEMA_MAX_PAGES_MIN,
  SCHEMA_PROVIDER_TIMEOUT_MAX_MS,
  SCHEMA_PROVIDER_TIMEOUT_MIN_MS,
  SPEECH_PROVIDER_OPTIONS,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import {
  RATE_LIMIT_SETTINGS_DURATION_MS,
  RATE_LIMIT_SETTINGS_MAX_REQUESTS,
} from "../config/rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { DATA_EXPORT_VERSION } from "../services/data-service";
import { buildAIControlPlaneState } from "../services/ai/control-plane";
import { LocalProvider } from "../services/ai/local-provider";
import { resolveRateLimitClientKey } from "../utils/request";

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

const resolveKnownProvider = (value?: string | null): AIProviderType =>
  VALID_PROVIDERS.find((provider) => provider === value) ?? PROVIDER_LOCAL;

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

const aiRoutingTargetBodySchema = t.Object({
  provider: preferredProviderBodySchema,
  model: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
});

const aiRoutingBodySchema = t.Object({
  chat: aiRoutingTargetBodySchema,
  interviewQuestions: aiRoutingTargetBodySchema,
  interviewFeedback: aiRoutingTargetBodySchema,
  resume: aiRoutingTargetBodySchema,
  coverLetter: aiRoutingTargetBodySchema,
  emailResponse: aiRoutingTargetBodySchema,
  jobMatch: aiRoutingTargetBodySchema,
  scrapeEnrichment: aiRoutingTargetBodySchema,
  automationFieldMapping: aiRoutingTargetBodySchema,
});

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

const brandThemePaletteBodySchema = t.Object({
  base100: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  base200: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  base300: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  baseContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  primary: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  primaryContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  secondary: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  secondaryContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  accent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  accentContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  neutral: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  neutralContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  info: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  infoContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  success: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  successContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  warning: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  warningContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  error: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  errorContent: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  radiusSelector: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  radiusField: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  radiusBox: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  sizeSelector: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  sizeField: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  border: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  depth: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  noise: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
});

const brandThemePalettePatchBodySchema = t.Partial(brandThemePaletteBodySchema);

const brandTypographyBodySchema = t.Object({
  fontStylesheetUrl: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  displayFontFamily: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  bodyFontFamily: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  monoFontFamily: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
});

const brandTypographyPatchBodySchema = t.Partial(brandTypographyBodySchema);

const brandContentBodySchema = t.Object({
  tagline: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  defaultTitle: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  defaultDescription: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  contentOverrides: t.Record(
    t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  ),
});

const brandContentPatchBodySchema = t.Partial(brandContentBodySchema);

const brandSettingsPatchBodySchema = t.Partial(
  t.Object({
    name: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    assistantName: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    apiName: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    logoPath: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    faviconPath: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    typography: brandTypographyPatchBodySchema,
    lightTheme: brandThemePalettePatchBodySchema,
    darkTheme: brandThemePalettePatchBodySchema,
    content: brandContentPatchBodySchema,
  }),
);

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
  hitmarkerEnabled: t.Boolean(),
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

const mergePersistedBrandSettings = (
  current: BrandSettings | null | undefined,
  patch: BrandSettingsPatch | null | undefined,
): BrandSettings | null => {
  const currentParsed = brandSettingsSchema.safeParse(resolveBrandSettings(current));
  const patchParsed = brandSettingsPatchSchema.safeParse(patch ?? {});

  if (!(currentParsed.success && patchParsed.success)) {
    return null;
  }

  const mergedCandidate = mergeBrandSettings(currentParsed.data, patchParsed.data);
  const mergedParsed = brandSettingsSchema.safeParse(mergedCandidate);

  return mergedParsed.success ? mergedParsed.data : null;
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
  aiRouting?: AIRouting;
  preferredProvider?: AIProviderType;
  preferredModel?: string;
  theme?: AppDataTheme | "bao-light" | "bao-dark";
  language?: (typeof APP_LANGUAGE_CODES)[number];
  brandSettings?: BrandSettingsPatch;
  notifications?: Partial<NotificationPreferences>;
  automationSettings?: Partial<AutomationSettings>;
  emailTransportSettings?: Partial<EmailTransportSettings>;
}

const resolveRoutingUpdate = (
  existingRow: typeof settings.$inferSelect,
  body: SettingsUpdateInput,
):
  | {
      aiRouting: AIRouting;
      preferredProvider: AIProviderType;
      preferredModel: string | null;
    }
  | undefined => {
  const nextPreferredProvider =
    body.preferredProvider ?? resolveKnownProvider(existingRow.preferredProvider);
  const nextPreferredModel = body.preferredModel ?? existingRow.preferredModel ?? undefined;
  const shouldUpdateRouting =
    body.aiRouting !== undefined ||
    body.preferredProvider !== undefined ||
    body.preferredModel !== undefined;

  if (!shouldUpdateRouting) {
    return;
  }

  const aiRouting = normalizeAIRouting(
    body.aiRouting ?? existingRow.aiRouting,
    nextPreferredProvider,
    nextPreferredModel,
  );

  return {
    aiRouting,
    preferredProvider: aiRouting.chat.provider,
    preferredModel: aiRouting.chat.model ?? null,
  };
};

const applyBrandSettingsUpdate = (
  update: Partial<typeof settings.$inferInsert>,
  existingRow: typeof settings.$inferSelect,
  patch: BrandSettingsPatch | undefined,
): boolean => {
  if (patch === undefined) {
    return true;
  }

  const mergedBrandSettings = mergePersistedBrandSettings(existingRow.brandSettings, patch);
  if (!mergedBrandSettings) {
    return false;
  }

  update.brandSettings = mergedBrandSettings;
  return true;
};

const applyAutomationSettingsUpdate = (
  update: Partial<typeof settings.$inferInsert>,
  existingRow: typeof settings.$inferSelect,
  patch: Partial<AutomationSettings> | undefined,
): boolean => {
  if (patch === undefined) {
    return true;
  }

  const mergedAutomationSettings = mergeAutomationSettings(
    existingRow.automationSettings,
    patch,
  );
  if (!mergedAutomationSettings) {
    return false;
  }

  update.automationSettings = mergedAutomationSettings;
  return true;
};

const applyEmailTransportSettingsUpdate = (
  update: Partial<typeof settings.$inferInsert>,
  existingRow: typeof settings.$inferSelect,
  patch: Partial<EmailTransportSettings> | undefined,
): boolean => {
  if (patch === undefined) {
    return true;
  }

  const mergedEmailTransportSettings = mergeEmailTransportSettings(
    existingRow.emailTransportSettings,
    patch,
  );
  if (!mergedEmailTransportSettings) {
    return false;
  }

  update.emailTransportSettings = mergedEmailTransportSettings;
  return true;
};

const buildSettingsUpdate = (
  existingRow: typeof settings.$inferSelect,
  body: SettingsUpdateInput,
): Partial<typeof settings.$inferInsert> | null => {
  const update: Partial<typeof settings.$inferInsert> = {};
  const routingUpdate = resolveRoutingUpdate(existingRow, body);

  if (routingUpdate) {
    update.aiRouting = routingUpdate.aiRouting;
    update.preferredProvider = routingUpdate.preferredProvider;
    update.preferredModel = routingUpdate.preferredModel;
  }

  if (body.theme !== undefined) {
    update.theme = normalizeAppDataTheme(body.theme);
  }
  if (body.language !== undefined) {
    update.language = body.language;
  }
  if (!applyBrandSettingsUpdate(update, existingRow, body.brandSettings)) {
    return null;
  }

  if (body.notifications !== undefined) {
    const mergedNotifications = mergeNotifications(existingRow.notifications, body.notifications);
    update.notifications = toNotificationRecord(mergedNotifications);
  }

  if (!applyAutomationSettingsUpdate(update, existingRow, body.automationSettings)) {
    return null;
  }
  if (!applyEmailTransportSettingsUpdate(update, existingRow, body.emailTransportSettings)) {
    return null;
  }

  return update;
};

const buildSettingsResponse = async (row: typeof settings.$inferSelect) => {
  const { emailTransportPassword, ...publicRow } = row;
  const controlPlane = await buildAIControlPlaneState(row);

  return {
    ...publicRow,
    aiRouting: controlPlane.aiRouting,
    providerDiagnostics: controlPlane.providerDiagnostics,
    preferredProvider: controlPlane.preferredProvider,
    preferredModel: controlPlane.preferredModel,
    theme: normalizeAppDataTheme(row.theme),
    brandSettings: resolveBrandSettings(row.brandSettings),
    geminiApiKey: row.geminiApiKey ? `***${row.geminiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
    openaiApiKey: row.openaiApiKey ? `***${row.openaiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
    claudeApiKey: row.claudeApiKey ? `***${row.claudeApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
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
    const row = await readOrCreateSettingsRow();
    if (!row) {
      return { error: API_ERROR_LOAD_SETTINGS };
    }

    return buildSettingsResponse(row);
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
        aiRouting: t.Optional(aiRoutingBodySchema),
        preferredProvider: t.Optional(preferredProviderBodySchema),
        preferredModel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
        theme: t.Optional(
          t.Union([
            t.Literal("corporate"),
            t.Literal("business"),
            t.Literal("bao-light"),
            t.Literal("bao-dark"),
          ]),
        ),
        language: t.Optional(languageBodySchema),
        brandSettings: t.Optional(brandSettingsPatchBodySchema),
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
        localModelEndpoint: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL })),
        localModelName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
        emailTransportPassword: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_API_KEY })),
      }),
    },
  )
  .post(
    "/test-api-key",
    async ({ body }) => {
      if (body.provider === "local") {
        const diagnostics = await LocalProvider.inspectEndpoint(body.key, body.model);
        return {
          valid: diagnostics.code === "healthy",
          provider: body.provider,
          diagnosticCode: diagnostics.code,
          message: diagnostics.message,
          availableModels: diagnostics.availableModels,
          selectedModel: diagnostics.selectedModel,
        };
      }

      const strategy = (() => {
        switch (body.provider) {
          case "gemini":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.gemini;
          case "openai":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.openai;
          case "claude":
            return AI_PROVIDER_TEST_STRATEGY_BY_ID.claude;
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

      const requestUrl = strategy.buildUrl(body.key);
      const requestInit = strategy.buildInit(body.key);

      const responseResult = await settle(fetch(requestUrl, requestInit));
      if (responseResult.status === "rejected") {
        return {
          valid: false,
          provider: body.provider,
          diagnosticCode: "error",
          message: toErrorMessage(responseResult.reason),
        };
      }

      const valid = strategy.isSuccess(responseResult.value.status);
      return {
        valid,
        provider: body.provider,
        diagnosticCode: valid ? "healthy" : "error",
        message: valid ? undefined : `HTTP ${responseResult.value.status}`,
      };
    },
    {
      body: t.Object({
        provider: apiProviderBodySchema,
        key: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
        model: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
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
