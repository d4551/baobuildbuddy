import {
  JOB_STUDIO_TYPES,
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
  SPEECH_PROVIDER_OPTIONS,
} from "@bao/shared";
import { JOB_TAXONOMY_KEYWORD_CATEGORY_IDS } from "@bao/shared/types/jobs-taxonomy";
import Type from "baobox";

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

const speechProviderBodySchema = Type.Union([
  Type.Literal(SPEECH_PROVIDER_BROWSER),
  Type.Literal(SPEECH_PROVIDER_OPENAI),
  Type.Literal(SPEECH_PROVIDER_HUGGINGFACE),
  Type.Literal(SPEECH_PROVIDER_LOCAL),
  Type.Literal(SPEECH_PROVIDER_CUSTOM),
]);

const companyBoardTypeBodySchema = Type.Union([
  Type.Literal(COMPANY_BOARD_GREENHOUSE),
  Type.Literal(COMPANY_BOARD_LEVER),
  Type.Literal(COMPANY_BOARD_RECRUITEE),
  Type.Literal(COMPANY_BOARD_WORKABLE),
  Type.Literal(COMPANY_BOARD_ASHBY),
  Type.Literal(COMPANY_BOARD_SMARTRECRUITERS),
  Type.Literal(COMPANY_BOARD_TEAMTAILOR),
  Type.Literal(COMPANY_BOARD_WORKDAY),
]);

const gamingPortalIdBodySchema = Type.Union([
  Type.Literal(GAMING_PORTAL_HITMARKER),
  Type.Literal(GAMING_PORTAL_GRACKLE),
  Type.Literal(GAMING_PORTAL_WORKWITHINDIES),
  Type.Literal(GAMING_PORTAL_REMOTEGAMEJOBS),
  Type.Literal(GAMING_PORTAL_GAMESJOBS_DIRECT),
  Type.Literal(GAMING_PORTAL_POCKETGAMER),
]);

const jobTaxonomyKeywordCategoryBodySchema = Type.Union([
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_REMOTE_LOCATION),
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_HYBRID_LOCATION),
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_REQUIREMENT),
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_TECHNOLOGY),
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_GENRE),
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_PLATFORM),
  Type.Literal(JOB_TAXONOMY_KEYWORD_CATEGORY_ROLE),
]);

const studioTypeBodySchema = Type.Union([
  Type.Literal(JOB_STUDIO_TYPE_AAA),
  Type.Literal(JOB_STUDIO_TYPE_INDIE),
  Type.Literal(JOB_STUDIO_TYPE_MOBILE),
  Type.Literal(JOB_STUDIO_TYPE_VR_AR),
  Type.Literal(JOB_STUDIO_TYPE_PLATFORM),
  Type.Literal(JOB_STUDIO_TYPE_ESPORTS),
  Type.Literal(JOB_STUDIO_TYPE_UNKNOWN),
]);

const companyBoardApiTemplatesBodySchema = Type.Required(
  Type.Object({
    greenhouse: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    lever: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    recruitee: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    workable: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    ashby: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    smartrecruiters: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    teamtailor: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    workday: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
  }),
);

const companyBoardConfigBodySchema = Type.Required(
  Type.Object({
    name: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    token: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    type: companyBoardTypeBodySchema,
    enabled: Type.Boolean(),
    priority: Type.Number({ minimum: 0, maximum: 1000 }),
  }),
);

const greenhouseBoardConfigBodySchema = Type.Required(
  Type.Object({
    board: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    company: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    enabled: Type.Boolean(),
  }),
);

const leverCompanyConfigBodySchema = Type.Required(
  Type.Object({
    slug: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    company: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    enabled: Type.Boolean(),
  }),
);

const gamingPortalConfigBodySchema = Type.Required(
  Type.Object({
    id: gamingPortalIdBodySchema,
    name: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    source: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    fallbackUrl: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    enabled: Type.Boolean(),
  }),
);

export const jobProviderSettingsBodySchema = Type.Required(
  Type.Object({
    providerTimeoutMs: Type.Number({
      minimum: SCHEMA_PROVIDER_TIMEOUT_MIN_MS,
      maximum: SCHEMA_PROVIDER_TIMEOUT_MAX_MS,
    }),
    companyBoardResultLimit: Type.Number({ minimum: 1, maximum: SCHEMA_MAX_BOARD_RESULT_LIMIT }),
    gamingBoardResultLimit: Type.Number({ minimum: 1, maximum: SCHEMA_MAX_BOARD_RESULT_LIMIT }),
    unknownLocationLabel: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
    unknownCompanyLabel: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
    hitmarkerEnabled: Type.Boolean(),
    hitmarkerApiBaseUrl: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    hitmarkerDefaultQuery: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
    hitmarkerDefaultLocation: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_ID }),
    greenhouseApiBaseUrl: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    greenhouseMaxPages: Type.Number({
      minimum: SCHEMA_MAX_PAGES_MIN,
      maximum: SCHEMA_MAX_PAGES_MAX,
    }),
    greenhouseBoards: Type.Array(greenhouseBoardConfigBodySchema, {
      maxItems: SCHEMA_MAX_ITEMS_BOARDS,
    }),
    leverApiBaseUrl: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_URL }),
    leverMaxPages: Type.Number({ minimum: SCHEMA_MAX_PAGES_MIN, maximum: SCHEMA_MAX_PAGES_MAX }),
    leverCompanies: Type.Array(leverCompanyConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
    companyBoardApiTemplates: companyBoardApiTemplatesBodySchema,
    companyBoards: Type.Array(companyBoardConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_BOARDS }),
    gamingPortals: Type.Array(gamingPortalConfigBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  }),
);

const speechEngineSettingsBodyShape = {
  provider: speechProviderBodySchema,
  model: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_MODEL }),
  endpoint: Type.String({ maxLength: SCHEMA_MAX_LENGTH_LONG }),
};

const speechEngineSettingsBodySchema = Type.Required(Type.Object(speechEngineSettingsBodyShape));
const speechEngineSettingsTtsBodyShape = {
  ...speechEngineSettingsBodyShape,
  voice: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
  format: Type.Union([Type.Literal("mp3"), Type.Literal("wav")]),
};
const speechEngineSettingsTtsBodySchema = Type.Required(
  Type.Object(speechEngineSettingsTtsBodyShape),
);

export const speechSettingsBodySchema = Type.Required(
  Type.Object({
    locale: Type.String({ minLength: 2, maxLength: SCHEMA_MAX_LENGTH_MICRO }),
    stt: speechEngineSettingsBodySchema,
    tts: speechEngineSettingsTtsBodySchema,
  }),
);

export const jobTaxonomyKeywordEntryBodySchema = Type.Required(
  Type.Object({
    id: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    category: jobTaxonomyKeywordCategoryBodySchema,
    label: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    synonyms: Type.Array(
      Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
      {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      },
    ),
    sortOrder: Type.Number({ minimum: 0, maximum: SCHEMA_MAX_ITEMS_LARGE }),
    enabled: Type.Boolean(),
  }),
);

export const studioClassificationRuleBodySchema = Type.Required(
  Type.Object({
    id: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    studioType: studioTypeBodySchema,
    keyword: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SETTINGS_LABEL }),
    sortOrder: Type.Number({ minimum: 0, maximum: SCHEMA_MAX_ITEMS_LARGE }),
    enabled: Type.Boolean(),
  }),
);

export const jobTaxonomySettingsBodySchema = Type.Required(
  Type.Object({
    keywords: Type.Array(jobTaxonomyKeywordEntryBodySchema, { maxItems: 1000 }),
    studioRules: Type.Array(studioClassificationRuleBodySchema, { maxItems: 1000 }),
  }),
);

const jsonValueBodySchema = Type.Recursive("JsonValue", (Self) =>
  Type.Union([
    Type.String(),
    Type.Number(),
    Type.Boolean(),
    Type.Null(),
    Type.Array(Self),
    Type.Record(Type.String(), Self),
  ]),
);

export const nullableJsonValueBodySchema = Type.Union([jsonValueBodySchema, Type.Null()]);
export { jsonValueBodySchema };
