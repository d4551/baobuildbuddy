import type { AIProviderType } from "@bao/shared";
import {
  AI_PROVIDER_ID_LIST,
  APP_LANGUAGE_CODES,
  AUTOMATION_BROWSER_OPTIONS,
  EMAIL_TRANSPORT_AUTH_MODE_OPTIONS,
  EMAIL_TRANSPORT_SECURITY_OPTIONS,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MODEL,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared";
import Type from "baobox";

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

export const preferredProviderBodySchema = Type.Union([
  Type.Literal(PROVIDER_GEMINI),
  Type.Literal(PROVIDER_CLAUDE),
  Type.Literal(PROVIDER_OPENAI),
  Type.Literal(PROVIDER_HUGGINGFACE),
  Type.Literal(PROVIDER_LOCAL),
]);

const aiRoutingTargetBodySchema = Type.Object(
  {
    provider: preferredProviderBodySchema,
    model: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MODEL })),
  },
  { required: ["provider"] },
);

export const aiRoutingBodySchema = Type.Object(
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

const brandThemePaletteBodySchema = Type.Object({
  base100: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  base200: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  base300: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  baseContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  primary: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  primaryContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  secondary: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  secondaryContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  accent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  accentContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  neutral: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  neutralContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  info: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  infoContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  success: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  successContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  warning: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  warningContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  error: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  errorContent: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  radiusSelector: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  radiusField: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  radiusBox: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  sizeSelector: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  sizeField: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  border: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  depth: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  noise: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
});

const brandThemePalettePatchBodySchema = Type.Partial(brandThemePaletteBodySchema);

const brandTypographyBodySchema = Type.Object({
  fontStylesheetUrl: Type.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  displayFontFamily: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  bodyFontFamily: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  monoFontFamily: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
});

const brandTypographyPatchBodySchema = Type.Partial(brandTypographyBodySchema);

const brandContentBodySchema = Type.Object({
  tagline: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  defaultTitle: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  defaultDescription: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  contentOverrides: Type.Record(
    Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    Type.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
  ),
});

const brandContentPatchBodySchema = Type.Partial(brandContentBodySchema);

export const brandSettingsPatchBodySchema = Type.Partial(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    assistantName: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    apiName: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    logoPath: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    faviconPath: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    typography: brandTypographyPatchBodySchema,
    lightTheme: brandThemePalettePatchBodySchema,
    darkTheme: brandThemePalettePatchBodySchema,
    content: brandContentPatchBodySchema,
  }),
);

export const languageBodySchema = Type.Union([
  Type.Literal(APP_LANGUAGE_EN_US),
  Type.Literal(APP_LANGUAGE_ES_ES),
  Type.Literal(APP_LANGUAGE_FR_FR),
  Type.Literal(APP_LANGUAGE_JA_JP),
]);

export const browserBodySchema = Type.Union([
  Type.Literal(AUTOMATION_BROWSER_CHROME),
  Type.Literal(AUTOMATION_BROWSER_CHROMIUM),
  Type.Literal(AUTOMATION_BROWSER_EDGE),
]);

export const emailTransportSecurityBodySchema = Type.Union([
  Type.Literal(EMAIL_TRANSPORT_SECURITY_TLS),
  Type.Literal(EMAIL_TRANSPORT_SECURITY_STARTTLS),
  Type.Literal(EMAIL_TRANSPORT_SECURITY_PLAIN),
]);

export const emailTransportAuthModeBodySchema = Type.Union([
  Type.Literal(EMAIL_TRANSPORT_AUTH_PLAIN),
  Type.Literal(EMAIL_TRANSPORT_AUTH_LOGIN),
]);
