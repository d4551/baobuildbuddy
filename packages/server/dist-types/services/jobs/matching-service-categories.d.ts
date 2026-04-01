import type { Job } from "@bao/shared";
import type { UserProfile } from "./matching-service-contracts";
export declare const calculateSkillMatch: (profile: UserProfile, job: Job) => number;
export declare const calculateExperienceMatch: (profile: UserProfile, job: Job) => number;
export declare const calculateLocationMatch: (profile: UserProfile, job: Job) => number;
export declare const calculateSalaryMatch: (profile: UserProfile, job: Job) => number;
export declare const calculateCultureMatch: (profile: UserProfile, job: Job) => number;
export declare const calculateTechnologyMatch: (profile: UserProfile, job: Job) => number;
export declare const findMissingSkills: (profile: UserProfile, job: Job) => string[];
export declare const buildMatchNarrative: (scores: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    culture: number;
    technology: number;
}) => {
    strengths: string[];
    improvements: string[];
};
