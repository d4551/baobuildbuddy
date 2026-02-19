/**
 * Gaming industry role constants
 */

export const GAMING_ROLES = {
  DESIGN: [
    "Game Designer",
    "Level Designer",
    "Narrative Designer",
    "UX Designer",
    "Systems Designer",
  ],
  ENGINEERING: [
    "Gameplay Programmer",
    "Engine Programmer",
    "Graphics Programmer",
    "Tools Programmer",
    "Backend Developer",
    "Network Programmer",
    "AI Programmer",
    "UI Programmer",
  ],
  ART: [
    "Concept Artist",
    "3D Artist",
    "2D Artist",
    "Technical Artist",
    "Animator",
    "VFX Artist",
    "Character Artist",
    "Environment Artist",
  ],
  AUDIO: ["Sound Designer", "Audio Programmer", "Composer", "Voice Director"],
  PRODUCTION: ["Producer", "Project Manager", "Scrum Master", "Development Director"],
  QA: ["QA Tester", "QA Lead", "Automation Engineer", "Compliance Tester"],
  BUSINESS: ["Business Development", "Marketing Manager", "Community Manager", "Data Analyst"],
} as const;

export const ALL_GAMING_ROLES = Object.values(GAMING_ROLES).flat();

export type GamingRoleCategory = keyof typeof GAMING_ROLES;
