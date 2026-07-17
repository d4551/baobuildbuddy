import { AI_PROVIDER_ID_LIST } from "@bao/shared/constants/ai-provider";
import {
  BRAND_THEME_COLOR_PATTERN_SOURCE,
  BRAND_THEME_LENGTH_PATTERN_SOURCE,
  BRAND_THEME_UNITLESS_FLAG_PATTERN_SOURCE,
} from "@bao/shared/constants/brand-theme-css";
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

const brandThemeColorBodyValue = t.String({
  minLength: 1,
  maxLength: SCHEMA_MAX_LENGTH_SHORT,
  pattern: BRAND_THEME_COLOR_PATTERN_SOURCE,
});

const brandThemeLengthBodyValue = t.String({
  minLength: 1,
  maxLength: SCHEMA_MAX_LENGTH_SHORT,
  pattern: BRAND_THEME_LENGTH_PATTERN_SOURCE,
});

const brandThemeUnitlessFlagBodyValue = t.String({
  minLength: 1,
  maxLength: SCHEMA_MAX_LENGTH_SHORT,
  pattern: BRAND_THEME_UNITLESS_FLAG_PATTERN_SOURCE,
});

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

export const aiRoutingTargetBodySchema = t.Object(
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

export const brandThemePaletteBodySchema = t.Object({
  base100: brandThemeColorBodyValue,
  base200: brandThemeColorBodyValue,
  base300: brandThemeColorBodyValue,
  baseContent: brandThemeColorBodyValue,
  primary: brandThemeColorBodyValue,
  primaryContent: brandThemeColorBodyValue,
  secondary: brandThemeColorBodyValue,
  secondaryContent: brandThemeColorBodyValue,
  accent: brandThemeColorBodyValue,
  accentContent: brandThemeColorBodyValue,
  neutral: brandThemeColorBodyValue,
  neutralContent: brandThemeColorBodyValue,
  info: brandThemeColorBodyValue,
  infoContent: brandThemeColorBodyValue,
  success: brandThemeColorBodyValue,
  successContent: brandThemeColorBodyValue,
  warning: brandThemeColorBodyValue,
  warningContent: brandThemeColorBodyValue,
  error: brandThemeColorBodyValue,
  errorContent: brandThemeColorBodyValue,
  radiusSelector: brandThemeLengthBodyValue,
  radiusField: brandThemeLengthBodyValue,
  radiusBox: brandThemeLengthBodyValue,
  sizeSelector: brandThemeLengthBodyValue,
  sizeField: brandThemeLengthBodyValue,
  border: brandThemeLengthBodyValue,
  depth: brandThemeUnitlessFlagBodyValue,
  noise: brandThemeUnitlessFlagBodyValue,
});

const brandThemePalettePatchBodySchema = t.Partial(brandThemePaletteBodySchema);

export const brandTypographyBodySchema = t.Object({
  fontStylesheetUrl: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  displayFontFamily: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  bodyFontFamily: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  monoFontFamily: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
});

const brandTypographyPatchBodySchema = t.Partial(brandTypographyBodySchema);

export const brandContentBodySchema = t.Object({
  tagline: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  defaultTitle: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  defaultDescription: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  contentOverrides: t.Record(
    t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  ),
});

const brandContentPatchBodySchema = t.Partial(brandContentBodySchema);

export const brandSettingsBodySchema = t.Required(
  t.Object({
    name: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    assistantName: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    apiName: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    logoPath: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    faviconPath: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    typography: brandTypographyBodySchema,
    lightTheme: brandThemePaletteBodySchema,
    darkTheme: brandThemePaletteBodySchema,
    content: brandContentBodySchema,
  }),
);

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
