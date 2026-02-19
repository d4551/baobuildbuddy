/**
 * User profile types for single-user local-first app
 */

export interface UserProfile {
  id: string; // always "default"
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  currentRole?: string;
  currentCompany?: string;
  yearsExperience?: number;
  technicalSkills: string[];
  softSkills: string[];
  gamingExperience: GamingExperienceProfile;
  careerGoals: CareerGoals;
}

export interface GamingExperienceProfile {
  yearsInGaming?: number;
  experienceLevel?: ExperienceLevel;
  specializations: GamingSpecialization[];
  gameEngines: string[];
  platforms: string[];
  genres: string[];
  shippedTitles: ShippedTitle[];
}

export type ExperienceLevel =
  | "entry"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal"
  | "director";

export type GamingSpecialization =
  | "game-programming"
  | "gameplay-programming"
  | "engine-programming"
  | "graphics-programming"
  | "ai-programming"
  | "ui-programming"
  | "network-programming"
  | "tools-programming"
  | "game-design"
  | "level-design"
  | "narrative-design"
  | "systems-design"
  | "ui-ux-design"
  | "3d-art"
  | "2d-art"
  | "concept-art"
  | "character-art"
  | "environment-art"
  | "vfx-art"
  | "animation"
  | "rigging"
  | "technical-art"
  | "audio-design"
  | "sound-engineering"
  | "music-composition"
  | "quality-assurance"
  | "production"
  | "project-management"
  | "marketing"
  | "community-management"
  | "business-development"
  | "data-analytics";

export interface ShippedTitle {
  name: string;
  platforms: string[];
  releaseDate?: string;
  role: string;
  teamSize?: number;
}

export interface CareerGoals {
  desiredRoles: string[];
  preferredCompanySize?: string[];
  preferredLocations?: string[];
  remotePreference?: "onsite" | "hybrid" | "remote" | "flexible";
  salaryRange?: { min: number; max: number; currency?: string };
  willingToRelocate?: boolean;
}

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
}
