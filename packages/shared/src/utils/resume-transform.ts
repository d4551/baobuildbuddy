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

/**
 * Convert form data to canonical ResumeData.
 */
export function formDataToResumeData(form: Partial<ResumeFormData>): Partial<ResumeData> {
  const personalInfo: ResumePersonalInfo = {};
  if (form.name) personalInfo.name = form.name;
  if (form.email) personalInfo.email = form.email;
  if (form.phone) personalInfo.phone = form.phone;
  if (form.location) personalInfo.location = form.location;
  if (form.linkedIn) personalInfo.linkedIn = form.linkedIn;
  if (form.portfolio) personalInfo.portfolio = form.portfolio;

  const experience: ResumeExperienceItem[] = (form.experience || []).map((exp) => ({
    title: exp.title,
    company: exp.company,
    startDate: exp.startDate,
    endDate: exp.current ? undefined : exp.endDate || undefined,
    location: exp.location || undefined,
    description: exp.description || undefined,
  }));

  const education: ResumeEducationItem[] = (form.education || []).map((edu) => ({
    degree: edu.degree,
    school: edu.school,
    field: "",
    year: edu.graduationDate,
    gpa: edu.gpa || undefined,
  }));

  const skills: ResumeSkills = {};
  if (form.skills?.length) {
    skills.technical = form.skills;
  }

  const projects: ResumeProject[] = (form.projects || []).map((p) => ({
    title: p.name,
    description: p.description,
    technologies: p.technologies?.length ? p.technologies : undefined,
    link: p.url || undefined,
  }));

  const gamingExperience: GamingExperience = {};
  if (form.gaming) {
    const roles = toArray(form.gaming.roles);
    const genres = toArray(form.gaming.genres);
    const achievements = toArray(form.gaming.achievements);
    if (roles.length) gamingExperience.gameEngines = roles.join(", ");
    if (genres.length) gamingExperience.genres = genres.join(", ");
    if (achievements.length) gamingExperience.shippedTitles = achievements.join("; ");
  }

  return {
    personalInfo: Object.keys(personalInfo).length ? personalInfo : undefined,
    summary: form.summary || undefined,
    experience: experience.length ? experience : undefined,
    education: education.length ? education : undefined,
    skills: Object.keys(skills).length ? skills : undefined,
    projects: projects.length ? projects : undefined,
    gamingExperience: Object.keys(gamingExperience).length ? gamingExperience : undefined,
  };
}

/**
 * Convert canonical ResumeData to form data.
 */
export function resumeDataToFormData(resume: Partial<ResumeData>): ResumeFormData {
  const pi = resume.personalInfo || {};
  const form: ResumeFormData = {
    name: pi.name || "",
    email: pi.email || "",
    phone: pi.phone || "",
    location: pi.location || "",
    summary: resume.summary || "",
    linkedIn: pi.linkedIn || "",
    portfolio: pi.portfolio || "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    gaming: { roles: [], genres: [], achievements: [] },
  };

  form.experience = (resume.experience || []).map((exp) => ({
    title: exp.title,
    company: exp.company,
    location: exp.location || "",
    startDate: exp.startDate,
    endDate: exp.endDate || "",
    current: !exp.endDate,
    description: exp.description || "",
  }));

  form.education = (resume.education || []).map((edu) => ({
    degree: edu.degree,
    school: edu.school,
    location: "",
    graduationDate: edu.year,
    gpa: edu.gpa || "",
  }));

  const tech = resume.skills?.technical || [];
  const soft = resume.skills?.soft || [];
  form.skills = [...tech, ...soft];

  form.projects = (resume.projects || []).map((p) => ({
    name: p.title,
    description: p.description,
    technologies: p.technologies || [],
    url: p.link || "",
  }));

  const ge = resume.gamingExperience || {};
  form.gaming = {
    roles: ge.gameEngines ? ge.gameEngines.split(",").map((s) => s.trim()) : [],
    genres: ge.genres ? ge.genres.split(",").map((s) => s.trim()) : [],
    achievements: ge.shippedTitles ? ge.shippedTitles.split(";").map((s) => s.trim()) : [],
  };

  return form;
}
