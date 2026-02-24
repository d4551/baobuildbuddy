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
  const personalInfo: ResumePersonalInfo = {};
  if (form.name) personalInfo.name = form.name;
  if (form.email) personalInfo.email = form.email;
  if (form.phone) personalInfo.phone = form.phone;
  if (form.location) personalInfo.location = form.location;
  if (form.linkedIn) personalInfo.linkedIn = form.linkedIn;
  if (form.portfolio) personalInfo.portfolio = form.portfolio;
  return personalInfo;
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
  const skills: ResumeSkills = {};
  if (skillsInput?.length) {
    skills.technical = skillsInput;
  }
  return skills;
}

function mapFormProjectsToResumeProjects(projects: ResumeFormProject[] | undefined): ResumeProject[] {
  return (projects || []).map((project) => ({
    title: project.name,
    description: project.description,
    ...(project.technologies?.length ? { technologies: project.technologies } : {}),
    ...(project.url ? { link: project.url } : {}),
  }));
}

function buildGamingExperience(
  gaming: ResumeFormData["gaming"] | undefined,
): GamingExperience {
  const gamingExperience: GamingExperience = {};
  if (!gaming) {
    return gamingExperience;
  }

  const roles = toArray(gaming.roles);
  const genres = toArray(gaming.genres);
  const achievements = toArray(gaming.achievements);
  if (roles.length) gamingExperience.gameEngines = roles.join(", ");
  if (genres.length) gamingExperience.genres = genres.join(", ");
  if (achievements.length) gamingExperience.shippedTitles = achievements.join("; ");
  return gamingExperience;
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
  const resumeData: Partial<ResumeData> = {};
  if (Object.keys(input.personalInfo).length > 0) {
    resumeData.personalInfo = input.personalInfo;
  }
  if (input.form.summary) {
    resumeData.summary = input.form.summary;
  }
  if (input.experience.length > 0) {
    resumeData.experience = input.experience;
  }
  if (input.education.length > 0) {
    resumeData.education = input.education;
  }
  if (Object.keys(input.skills).length > 0) {
    resumeData.skills = input.skills;
  }
  if (input.projects.length > 0) {
    resumeData.projects = input.projects;
  }
  if (Object.keys(input.gamingExperience).length > 0) {
    resumeData.gamingExperience = input.gamingExperience;
  }
  return resumeData;
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

function mapResumeProjectsToFormProjects(projects: ResumeProject[] | undefined): ResumeFormProject[] {
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
