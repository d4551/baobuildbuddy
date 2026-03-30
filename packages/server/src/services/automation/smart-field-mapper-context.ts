import type { SmartFieldAnalysisContext } from "./smart-field-mapper-contracts";

const FIELD_CONTEXT_ITEM_LIMIT = 6;
const FIELD_CONTEXT_TEXT_LIMIT = 280;
const FIELD_CONTEXT_SECTION_LIMIT = 4;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getRecord = (value: unknown, key: string): Record<string, unknown> | null => {
  if (!isRecord(value)) {
    return null;
  }
  const entry = value[key];
  return isRecord(entry) ? entry : null;
};

const getTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const truncateText = (value: string): string =>
  value.length > FIELD_CONTEXT_TEXT_LIMIT
    ? `${value.slice(0, FIELD_CONTEXT_TEXT_LIMIT)}...`
    : value;

const uniqueNonEmptyStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  );
};

const getResumeHighlights = (resume: Record<string, unknown>): string[] => {
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const highlights: string[] = [];

  for (const entry of experience) {
    if (!(isRecord(entry) && highlights.length < FIELD_CONTEXT_ITEM_LIMIT)) {
      continue;
    }

    const title = getTrimmedString(entry.title);
    const company = getTrimmedString(entry.company);
    const description = truncateText(getTrimmedString(entry.description));
    const achievements = uniqueNonEmptyStrings(entry.achievements).slice(0, 2);
    const parts = [title, company, description, ...achievements].filter((part) => part.length > 0);
    if (parts.length > 0) {
      highlights.push(parts.join(" | "));
    }
  }

  return highlights;
};

const getProjectHighlights = (resume: Record<string, unknown>): string[] => {
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const highlights: string[] = [];

  for (const entry of projects) {
    if (!(isRecord(entry) && highlights.length < FIELD_CONTEXT_SECTION_LIMIT)) {
      continue;
    }

    const title = getTrimmedString(entry.title);
    const description = truncateText(getTrimmedString(entry.description));
    const technologies = uniqueNonEmptyStrings(entry.technologies).slice(0, 3).join(", ");
    const parts = [title, description, technologies].filter((part) => part.length > 0);
    if (parts.length > 0) {
      highlights.push(parts.join(" | "));
    }
  }

  return highlights;
};

export const getCandidateContextSummary = (context: SmartFieldAnalysisContext): string => {
  const personalInfo = getRecord(context.resume, "personalInfo");
  const skills = getRecord(context.resume, "skills");
  const coverLetterContent = getRecord(context.coverLetter ?? null, "content");
  const coverLetterSections = [
    getTrimmedString(coverLetterContent?.opening),
    getTrimmedString(coverLetterContent?.body),
    getTrimmedString(coverLetterContent?.closing),
    getTrimmedString(coverLetterContent?.introduction),
    getTrimmedString(coverLetterContent?.main),
    getTrimmedString(coverLetterContent?.conclusion),
  ]
    .filter((entry) => entry.length > 0)
    .slice(0, FIELD_CONTEXT_SECTION_LIMIT)
    .map((entry) => truncateText(entry));

  const candidateProfile = {
    personalInfo: {
      name: getTrimmedString(personalInfo?.name),
      email: getTrimmedString(personalInfo?.email),
      phone: getTrimmedString(personalInfo?.phone),
      location: getTrimmedString(personalInfo?.location),
      website: getTrimmedString(personalInfo?.website),
      linkedIn: getTrimmedString(personalInfo?.linkedIn),
      github: getTrimmedString(personalInfo?.github),
      portfolio: getTrimmedString(personalInfo?.portfolio),
    },
    summary: truncateText(getTrimmedString(context.resume.summary)),
    experienceHighlights: getResumeHighlights(context.resume),
    projectHighlights: getProjectHighlights(context.resume),
    skills: {
      technical: uniqueNonEmptyStrings(skills?.technical).slice(0, FIELD_CONTEXT_ITEM_LIMIT),
      soft: uniqueNonEmptyStrings(skills?.soft).slice(0, FIELD_CONTEXT_ITEM_LIMIT),
      gaming: uniqueNonEmptyStrings(skills?.gaming).slice(0, FIELD_CONTEXT_ITEM_LIMIT),
    },
    coverLetterHighlights: coverLetterSections,
    existingAnswers: context.existingAnswers,
  };

  return JSON.stringify(candidateProfile, null, 2);
};
