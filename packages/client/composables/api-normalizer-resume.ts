import type {
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeProject,
} from "@bao/shared/types/resume";
import {
  asBoolean,
  asRecord,
  asString,
  asStringArray,
  isRecord,
} from "@bao/shared/utils/type-guards";
import { normalizeResumeTemplate, toResumeCollection } from "~/composables/api-normalizer-shared";

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

export const toResumeData = (value: unknown): ResumeData | null => {
  if (!isRecord(value)) return null;

  return {
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
};
