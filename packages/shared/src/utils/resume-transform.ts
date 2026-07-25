import {
  RESUME_TEMPLATE_DEFAULT,
  type ResumeTemplate,
  isResumeTemplate,
} from "../constants/resume";
import type {
  GamingExperience,
  ResumeData,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumePersonalInfo,
  ResumeProject,
  ResumeSkills,
} from "../types/resume";

/**
 * Form data structure used by resume builder (flat + form-specific shapes).
 */
export interface ResumeFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  linkedIn: string;
  portfolio: string;
  template: ResumeTemplate;
  experience: ResumeFormExperience[];
  education: ResumeFormEducation[];
  skills: string[];
  projects: ResumeFormProject[];
  gaming: {
    roles: string | string[];
    genres: string | string[];
    achievements: string | string[];
  };
}

export interface ResumeFormExperience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface ResumeFormEducation {
  degree: string;
  school: string;
  location: string;
  graduationDate: string;
  gpa: string;
}

export interface ResumeFormProject {
  name: string;
  description: string;
  technologies: string[];
  url: string;
}

function toArray(val: string | string[]): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function buildPersonalInfo(form: Partial<ResumeFormData>): ResumePersonalInfo {
  return {
    ...(form.name ? { name: form.name } : {}),
    ...(form.email ? { email: form.email } : {}),
    ...(form.phone ? { phone: form.phone } : {}),
    ...(form.location ? { location: form.location } : {}),
    ...(form.linkedIn ? { linkedIn: form.linkedIn } : {}),
    ...(form.portfolio ? { portfolio: form.portfolio } : {}),
  };
}

function mapFormExperienceToResumeExperience(
  experience: ResumeFormExperience[] | undefined,
): ResumeExperienceItem[] {
  return (experience || []).map((exp) => ({
    title: exp.title,
    company: exp.company,
    startDate: exp.startDate,
    ...(!exp.current && exp.endDate ? { endDate: exp.endDate } : {}),
    ...(exp.location ? { location: exp.location } : {}),
    ...(exp.description ? { description: exp.description } : {}),
  }));
}

function mapFormEducationToResumeEducation(
  education: ResumeFormEducation[] | undefined,
): ResumeEducationItem[] {
  return (education || []).map((edu) => ({
    degree: edu.degree,
    school: edu.school,
    field: "",
    year: edu.graduationDate,
    ...(edu.gpa ? { gpa: edu.gpa } : {}),
  }));
}

function buildSkillsFromForm(skillsInput: string[] | undefined): ResumeSkills {
  return (skillsInput ?? []).length > 0 ? { technical: skillsInput } : {};
}

function mapFormProjectsToResumeProjects(
  projects: ResumeFormProject[] | undefined,
): ResumeProject[] {
  return (projects || []).map((project) => ({
    title: project.name,
    description: project.description,
    ...((project.technologies ?? []).length > 0 ? { technologies: project.technologies } : {}),
    ...(project.url ? { link: project.url } : {}),
  }));
}

function buildGamingExperience(gaming: ResumeFormData["gaming"] | undefined): GamingExperience {
  if (!gaming) return {};

  const roles = toArray(gaming.roles);
  const genres = toArray(gaming.genres);
  const achievements = toArray(gaming.achievements);
  return {
    ...(roles.length > 0 ? { gameEngines: roles.join(", ") } : {}),
    ...(genres.length > 0 ? { genres: genres.join(", ") } : {}),
    ...(achievements.length > 0 ? { shippedTitles: achievements.join("; ") } : {}),
  };
}

function buildResumeData(input: {
  form: Partial<ResumeFormData>;
  personalInfo: ResumePersonalInfo;
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  skills: ResumeSkills;
  projects: ResumeProject[];
  gamingExperience: GamingExperience;
}): Partial<ResumeData> {
  return {
    ...(Object.keys(input.personalInfo).length > 0 ? { personalInfo: input.personalInfo } : {}),
    ...(input.form.summary ? { summary: input.form.summary } : {}),
    ...(input.form.template && isResumeTemplate(input.form.template)
      ? { template: input.form.template }
      : {}),
    ...(input.experience.length > 0 ? { experience: input.experience } : {}),
    ...(input.education.length > 0 ? { education: input.education } : {}),
    ...(Object.keys(input.skills).length > 0 ? { skills: input.skills } : {}),
    ...(input.projects.length > 0 ? { projects: input.projects } : {}),
    ...(Object.keys(input.gamingExperience).length > 0
      ? { gamingExperience: input.gamingExperience }
      : {}),
  };
}

function mapResumeExperienceToFormExperience(
  experience: ResumeExperienceItem[] | undefined,
): ResumeFormExperience[] {
  return (experience || []).map((exp) => ({
    title: exp.title,
    company: exp.company,
    location: exp.location || "",
    startDate: exp.startDate,
    endDate: exp.endDate || "",
    current: !exp.endDate,
    description: exp.description || "",
  }));
}

function mapResumeEducationToFormEducation(
  education: ResumeEducationItem[] | undefined,
): ResumeFormEducation[] {
  return (education || []).map((edu) => ({
    degree: edu.degree,
    school: edu.school,
    location: "",
    graduationDate: edu.year,
    gpa: edu.gpa || "",
  }));
}

function mapResumeProjectsToFormProjects(
  projects: ResumeProject[] | undefined,
): ResumeFormProject[] {
  return (projects || []).map((project) => ({
    name: project.title,
    description: project.description,
    technologies: project.technologies || [],
    url: project.link || "",
  }));
}

function splitDelimited(value: string | undefined, delimiter: string): string[] {
  return value ? value.split(delimiter).map((entry) => entry.trim()) : [];
}

/**
 * Convert form data to canonical ResumeData.
 */
export function formDataToResumeData(form: Partial<ResumeFormData>): Partial<ResumeData> {
  const personalInfo = buildPersonalInfo(form);
  const experience = mapFormExperienceToResumeExperience(form.experience);
  const education = mapFormEducationToResumeEducation(form.education);
  const skills = buildSkillsFromForm(form.skills);
  const projects = mapFormProjectsToResumeProjects(form.projects);
  const gamingExperience = buildGamingExperience(form.gaming);

  return buildResumeData({
    form,
    personalInfo,
    experience,
    education,
    skills,
    projects,
    gamingExperience,
  });
}

/**
 * Convert canonical ResumeData to form data.
 */
export function resumeDataToFormData(resume: Partial<ResumeData>): ResumeFormData {
  const pi = resume.personalInfo || {};
  return {
    name: pi.name || "",
    email: pi.email || "",
    phone: pi.phone || "",
    location: pi.location || "",
    summary: resume.summary || "",
    template: isResumeTemplate(resume.template) ? resume.template : RESUME_TEMPLATE_DEFAULT,
    linkedIn: pi.linkedIn || "",
    portfolio: pi.portfolio || "",
    experience: mapResumeExperienceToFormExperience(resume.experience),
    education: mapResumeEducationToFormEducation(resume.education),
    skills: [...(resume.skills?.technical || []), ...(resume.skills?.soft || [])],
    projects: mapResumeProjectsToFormProjects(resume.projects),
    gaming: {
      roles: splitDelimited(resume.gamingExperience?.gameEngines, ","),
      genres: splitDelimited(resume.gamingExperience?.genres, ","),
      achievements: splitDelimited(resume.gamingExperience?.shippedTitles, ";"),
    },
  };
}
