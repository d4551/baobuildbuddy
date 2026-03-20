import {
  AI_PROVIDER_DEFAULT,
  type AIProviderType,
  APP_LANGUAGE_CODES,
  type AppSettings,
  type AutomationSettings,
  type EmailTransportSettings,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  COVER_LETTER_DEFAULT_TEMPLATE,
  type CoverLetterData,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_SPEECH_SETTINGS,
  type GameStudio,
  isCoverLetterTemplate,
  isRecord,
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
  JOB_TYPES,
  type Job,
  type JobExperienceLevel,
  type JobType,
  normalizeAppDataTheme,
  type PortfolioData,
  type PortfolioMetadata,
  type PortfolioProject,
  RESUME_TEMPLATE_DEFAULT,
  RESUME_TEMPLATE_OPTIONS,
  resolveBrandSettings,
  type ResumeData,
  type ResumeEducationItem,
  type ResumeExperienceItem,
  type ResumeProject,
  type ResumeTemplate,
  SKILL_CATEGORY_IDS,
  SKILL_DEMAND_LEVEL_IDS,
  SKILL_EVIDENCE_TYPE_IDS,
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS,
  type SkillEvidence,
  type SkillMapping,
  SPEECH_PROVIDER_OPTIONS,
  type StudioCulture,
  type UserProfile,
} from "@bao/shared";

const AI_PROVIDERS: readonly AIProviderType[] = [
  "local",
  "gemini",
  "claude",
  "openai",
  "huggingface",
];

const SKILL_EVIDENCE_TYPES: readonly SkillEvidence["type"][] = SKILL_EVIDENCE_TYPE_IDS;

const SKILL_EVIDENCE_STATUSES: readonly SkillEvidence["verificationStatus"][] =
  SKILL_EVIDENCE_VERIFICATION_STATUS_IDS;

const SKILL_CATEGORIES: readonly SkillMapping["category"][] = SKILL_CATEGORY_IDS;

const DEMAND_LEVELS: readonly SkillMapping["demandLevel"][] = SKILL_DEMAND_LEVEL_IDS;

const STUDIO_CATEGORIES: readonly Exclude<GameStudio["category"], undefined>[] = [
  "AAA",
  "Indie",
  "Mobile",
  "VR/AR",
  "Platform",
  "Esports",
  "International",
];

const USER_EXPERIENCE_LEVELS: readonly Exclude<
  UserProfile["gamingExperience"]["experienceLevel"],
  undefined
>[] = ["entry", "junior", "mid", "senior", "lead", "principal", "director"];

const USER_GAMING_SPECIALIZATIONS: readonly UserProfile["gamingExperience"]["specializations"][number][] =
  [
    "game-programming",
    "gameplay-programming",
    "engine-programming",
    "graphics-programming",
    "ai-programming",
    "ui-programming",
    "network-programming",
    "tools-programming",
    "game-design",
    "level-design",
    "narrative-design",
    "systems-design",
    "ui-ux-design",
    "3d-art",
    "2d-art",
    "concept-art",
    "character-art",
    "environment-art",
    "vfx-art",
    "animation",
    "rigging",
    "technical-art",
    "audio-design",
    "sound-engineering",
    "music-composition",
    "quality-assurance",
    "production",
    "project-management",
    "marketing",
    "community-management",
    "business-development",
    "data-analytics",
  ];

const USER_REMOTE_PREFERENCES: readonly NonNullable<
  UserProfile["careerGoals"]["remotePreference"]
>[] = ["onsite", "hybrid", "remote", "flexible"];

const isOneOf = <T extends string>(value: unknown, choices: readonly T[]): value is T =>
  typeof value === "string" && choices.some((choice) => choice === value);

const asEnum = <T extends string>(value: unknown, choices: readonly T[]): T | undefined =>
  isOneOf(value, choices) ? value : undefined;

const asEnumArray = <T extends string>(value: unknown, choices: readonly T[]): T[] =>
  Array.isArray(value) ? value.filter((entry): entry is T => isOneOf(entry, choices)) : [];

const normalizeResumeTemplate = (value: unknown): ResumeTemplate =>
  asEnum(value, RESUME_TEMPLATE_OPTIONS) ?? RESUME_TEMPLATE_DEFAULT;

const normalizeJobExperienceLevel = (value: unknown): JobExperienceLevel | undefined =>
  asEnum(value, JOB_EXPERIENCE_LEVELS);

const normalizeJobType = (value: unknown): JobType => asEnum(value, JOB_TYPES) ?? "full-time";

const normalizeAIProvider = (value: unknown): AIProviderType =>
  asEnum(value, AI_PROVIDERS) ?? AI_PROVIDER_DEFAULT;

const normalizeStudioCulture = (value: unknown): StudioCulture => {
  if (!isRecord(value)) {
    return {
      values: [],
      workStyle: "",
    };
  }
  return {
    values: asStringArray(value.values),
    workStyle: asString(value.workStyle) ?? "",
    environment: asString(value.environment),
  };
};

const SPEECH_AUDIO_FORMATS: readonly AutomationSettings["speech"]["tts"]["format"][] = [
  "mp3",
  "wav",
];

const COMPANY_BOARD_ATS_TYPES: readonly AutomationSettings["jobProviders"]["companyBoards"][number]["type"][] =
  [
    "greenhouse",
    "lever",
    "recruitee",
    "workable",
    "ashby",
    "smartrecruiters",
    "teamtailor",
    "workday",
  ];

const GAMING_PORTAL_IDS: readonly AutomationSettings["jobProviders"]["gamingPortals"][number]["id"][] =
  ["hitmarker", "grackle", "workwithindies", "remotegamejobs", "gamesjobsdirect", "pocketgamer"];

const normalizeGreenhouseBoards = (
  value: unknown,
): AutomationSettings["jobProviders"]["greenhouseBoards"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((board) => ({
        board: asString(board.board) ?? "",
        company: asString(board.company) ?? "",
        enabled: asBoolean(board.enabled) ?? false,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseBoards;

const normalizeLeverCompanies = (
  value: unknown,
): AutomationSettings["jobProviders"]["leverCompanies"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((company) => ({
        slug: asString(company.slug) ?? "",
        company: asString(company.company) ?? "",
        enabled: asBoolean(company.enabled) ?? false,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverCompanies;

const normalizeCompanyBoardTemplates = (
  value: unknown,
): AutomationSettings["jobProviders"]["companyBoardApiTemplates"] => {
  if (!isRecord(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates;
  }

  return {
    greenhouse:
      asString(value.greenhouse) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.greenhouse,
    lever:
      asString(value.lever) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.lever,
    recruitee:
      asString(value.recruitee) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.recruitee,
    workable:
      asString(value.workable) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.workable,
    ashby:
      asString(value.ashby) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.ashby,
    smartrecruiters:
      asString(value.smartrecruiters) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.smartrecruiters,
    teamtailor:
      asString(value.teamtailor) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.teamtailor,
    workday:
      asString(value.workday) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardApiTemplates.workday,
  };
};

const normalizeCompanyBoards = (
  value: unknown,
): AutomationSettings["jobProviders"]["companyBoards"] =>
  Array.isArray(value)
    ? value.filter(isRecord).map((board) => ({
        name: asString(board.name) ?? "",
        token: asString(board.token) ?? "",
        type: asEnum(board.type, COMPANY_BOARD_ATS_TYPES) ?? "greenhouse",
        enabled: asBoolean(board.enabled) ?? false,
        priority: asNumber(board.priority) ?? 0,
      }))
    : DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoards;

const normalizeGamingPortals = (
  value: unknown,
): AutomationSettings["jobProviders"]["gamingPortals"] => {
  if (!Array.isArray(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals;
  }

  const configuredPortals = value.filter(isRecord);
  return DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingPortals.map((defaultPortal, index) => {
    const matchedPortal =
      configuredPortals.find(
        (portal) => asEnum(portal.id, GAMING_PORTAL_IDS) === defaultPortal.id,
      ) ?? configuredPortals[index];

    return {
      id: defaultPortal.id,
      name: asString(matchedPortal?.name) ?? defaultPortal.name,
      source: asString(matchedPortal?.source) ?? defaultPortal.source,
      fallbackUrl: asString(matchedPortal?.fallbackUrl) ?? defaultPortal.fallbackUrl,
      enabled: asBoolean(matchedPortal?.enabled) ?? defaultPortal.enabled,
    };
  });
};

const normalizeJobProviderSettings = (value: unknown): AutomationSettings["jobProviders"] => {
  if (!isRecord(value)) {
    return DEFAULT_AUTOMATION_SETTINGS.jobProviders;
  }

  return {
    ...DEFAULT_AUTOMATION_SETTINGS.jobProviders,
    providerTimeoutMs:
      asNumber(value.providerTimeoutMs) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.providerTimeoutMs,
    companyBoardResultLimit:
      asNumber(value.companyBoardResultLimit) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.companyBoardResultLimit,
    gamingBoardResultLimit:
      asNumber(value.gamingBoardResultLimit) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.gamingBoardResultLimit,
    unknownLocationLabel:
      asString(value.unknownLocationLabel) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownLocationLabel,
    unknownCompanyLabel:
      asString(value.unknownCompanyLabel) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.unknownCompanyLabel,
    hitmarkerEnabled:
      asBoolean(value.hitmarkerEnabled) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerEnabled,
    hitmarkerApiBaseUrl:
      asString(value.hitmarkerApiBaseUrl) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerApiBaseUrl,
    hitmarkerDefaultQuery:
      asString(value.hitmarkerDefaultQuery) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultQuery,
    hitmarkerDefaultLocation:
      asString(value.hitmarkerDefaultLocation) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.hitmarkerDefaultLocation,
    greenhouseApiBaseUrl:
      asString(value.greenhouseApiBaseUrl) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseApiBaseUrl,
    greenhouseMaxPages:
      asNumber(value.greenhouseMaxPages) ??
      DEFAULT_AUTOMATION_SETTINGS.jobProviders.greenhouseMaxPages,
    greenhouseBoards: normalizeGreenhouseBoards(value.greenhouseBoards),
    leverApiBaseUrl:
      asString(value.leverApiBaseUrl) ?? DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverApiBaseUrl,
    leverMaxPages:
      asNumber(value.leverMaxPages) ?? DEFAULT_AUTOMATION_SETTINGS.jobProviders.leverMaxPages,
    leverCompanies: normalizeLeverCompanies(value.leverCompanies),
    companyBoardApiTemplates: normalizeCompanyBoardTemplates(value.companyBoardApiTemplates),
    companyBoards: normalizeCompanyBoards(value.companyBoards),
    gamingPortals: normalizeGamingPortals(value.gamingPortals),
  };
};

const normalizeSpeechSettings = (value: unknown): AutomationSettings["speech"] => {
  if (!isRecord(value)) {
    return {
      locale: DEFAULT_SPEECH_SETTINGS.locale,
      stt: {
        provider: DEFAULT_SPEECH_SETTINGS.stt.provider,
        model: DEFAULT_SPEECH_SETTINGS.stt.model,
        endpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
      },
      tts: {
        provider: DEFAULT_SPEECH_SETTINGS.tts.provider,
        model: DEFAULT_SPEECH_SETTINGS.tts.model,
        endpoint: DEFAULT_SPEECH_SETTINGS.tts.endpoint,
        voice: DEFAULT_SPEECH_SETTINGS.tts.voice,
        format: DEFAULT_SPEECH_SETTINGS.tts.format,
      },
    };
  }

  const stt = isRecord(value.stt) ? value.stt : {};
  const tts = isRecord(value.tts) ? value.tts : {};
  const sttProvider =
    asEnum(stt.provider, SPEECH_PROVIDER_OPTIONS) ?? DEFAULT_SPEECH_SETTINGS.stt.provider;
  const ttsProvider =
    asEnum(tts.provider, SPEECH_PROVIDER_OPTIONS) ?? DEFAULT_SPEECH_SETTINGS.tts.provider;

  return {
    locale: asString(value.locale) ?? DEFAULT_SPEECH_SETTINGS.locale,
    stt: {
      provider: sttProvider,
      model: asString(stt.model) ?? DEFAULT_SPEECH_SETTINGS.stt.model,
      endpoint: asString(stt.endpoint) ?? DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    },
    tts: {
      provider: ttsProvider,
      model: asString(tts.model) ?? DEFAULT_SPEECH_SETTINGS.tts.model,
      endpoint: asString(tts.endpoint) ?? DEFAULT_SPEECH_SETTINGS.tts.endpoint,
      voice: asString(tts.voice) ?? DEFAULT_SPEECH_SETTINGS.tts.voice,
      format: asEnum(tts.format, SPEECH_AUDIO_FORMATS) ?? DEFAULT_SPEECH_SETTINGS.tts.format,
    },
  };
};

const normalizeAutomationSettings = (value: unknown): AutomationSettings | undefined => {
  if (!isRecord(value)) return;

  return {
    headless: asBoolean(value.headless) ?? DEFAULT_AUTOMATION_SETTINGS.headless,
    defaultTimeout: asNumber(value.defaultTimeout) ?? DEFAULT_AUTOMATION_SETTINGS.defaultTimeout,
    screenshotRetention:
      asNumber(value.screenshotRetention) ?? DEFAULT_AUTOMATION_SETTINGS.screenshotRetention,
    maxConcurrentRuns:
      asNumber(value.maxConcurrentRuns) ?? DEFAULT_AUTOMATION_SETTINGS.maxConcurrentRuns,
    defaultBrowser:
      value.defaultBrowser === "chromium" || value.defaultBrowser === "edge"
        ? value.defaultBrowser
        : DEFAULT_AUTOMATION_SETTINGS.defaultBrowser,
    enableSmartSelectors:
      asBoolean(value.enableSmartSelectors) ?? DEFAULT_AUTOMATION_SETTINGS.enableSmartSelectors,
    autoSaveScreenshots:
      asBoolean(value.autoSaveScreenshots) ?? DEFAULT_AUTOMATION_SETTINGS.autoSaveScreenshots,
    speech: normalizeSpeechSettings(value.speech),
    jobProviders: normalizeJobProviderSettings(value.jobProviders),
  };
};

const normalizeEmailTransportSettings = (value: unknown): EmailTransportSettings | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const security =
    value.security === "tls" || value.security === "plain" ? value.security : "starttls";
  const authMethod = value.authMethod === "login" ? "login" : "plain";

  return {
    host: asString(value.host) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.host,
    port: asNumber(value.port) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.port,
    security,
    username: asString(value.username) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.username,
    fromEmail: asString(value.fromEmail) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromEmail,
    fromName: asString(value.fromName) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromName,
    authMethod,
    connectionTimeoutSeconds:
      asNumber(value.connectionTimeoutSeconds) ??
      DEFAULT_EMAIL_TRANSPORT_SETTINGS.connectionTimeoutSeconds,
  };
};

const normalizeSalary = (value: unknown): Job["salary"] | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord(value)) {
    return;
  }

  const min = asNumber(value.min);
  const max = asNumber(value.max);
  if (min === undefined || max === undefined) {
    return;
  }

  const frequency =
    value.frequency === "yearly" || value.frequency === "monthly" || value.frequency === "hourly"
      ? value.frequency
      : null;
  const salary: Exclude<Job["salary"], string | undefined> = {
    min,
    max,
    currency: asString(value.currency),
  };
  if (frequency) {
    salary.frequency = frequency;
  }

  return salary;
};

/**
 * Normalizes an unknown API payload into a shared `Job` contract.
 */
export const toJob = (value: unknown): Job | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!(id && title && company && location)) return null;

  return {
    id,
    title,
    company,
    location,
    remote: asBoolean(value.remote) ?? false,
    hybrid: asBoolean(value.hybrid),
    salary: normalizeSalary(value.salary),
    description: asString(value.description),
    requirements: asStringArray(value.requirements),
    technologies: asStringArray(value.technologies),
    experienceLevel: normalizeJobExperienceLevel(value.experienceLevel),
    type: normalizeJobType(value.type),
    postedDate: asString(value.postedDate) ?? new Date().toISOString(),
    url: asString(value.url),
    source: asString(value.source),
    featured: asBoolean(value.featured),
    tags: asStringArray(value.tags),
    companyLogo: asString(value.companyLogo),
    applicationUrl: asString(value.applicationUrl),
    contentHash: asString(value.contentHash),
    studioType: asEnum(value.studioType, JOB_STUDIO_TYPES),
    gameGenres: asEnumArray(value.gameGenres, JOB_GAME_GENRES),
    platforms: asEnumArray(value.platforms, JOB_SUPPORTED_PLATFORMS),
    gamingRelevance: asNumber(value.gamingRelevance),
  };
};

const toResumeExperience = (value: unknown): ResumeExperienceItem | null => {
  if (!isRecord(value)) return null;
  const title = asString(value.title);
  const company = asString(value.company);
  const startDate = asString(value.startDate);
  if (!(title && company && startDate)) return null;
  return {
    title,
    company,
    startDate,
    endDate: asString(value.endDate),
    location: asString(value.location),
    description: asString(value.description),
    achievements: asStringArray(value.achievements),
    technologies: asStringArray(value.technologies),
  };
};

const toResumeEducation = (value: unknown): ResumeEducationItem | null => {
  if (!isRecord(value)) return null;
  const degree = asString(value.degree);
  const field = asString(value.field);
  const school = asString(value.school);
  const year = asString(value.year);
  if (!(degree && field && school && year)) return null;
  return {
    degree,
    field,
    school,
    year,
    gpa: asString(value.gpa),
  };
};

const toResumeProject = (value: unknown): ResumeProject | null => {
  if (!isRecord(value)) return null;
  const title = asString(value.title);
  const description = asString(value.description);
  if (!(title && description)) return null;
  return {
    title,
    description,
    technologies: asStringArray(value.technologies),
    link: asString(value.link),
  };
};

const toResumeCollection = <T>(value: unknown, normalizer: (entry: unknown) => T | null): T[] =>
  Array.isArray(value) ? value.map(normalizer).filter((entry): entry is T => entry !== null) : [];

const toResumePersonalInfo = (value: unknown): ResumeData["personalInfo"] | undefined => {
  const personalInfo = asRecord(value);
  if (!personalInfo) {
    return;
  }
  return {
    name: asString(personalInfo.name),
    email: asString(personalInfo.email),
    phone: asString(personalInfo.phone),
    location: asString(personalInfo.location),
    website: asString(personalInfo.website),
    linkedIn: asString(personalInfo.linkedIn),
    github: asString(personalInfo.github),
    portfolio: asString(personalInfo.portfolio),
  };
};

const toResumeSkills = (value: unknown): ResumeData["skills"] | undefined => {
  const skills = asRecord(value);
  if (!skills) {
    return;
  }
  return {
    technical: asStringArray(skills.technical),
    soft: asStringArray(skills.soft),
    gaming: asStringArray(skills.gaming),
  };
};

const toResumeGamingExperience = (value: unknown): ResumeData["gamingExperience"] | undefined => {
  const gamingExperience = asRecord(value);
  if (!gamingExperience) {
    return;
  }
  return {
    gameEngines: asString(gamingExperience.gameEngines),
    platforms: asString(gamingExperience.platforms),
    genres: asString(gamingExperience.genres),
    shippedTitles: asString(gamingExperience.shippedTitles),
  };
};

/**
 * Normalizes an unknown API payload into a shared `ResumeData` contract.
 */
export const toResumeData = (value: unknown): ResumeData | null => {
  if (!isRecord(value)) return null;

  const resume: ResumeData = {
    id: asString(value.id),
    name: asString(value.name),
    summary: asString(value.summary),
    template: normalizeResumeTemplate(value.template),
    theme: value.theme === "dark" ? "dark" : "light",
    isDefault: asBoolean(value.isDefault),
    personalInfo: toResumePersonalInfo(value.personalInfo),
    experience: toResumeCollection(value.experience, toResumeExperience),
    education: toResumeCollection(value.education, toResumeEducation),
    projects: toResumeCollection(value.projects, toResumeProject),
    skills: toResumeSkills(value.skills),
    gamingExperience: toResumeGamingExperience(value.gamingExperience),
  };

  return resume;
};

/**
 * Normalizes an unknown API payload into a shared `CoverLetterData` contract.
 */
export const toCoverLetterData = (value: unknown): CoverLetterData | null => {
  if (!isRecord(value)) return null;
  const company = asString(value.company);
  const position = asString(value.position);
  if (!(company && position)) return null;

  const contentRecord = asRecord(value.content) ?? {};
  const content: CoverLetterData["content"] = {};
  for (const [key, entry] of Object.entries(contentRecord)) {
    if (typeof entry === "string") {
      content[key] = entry;
    }
  }
  const templateValue = asString(value.template);

  return {
    id: asString(value.id),
    company,
    position,
    jobInfo: asRecord(value.jobInfo),
    personalInfo: asRecord(value.personalInfo),
    companyResearch: asRecord(value.companyResearch),
    content,
    template: isCoverLetterTemplate(templateValue) ? templateValue : COVER_LETTER_DEFAULT_TEMPLATE,
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

const toPortfolioProject = (value: unknown): PortfolioProject | null => {
  if (!isRecord(value)) return null;
  const title = asString(value.title);
  const description = asString(value.description);
  if (!(title && description)) return null;

  return {
    id: asString(value.id),
    portfolioId: asString(value.portfolioId),
    title,
    description,
    technologies: asStringArray(value.technologies),
    image: asString(value.image),
    liveUrl: asString(value.liveUrl),
    githubUrl: asString(value.githubUrl),
    tags: asStringArray(value.tags),
    featured: asBoolean(value.featured),
    role: asString(value.role),
    platforms: asStringArray(value.platforms),
    engines: asStringArray(value.engines),
    sortOrder: asNumber(value.sortOrder),
  };
};

/**
 * Normalizes an unknown API payload into a shared `PortfolioData` contract.
 */
export const toPortfolioData = (value: unknown): PortfolioData | null => {
  if (!isRecord(value)) return null;

  const metadataRecord = asRecord(value.metadata);
  const metadata: PortfolioMetadata = {};
  if (metadataRecord) {
    metadata.author = asString(metadataRecord.author);
    metadata.title = asString(metadataRecord.title);
    metadata.description = asString(metadataRecord.description);
    metadata.bio = asString(metadataRecord.bio);
    metadata.email = asString(metadataRecord.email);
    metadata.website = asString(metadataRecord.website);
    if (isRecord(metadataRecord.social)) {
      const social: Record<string, string> = {};
      for (const [key, entry] of Object.entries(metadataRecord.social)) {
        if (typeof entry === "string") {
          social[key] = entry;
        }
      }
      metadata.social = social;
    }
  }

  return {
    id: asString(value.id),
    metadata,
    projects: Array.isArray(value.projects)
      ? value.projects
          .map(toPortfolioProject)
          .filter((entry): entry is PortfolioProject => entry !== null)
      : [],
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

const toSkillEvidence = (value: unknown): SkillEvidence | null => {
  if (!isRecord(value)) {
    return null;
  }

  const evidenceId = asString(value.id);
  const title = asString(value.title);
  const description = asString(value.description);
  if (!(evidenceId && title && description)) {
    return null;
  }

  return {
    id: evidenceId,
    type: asEnum(value.type, SKILL_EVIDENCE_TYPES) ?? "document",
    title,
    description,
    url: asString(value.url),
    verificationStatus: asEnum(value.verificationStatus, SKILL_EVIDENCE_STATUSES) ?? "pending",
  };
};

/**
 * Normalizes an unknown API payload into a shared `SkillMapping` contract.
 */
export const toSkillMapping = (value: unknown): SkillMapping | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const gameExpression = asString(value.gameExpression);
  const transferableSkill = asString(value.transferableSkill);
  if (!(id && gameExpression && transferableSkill)) return null;

  const evidence = toResumeCollection(value.evidence, toSkillEvidence);

  const category = asEnum(value.category, SKILL_CATEGORIES) ?? "technical";
  const demandLevel = asEnum(value.demandLevel, DEMAND_LEVELS) ?? "medium";

  return {
    id,
    gameExpression,
    transferableSkill,
    industryApplications: asStringArray(value.industryApplications),
    evidence,
    confidence: asNumber(value.confidence) ?? 50,
    category,
    demandLevel,
    verified: asBoolean(value.verified) ?? false,
    aiGenerated: asBoolean(value.aiGenerated),
  };
};

/**
 * Normalizes an unknown API payload into a shared `GameStudio` contract.
 */
export const toGameStudio = (value: unknown): GameStudio | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const name = asString(value.name);
  if (!(id && name)) return null;

  return {
    id,
    name,
    logo: asString(value.logo),
    website: asString(value.website),
    location: asString(value.location) ?? "",
    size: asString(value.size) ?? "",
    type: asString(value.type) ?? "",
    founded: asNumber(value.founded),
    description: asString(value.description),
    games: asStringArray(value.games),
    technologies: asStringArray(value.technologies),
    culture: normalizeStudioCulture(value.culture),
    commonRoles: asStringArray(value.commonRoles),
    interviewStyle: asString(value.interviewStyle),
    remoteWork: asBoolean(value.remoteWork),
    category: asEnum(value.category, STUDIO_CATEGORIES),
    region: asString(value.region),
    benefits: asStringArray(value.benefits),
  };
};

const toUserShippedTitle = (
  value: Record<string, unknown>,
): UserProfile["gamingExperience"]["shippedTitles"][number] => ({
  name: asString(value.name) ?? "",
  platforms: asStringArray(value.platforms),
  releaseDate: asString(value.releaseDate),
  role: asString(value.role) ?? "",
  teamSize: asNumber(value.teamSize),
});

const normalizeUserSalaryRange = (value: unknown): UserProfile["careerGoals"]["salaryRange"] => {
  const salaryRange = asRecord(value);
  if (!salaryRange) {
    return;
  }

  const min = asNumber(salaryRange.min);
  const max = asNumber(salaryRange.max);
  if (min === undefined || max === undefined) {
    return;
  }

  return {
    min,
    max,
    currency: asString(salaryRange.currency),
  };
};

const normalizeUserCareerGoals = (value: unknown): UserProfile["careerGoals"] => {
  const careerGoals = asRecord(value) ?? {};
  const remotePreference = asEnum(careerGoals.remotePreference, USER_REMOTE_PREFERENCES);
  const salaryRange = normalizeUserSalaryRange(careerGoals.salaryRange);

  return {
    desiredRoles: asStringArray(careerGoals.desiredRoles),
    preferredCompanySize: asStringArray(careerGoals.preferredCompanySize),
    preferredLocations: asStringArray(careerGoals.preferredLocations),
    willingToRelocate: asBoolean(careerGoals.willingToRelocate),
    ...(remotePreference ? { remotePreference } : {}),
    ...(salaryRange ? { salaryRange } : {}),
  };
};

const normalizeUserGamingExperience = (value: unknown): UserProfile["gamingExperience"] => {
  const gamingExperience = asRecord(value) ?? {};
  const shippedTitles = Array.isArray(gamingExperience.shippedTitles)
    ? gamingExperience.shippedTitles
        .map((entry) => (isRecord(entry) ? toUserShippedTitle(entry) : null))
        .filter(
          (entry): entry is UserProfile["gamingExperience"]["shippedTitles"][number] =>
            entry !== null,
        )
    : [];

  return {
    yearsInGaming: asNumber(gamingExperience.yearsInGaming),
    experienceLevel: asEnum(gamingExperience.experienceLevel, USER_EXPERIENCE_LEVELS),
    specializations: asEnumArray(gamingExperience.specializations, USER_GAMING_SPECIALIZATIONS),
    gameEngines: asStringArray(gamingExperience.gameEngines),
    platforms: asStringArray(gamingExperience.platforms),
    genres: asStringArray(gamingExperience.genres),
    shippedTitles,
  };
};

/**
 * Normalizes an unknown API payload into a shared `UserProfile` contract.
 */
export const toUserProfile = (value: unknown): UserProfile | null => {
  if (!isRecord(value)) return null;

  return {
    id: asString(value.id) ?? "default",
    name: asString(value.name) ?? "",
    email: asString(value.email),
    phone: asString(value.phone),
    location: asString(value.location),
    website: asString(value.website),
    linkedin: asString(value.linkedin),
    github: asString(value.github),
    summary: asString(value.summary),
    currentRole: asString(value.currentRole),
    currentCompany: asString(value.currentCompany),
    yearsExperience: asNumber(value.yearsExperience),
    technicalSkills: asStringArray(value.technicalSkills),
    softSkills: asStringArray(value.softSkills),
    gamingExperience: normalizeUserGamingExperience(value.gamingExperience),
    careerGoals: normalizeUserCareerGoals(value.careerGoals),
  };
};

/**
 * Normalizes an unknown API payload into a shared `AppSettings` contract.
 */
export const toAppSettings = (value: unknown): AppSettings | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;

  const notificationsRecord = asRecord(value.notifications) ?? {};
  return {
    id,
    geminiApiKey: asString(value.geminiApiKey),
    openaiApiKey: asString(value.openaiApiKey),
    claudeApiKey: asString(value.claudeApiKey),
    huggingfaceToken: asString(value.huggingfaceToken),
    localModelEndpoint: asString(value.localModelEndpoint),
    localModelName: asString(value.localModelName),
    preferredModel: asString(value.preferredModel),
    preferredProvider: normalizeAIProvider(value.preferredProvider),
    theme: normalizeAppDataTheme(asString(value.theme)),
    language: asEnum(value.language, APP_LANGUAGE_CODES) ?? DEFAULT_APP_LANGUAGE,
    brandSettings: resolveBrandSettings(isRecord(value.brandSettings) ? value.brandSettings : null),
    notifications: {
      achievements: asBoolean(notificationsRecord.achievements) ?? true,
      dailyChallenges: asBoolean(notificationsRecord.dailyChallenges) ?? true,
      levelUp: asBoolean(notificationsRecord.levelUp) ?? true,
      jobAlerts: asBoolean(notificationsRecord.jobAlerts) ?? true,
    },
    automationSettings: normalizeAutomationSettings(value.automationSettings),
    emailTransportSettings: normalizeEmailTransportSettings(value.emailTransportSettings),
    hasGeminiKey: asBoolean(value.hasGeminiKey),
    hasOpenaiKey: asBoolean(value.hasOpenaiKey),
    hasClaudeKey: asBoolean(value.hasClaudeKey),
    hasHuggingfaceToken: asBoolean(value.hasHuggingfaceToken),
    hasEmailTransportPassword: asBoolean(value.hasEmailTransportPassword),
    hasLocalKey: asBoolean(value.hasLocalKey),
  };
};
