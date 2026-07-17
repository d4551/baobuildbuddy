import { AI_PROVIDER_ID_LIST } from "@bao/shared/constants/ai-provider";
import {
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MODEL,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import {
  APP_LANGUAGE_CODES,
  AUTOMATION_BROWSER_OPTIONS,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
} from "@bao/shared/constants/settings";
import type { AIProviderType } from "@bao/shared/types/ai";
import { t } from "elysia";

export const VALID_PROVIDERS = AI_PROVIDER_ID_LIST as [AIProviderType, ...AIProviderType[]];

const [PROVIDER_GEMINI, PROVIDER_CLAUDE, PROVIDER_OPENAI, PROVIDER_HUGGINGFACE, PROVIDER_LOCAL] =
  VALID_PROVIDERS;
const [APP_LANGUAGE_EN_US, APP_LANGUAGE_ES_ES, APP_LANGUAGE_FR_FR, APP_LANGUAGE_JA_JP] =
  APP_LANGUAGE_CODES;
const [AUTOMATION_BROWSER_CHROME, AUTOMATION_BROWSER_CHROMIUM, AUTOMATION_BROWSER_EDGE] =
  AUTOMATION_BROWSER_OPTIONS;
const [
  EMAIL_TRANSPORT_SECURITY_TLS,
  EMAIL_TRANSPORT_SECURITY_STARTTLS,
  EMAIL_TRANSPORT_SECURITY_PLAIN,
] = EMAIL_TRANSPORT_SECURITY_OPTIONS;
const [EMAIL_TRANSPORT_AUTH_PLAIN, EMAIL_TRANSPORT_AUTH_LOGIN] = EMAIL_TRANSPORT_AUTH_MODE_OPTIONS;

export const resolveKnownProvider = (value?: string | null): AIProviderType =>
  VALID_PROVIDERS.find((provider) => provider === value) ?? PROVIDER_LOCAL;

export const preferredProviderBodySchema = t.Union([
  t.Literal(PROVIDER_GEMINI),
  t.Literal(PROVIDER_CLAUDE),
  t.Literal(PROVIDER_OPENAI),
  t.Literal(PROVIDER_HUGGINGFACE),
  t.Literal(PROVIDER_LOCAL),
]);

const aiRoutingTargetBodySchema = t.Object(
  {
    provider: preferredProviderBodySchema,
    model: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  },
  { required: ["provider"] },
);

export const aiRoutingBodySchema = t.Object(
  {
    chat: aiRoutingTargetBodySchema,
    interviewQuestions: aiRoutingTargetBodySchema,
    interviewFeedback: aiRoutingTargetBodySchema,
    resume: aiRoutingTargetBodySchema,
    coverLetter: aiRoutingTargetBodySchema,
    emailResponse: aiRoutingTargetBodySchema,
    jobMatch: aiRoutingTargetBodySchema,
    scrapeEnrichment: aiRoutingTargetBodySchema,
    automationFieldMapping: aiRoutingTargetBodySchema,
  },
  {
    required: [
      "chat",
      "interviewQuestions",
      "interviewFeedback",
      "resume",
      "coverLetter",
      "emailResponse",
      "jobMatch",
      "scrapeEnrichment",
      "automationFieldMapping",
    ],
  },
);

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

export const brandSettingsPatchBodySchema = t.Partial(
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

export const languageBodySchema = t.Union([
  t.Literal(APP_LANGUAGE_EN_US),
  t.Literal(APP_LANGUAGE_ES_ES),
  t.Literal(APP_LANGUAGE_FR_FR),
  t.Literal(APP_LANGUAGE_JA_JP),
]);

export const browserBodySchema = t.Union([
  t.Literal(AUTOMATION_BROWSER_CHROME),
  t.Literal(AUTOMATION_BROWSER_CHROMIUM),
  t.Literal(AUTOMATION_BROWSER_EDGE),
]);

export const emailTransportSecurityBodySchema = t.Union([
  t.Literal(EMAIL_TRANSPORT_SECURITY_TLS),
  t.Literal(EMAIL_TRANSPORT_SECURITY_STARTTLS),
  t.Literal(EMAIL_TRANSPORT_SECURITY_PLAIN),
]);

export const emailTransportAuthModeBodySchema = t.Union([
  t.Literal(EMAIL_TRANSPORT_AUTH_PLAIN),
  t.Literal(EMAIL_TRANSPORT_AUTH_LOGIN),
]);
