import {
  APP_LANGUAGE_CODES,
  AI_PROVIDER_DEFAULT,
  DEFAULT_APP_LANGUAGE,
  DEFAULT_SPEECH_SETTINGS,
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
  JOB_TYPES,
  SPEECH_PROVIDER_OPTIONS,
  type AIProviderType,
  type AppSettings,
  type AutomationSettings,
  type CoverLetterData,
  COVER_LETTER_DEFAULT_TEMPLATE,
  isCoverLetterTemplate,
  RESUME_TEMPLATE_DEFAULT,
  RESUME_TEMPLATE_OPTIONS,
  DEFAULT_AUTOMATION_SETTINGS,
  type GameStudio,
  type Job,
  type JobExperienceLevel,
  type JobType,
  type PortfolioData,
  type PortfolioMetadata,
  type PortfolioProject,
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
  type StudioCulture,
  type UserProfile,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  isRecord,
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
  if (!isRecord(value)) return undefined;

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
  };
};

const normalizeSalary = (value: unknown): Job["salary"] | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord(value)) {
    return undefined;
  }

  const min = asNumber(value.min);
  const max = asNumber(value.max);
  if (min === undefined || max === undefined) {
    return undefined;
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
  if (!id || !title || !company || !location) return null;

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
  if (!title || !company || !startDate) return null;
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
  if (!degree || !field || !school || !year) return null;
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
  if (!title || !description) return null;
  return {
    title,
    description,
    technologies: asStringArray(value.technologies),
    link: asString(value.link),
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
  };

  const personalInfo = asRecord(value.personalInfo);
  if (personalInfo) {
    resume.personalInfo = {
      name: asString(personalInfo.name),
      email: asString(personalInfo.email),
      phone: asString(personalInfo.phone),
      location: asString(personalInfo.location),
      website: asString(personalInfo.website),
      linkedIn: asString(personalInfo.linkedIn),
      github: asString(personalInfo.github),
      portfolio: asString(personalInfo.portfolio),
    };
  }

  resume.experience = Array.isArray(value.experience)
    ? value.experience
        .map(toResumeExperience)
        .filter((entry): entry is ResumeExperienceItem => entry !== null)
    : [];
  resume.education = Array.isArray(value.education)
    ? value.education
        .map(toResumeEducation)
        .filter((entry): entry is ResumeEducationItem => entry !== null)
    : [];
  resume.projects = Array.isArray(value.projects)
    ? value.projects.map(toResumeProject).filter((entry): entry is ResumeProject => entry !== null)
    : [];

  const skills = asRecord(value.skills);
  if (skills) {
    resume.skills = {
      technical: asStringArray(skills.technical),
      soft: asStringArray(skills.soft),
      gaming: asStringArray(skills.gaming),
    };
  }

  const gamingExperience = asRecord(value.gamingExperience);
  if (gamingExperience) {
    resume.gamingExperience = {
      gameEngines: asString(gamingExperience.gameEngines),
      platforms: asString(gamingExperience.platforms),
      genres: asString(gamingExperience.genres),
      shippedTitles: asString(gamingExperience.shippedTitles),
    };
  }

  return resume;
};

/**
 * Normalizes an unknown API payload into a shared `CoverLetterData` contract.
 */
export const toCoverLetterData = (value: unknown): CoverLetterData | null => {
  if (!isRecord(value)) return null;
  const company = asString(value.company);
  const position = asString(value.position);
  if (!company || !position) return null;

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
  if (!title || !description) return null;

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

/**
 * Normalizes an unknown API payload into a shared `SkillMapping` contract.
 */
export const toSkillMapping = (value: unknown): SkillMapping | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const gameExpression = asString(value.gameExpression);
  const transferableSkill = asString(value.transferableSkill);
  if (!id || !gameExpression || !transferableSkill) return null;

  const evidence: SkillEvidence[] = [];
  if (Array.isArray(value.evidence)) {
    for (const entry of value.evidence) {
      if (!isRecord(entry)) continue;
      const evidenceId = asString(entry.id);
      const title = asString(entry.title);
      const description = asString(entry.description);
      if (!evidenceId || !title || !description) continue;

      evidence.push({
        id: evidenceId,
        type: asEnum(entry.type, SKILL_EVIDENCE_TYPES) ?? "document",
        title,
        description,
        url: asString(entry.url),
        verificationStatus: asEnum(entry.verificationStatus, SKILL_EVIDENCE_STATUSES) ?? "pending",
      });
    }
  }

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
  if (!id || !name) return null;

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

/**
 * Normalizes an unknown API payload into a shared `UserProfile` contract.
 */
export const toUserProfile = (value: unknown): UserProfile | null => {
  if (!isRecord(value)) return null;

  const id = asString(value.id) ?? "default";
  const name = asString(value.name) ?? "";
  const gamingExperience = asRecord(value.gamingExperience) ?? {};
  const careerGoals = asRecord(value.careerGoals) ?? {};
  const remotePreference =
    careerGoals.remotePreference === "onsite" ||
    careerGoals.remotePreference === "hybrid" ||
    careerGoals.remotePreference === "remote" ||
    careerGoals.remotePreference === "flexible"
      ? careerGoals.remotePreference
      : null;
  const salaryRange =
    isRecord(careerGoals.salaryRange) &&
    typeof careerGoals.salaryRange.min === "number" &&
    typeof careerGoals.salaryRange.max === "number"
      ? {
          min: careerGoals.salaryRange.min,
          max: careerGoals.salaryRange.max,
          currency: asString(careerGoals.salaryRange.currency),
        }
      : null;

  return {
    id,
    name,
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
    gamingExperience: {
      yearsInGaming: asNumber(gamingExperience.yearsInGaming),
      experienceLevel: asEnum(gamingExperience.experienceLevel, USER_EXPERIENCE_LEVELS),
      specializations: asEnumArray(gamingExperience.specializations, USER_GAMING_SPECIALIZATIONS),
      gameEngines: asStringArray(gamingExperience.gameEngines),
      platforms: asStringArray(gamingExperience.platforms),
      genres: asStringArray(gamingExperience.genres),
      shippedTitles: Array.isArray(gamingExperience.shippedTitles)
        ? gamingExperience.shippedTitles
            .map((entry) => (isRecord(entry) ? entry : null))
            .filter((entry): entry is Record<string, unknown> => entry !== null)
            .map((entry) => ({
              name: asString(entry.name) ?? "",
              platforms: asStringArray(entry.platforms),
              releaseDate: asString(entry.releaseDate),
              role: asString(entry.role) ?? "",
              teamSize: asNumber(entry.teamSize),
            }))
        : [],
    },
    careerGoals: {
      desiredRoles: asStringArray(careerGoals.desiredRoles),
      preferredCompanySize: asStringArray(careerGoals.preferredCompanySize),
      preferredLocations: asStringArray(careerGoals.preferredLocations),
      willingToRelocate: asBoolean(careerGoals.willingToRelocate),
      ...(remotePreference ? { remotePreference } : {}),
      ...(salaryRange ? { salaryRange } : {}),
    },
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
    theme: value.theme === "bao-dark" ? "bao-dark" : "bao-light",
    language: asEnum(value.language, APP_LANGUAGE_CODES) ?? DEFAULT_APP_LANGUAGE,
    notifications: {
      achievements: asBoolean(notificationsRecord.achievements) ?? true,
      dailyChallenges: asBoolean(notificationsRecord.dailyChallenges) ?? true,
      levelUp: asBoolean(notificationsRecord.levelUp) ?? true,
      jobAlerts: asBoolean(notificationsRecord.jobAlerts) ?? true,
    },
    automationSettings: normalizeAutomationSettings(value.automationSettings),
    hasGeminiKey: asBoolean(value.hasGeminiKey),
    hasOpenaiKey: asBoolean(value.hasOpenaiKey),
    hasClaudeKey: asBoolean(value.hasClaudeKey),
    hasHuggingfaceToken: asBoolean(value.hasHuggingfaceToken),
    hasLocalKey: asBoolean(value.hasLocalKey),
  };
};
