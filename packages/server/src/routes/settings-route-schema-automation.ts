import { JOB_STUDIO_TYPES } from "@bao/shared/constants/jobs";
import {
  SCHEMA_MAX_BOARD_RESULT_LIMIT,
  SCHEMA_MAX_ITEMS_BOARDS,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_MODEL,
  SCHEMA_MAX_LENGTH_SETTINGS_LABEL,
  SCHEMA_MAX_LENGTH_SETTINGS_URL,
  SCHEMA_MAX_PAGES_MAX,
  SCHEMA_MAX_PAGES_MIN,
  SCHEMA_PROVIDER_TIMEOUT_MAX_MS,
  SCHEMA_PROVIDER_TIMEOUT_MIN_MS,
} from "@bao/shared/constants/schema-limits";
import { SPEECH_PROVIDER_OPTIONS } from "@bao/shared/constants/settings";
import { JOB_TAXONOMY_KEYWORD_CATEGORY_IDS } from "@bao/shared/types/jobs-taxonomy";
import { t } from "elysia";

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

const [
  SPEECH_PROVIDER_BROWSER,
  SPEECH_PROVIDER_OPENAI,
  SPEECH_PROVIDER_HUGGINGFACE,
  SPEECH_PROVIDER_LOCAL,
  SPEECH_PROVIDER_CUSTOM,
] = SPEECH_PROVIDER_OPTIONS;
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

const [
  JOB_TAXONOMY_KEYWORD_CATEGORY_REMOTE_LOCATION,
  JOB_TAXONOMY_KEYWORD_CATEGORY_HYBRID_LOCATION,
  JOB_TAXONOMY_KEYWORD_CATEGORY_REQUIREMENT,
  JOB_TAXONOMY_KEYWORD_CATEGORY_TECHNOLOGY,
  JOB_TAXONOMY_KEYWORD_CATEGORY_GENRE,
  JOB_TAXONOMY_KEYWORD_CATEGORY_PLATFORM,
  JOB_TAXONOMY_KEYWORD_CATEGORY_ROLE,
] = JOB_TAXONOMY_KEYWORD_CATEGORY_IDS;

const [
  JOB_STUDIO_TYPE_AAA,
  JOB_STUDIO_TYPE_INDIE,
  JOB_STUDIO_TYPE_MOBILE,
  JOB_STUDIO_TYPE_VR_AR,
  JOB_STUDIO_TYPE_PLATFORM,
  JOB_STUDIO_TYPE_ESPORTS,
  JOB_STUDIO_TYPE_UNKNOWN,
] = JOB_STUDIO_TYPES;

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

const jobTaxonomyKeywordCategoryBodySchema = t.Union([
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_REMOTE_LOCATION),
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_HYBRID_LOCATION),
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_REQUIREMENT),
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_TECHNOLOGY),
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_GENRE),
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_PLATFORM),
  t.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_ROLE),
]);

const studioTypeBodySchema = t.Union([
  t.Literal(JOB_STUDIO_TYPE_AAA),
  t.Literal(JOB_STUDIO_TYPE_INDIE),
  t.Literal(JOB_STUDIO_TYPE_MOBILE),
  t.Literal(JOB_STUDIO_TYPE_VR_AR),
  t.Literal(JOB_STUDIO_TYPE_PLATFORM),
  t.Literal(JOB_STUDIO_TYPE_ESPORTS),
  t.Literal(JOB_STUDIO_TYPE_UNKNOWN),
]);

const companyBoardApiTemplatesBodySchema = t.Required(
  t.Object({
    greenhouse: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    lever: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    recruitee: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    workable: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    ashby: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    smartrecruiters: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    teamtailor: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    workday: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  }),
);

const companyBoardConfigBodySchema = t.Required(
  t.Object({
    name: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    token: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    type: companyBoardTypeBodySchema,
    enabled: t.Boolean(),
    priority: t.Number({ minimum: 0, maximum: 1000 }),
  }),
);

const greenhouseBoardConfigBodySchema = t.Required(
  t.Object({
    board: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    company: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    enabled: t.Boolean(),
  }),
);

const leverCompanyConfigBodySchema = t.Required(
  t.Object({
    slug: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    company: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    enabled: t.Boolean(),
  }),
);

const gamingPortalConfigBodySchema = t.Required(
  t.Object({
    id: gamingPortalIdBodySchema,
    name: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    source: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    fallbackUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    enabled: t.Boolean(),
  }),
);

export const jobProviderSettingsBodySchema = t.Required(
  t.Object({
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
    greenhouseMaxPages: t.Number({
      minimum: SCHEMA_MAX_PAGES_MIN,
      maximum: SCHEMA_MAX_PAGES_MAX,
    }),
    greenhouseBoards: t.Array(greenhouseBoardConfigBodySchema, {
      maxItems: SCHEMA_MAX_ITEMS_BOARDS,
    }),
    leverApiBaseUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    leverMaxPages: t.Number({ minimum: SCHEMA_MAX_PAGES_MIN, maximum: SCHEMA_MAX_PAGES_MAX }),
    leverCompanies: t.Array(leverCompanyConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
    companyBoardApiTemplates: companyBoardApiTemplatesBodySchema,
    companyBoards: t.Array(companyBoardConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
    gamingPortals: t.Array(gamingPortalConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  }),
);

const speechEngineSettingsBodyShape = {
  provider: speechProviderBodySchema,
  model: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_MODEL }),
  endpoint: t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
};

const speechEngineSettingsBodySchema = t.Required(t.Object(speechEngineSettingsBodyShape));
const speechEngineSettingsTtsBodyShape = {
  ...speechEngineSettingsBodyShape,
  voice: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  format: t.Union([t.Literal("mp3"), t.Literal("wav")]),
};
const speechEngineSettingsTtsBodySchema = t.Required(
  t.Object(speechEngineSettingsTtsBodyShape),
);

export const speechSettingsBodySchema = t.Required(
  t.Object({
    locale: t.String({ minLength: 2, maxLength: SCHEMA_MAX_LENGTH_MICRO }),
    stt: speechEngineSettingsBodySchema,
    tts: speechEngineSettingsTtsBodySchema,
  }),
);

export const jobTaxonomyKeywordEntryBodySchema = t.Required(
  t.Object({
    id: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    category: jobTaxonomyKeywordCategoryBodySchema,
    label: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    synonyms: t.Array(
      t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
      {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      },
    ),
    sortOrder: t.Number({ minimum: 0, maximum: SCHEMA_MAX_ITEMS_LARGE }),
    enabled: t.Boolean(),
  }),
);

export const studioClassificationRuleBodySchema = t.Required(
  t.Object({
    id: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    studioType: studioTypeBodySchema,
    keyword: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    sortOrder: t.Number({ minimum: 0, maximum: SCHEMA_MAX_ITEMS_LARGE }),
    enabled: t.Boolean(),
  }),
);

export const jobTaxonomySettingsBodySchema = t.Required(
  t.Object({
    keywords: t.Array(jobTaxonomyKeywordEntryBodySchema, { maxItems: 1000 }),
    studioRules: t.Array(studioClassificationRuleBodySchema, { maxItems: 1000 }),
  }),
);

const jsonPrimitiveBodySchema = t.Union([t.String(), t.Number(), t.Boolean(), t.Null()]);
const jsonValueBodySchema = t.Union([
  jsonPrimitiveBodySchema,
  t.Array(jsonPrimitiveBodySchema),
  t.Record(t.String(), jsonPrimitiveBodySchema),
  t.Array(t.Record(t.String(), jsonPrimitiveBodySchema)),
  t.Record(t.String(), t.Union([jsonPrimitiveBodySchema, t.Array(jsonPrimitiveBodySchema)])),
]);

export const nullableJsonValueBodySchema = t.Union([jsonValueBodySchema, t.Null()]);
export { jsonValueBodySchema };
