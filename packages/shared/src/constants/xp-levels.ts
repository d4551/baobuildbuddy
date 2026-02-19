/**
 * XP level progression system
 */

import type { XPLevel } from "../types/gamification";

export const XP_LEVELS: XPLevel[] = [
  {
    level: 1,
    title: "Novice Adventurer",
    minXP: 0,
    maxXP: 100,
    color: "#9CA3AF",
    features: ["Basic profile"],
  },
  {
    level: 2,
    title: "Apprentice",
    minXP: 100,
    maxXP: 250,
    color: "#6B7280",
    features: ["Resume builder"],
  },
  {
    level: 3,
    title: "Journeyman",
    minXP: 250,
    maxXP: 500,
    color: "#10B981",
    features: ["AI chat"],
  },
  {
    level: 4,
    title: "Skilled Crafter",
    minXP: 500,
    maxXP: 850,
    color: "#3B82F6",
    features: ["Job matching"],
  },
  {
    level: 5,
    title: "Expert",
    minXP: 850,
    maxXP: 1300,
    color: "#6366F1",
    features: ["Interview prep"],
  },
  {
    level: 6,
    title: "Master",
    minXP: 1300,
    maxXP: 1900,
    color: "#8B5CF6",
    features: ["Portfolio builder"],
  },
  {
    level: 7,
    title: "Grandmaster",
    minXP: 1900,
    maxXP: 2700,
    color: "#A855F7",
    features: ["Skill mapping"],
  },
  {
    level: 8,
    title: "Legend",
    minXP: 2700,
    maxXP: 3800,
    color: "#EC4899",
    features: ["Career pathways"],
  },
  {
    level: 9,
    title: "Mythic",
    minXP: 3800,
    maxXP: 5200,
    color: "#F59E0B",
    features: ["Advanced analytics"],
  },
  {
    level: 10,
    title: "Transcendent",
    minXP: 5200,
    maxXP: Number.POSITIVE_INFINITY,
    color: "#EF4444",
    features: ["Everything unlocked"],
  },
];

export function getLevelForXP(xp: number): XPLevel {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) return XP_LEVELS[i];
  }
  return XP_LEVELS[0];
}

export function getXPProgress(xp: number): {
  level: XPLevel;
  nextLevel: XPLevel | null;
  progress: number;
} {
  const level = getLevelForXP(xp);
  const levelIndex = XP_LEVELS.indexOf(level);
  const nextLevel = levelIndex < XP_LEVELS.length - 1 ? XP_LEVELS[levelIndex + 1] : null;

  const progress = nextLevel ? (xp - level.minXP) / (nextLevel.minXP - level.minXP) : 1;

  return { level, nextLevel, progress };
}
