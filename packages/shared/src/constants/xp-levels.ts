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
    accentColor: "neutral",
    features: ["Basic profile"],
  },
  {
    level: 2,
    title: "Apprentice",
    minXP: 100,
    maxXP: 250,
    accentColor: "base-content",
    features: ["Resume builder"],
  },
  {
    level: 3,
    title: "Journeyman",
    minXP: 250,
    maxXP: 500,
    accentColor: "success",
    features: ["AI chat"],
  },
  {
    level: 4,
    title: "Skilled Crafter",
    minXP: 500,
    maxXP: 850,
    accentColor: "info",
    features: ["Job matching"],
  },
  {
    level: 5,
    title: "Expert",
    minXP: 850,
    maxXP: 1300,
    accentColor: "primary",
    features: ["Interview prep"],
  },
  {
    level: 6,
    title: "Master",
    minXP: 1300,
    maxXP: 1900,
    accentColor: "secondary",
    features: ["Portfolio builder"],
  },
  {
    level: 7,
    title: "Grandmaster",
    minXP: 1900,
    maxXP: 2700,
    accentColor: "accent",
    features: ["Skill mapping"],
  },
  {
    level: 8,
    title: "Legend",
    minXP: 2700,
    maxXP: 3800,
    accentColor: "accent",
    features: ["Career pathways"],
  },
  {
    level: 9,
    title: "Mythic",
    minXP: 3800,
    maxXP: 5200,
    accentColor: "warning",
    features: ["Advanced analytics"],
  },
  {
    level: 10,
    title: "Transcendent",
    minXP: 5200,
    maxXP: Number.POSITIVE_INFINITY,
    accentColor: "error",
    features: ["Everything unlocked"],
  },
];

const getFirstXPLevel = (): XPLevel => {
  const firstLevel = XP_LEVELS[0];
  if (!firstLevel) {
    throw new Error("XP levels are not configured.");
  }
  return firstLevel;
};

export function getLevelForXP(xp: number): XPLevel {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    const level = XP_LEVELS[i];
    if (level && xp >= level.minXP) {
      return level;
    }
  }
  return getFirstXPLevel();
}

export function getXPProgress(xp: number): {
  level: XPLevel;
  nextLevel: XPLevel | null;
  progress: number;
} {
  const level = getLevelForXP(xp);
  const levelIndex = XP_LEVELS.indexOf(level);
  const nextLevel =
    levelIndex >= 0 && levelIndex < XP_LEVELS.length - 1
      ? (XP_LEVELS[levelIndex + 1] ?? null)
      : null;

  const progress = nextLevel ? (xp - level.minXP) / (nextLevel.minXP - level.minXP) : 1;

  return { level, nextLevel, progress };
}
