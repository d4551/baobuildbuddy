import type { Achievement, DailyChallenge } from "@bao/shared/types/gamification";
import {
  asBoolean,
  asJsonArray,
  asNumber,
  asString,
  isRecord,
} from "@bao/shared/utils/type-guards";

export const toAchievement = <T>(value: T): Achievement | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  const name = asString(value.name);
  const description = asString(value.description);
  const icon = asString(value.icon);
  const rawIconKind = asString(value.iconType);
  const rawCategory = asString(value.category);
  const rawRarity = asString(value.rarity);
  const xpReward = asNumber(value.xpReward);
  const unlocked = asBoolean(value.unlocked);
  if (!(id && name && description && icon && rawIconKind && rawCategory && rawRarity)) {
    return null;
  }
  if (xpReward === undefined || unlocked === undefined) {
    return null;
  }
  if (rawIconKind !== "emoji" && rawIconKind !== "custom") {
    return null;
  }
  if (
    rawCategory !== "progress" &&
    rawCategory !== "social" &&
    rawCategory !== "skill" &&
    rawCategory !== "special" &&
    rawCategory !== "milestone"
  ) {
    return null;
  }
  if (
    rawRarity !== "common" &&
    rawRarity !== "rare" &&
    rawRarity !== "epic" &&
    rawRarity !== "legendary"
  ) {
    return null;
  }
  const achievement: Achievement = {
    id,
    name,
    description,
    icon,
    iconType: rawIconKind,
    category: rawCategory,
    xpReward,
    requirements: {},
    unlocked,
    rarity: rawRarity,
  };
  const unlockedAt = asString(value.unlockedAt);
  if (unlockedAt) {
    achievement.unlockedAt = unlockedAt;
  }
  const hidden = asBoolean(value.hidden);
  if (hidden !== undefined) {
    achievement.hidden = hidden;
  }
  return achievement;
};

export const toDailyChallenge = <T>(value: T): DailyChallenge | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  const name = asString(value.name);
  const description = asString(value.description);
  const icon = asString(value.icon);
  const rawIconKind = asString(value.iconType);
  const rawCategory = asString(value.category);
  const xpReward = asNumber(value.xpReward);
  const completed = asBoolean(value.completed);
  if (!(id && name && description && icon && rawIconKind && rawCategory)) {
    return null;
  }
  if (xpReward === undefined || completed === undefined) {
    return null;
  }
  if (rawIconKind !== "emoji" && rawIconKind !== "custom") {
    return null;
  }
  if (
    rawCategory !== "profile" &&
    rawCategory !== "job_search" &&
    rawCategory !== "skill_building" &&
    rawCategory !== "social" &&
    rawCategory !== "engagement"
  ) {
    return null;
  }
  const challenge: DailyChallenge = {
    id,
    name,
    description,
    icon,
    iconType: rawIconKind,
    category: rawCategory,
    xpReward,
    completed,
  };
  const validUntil = asString(value.validUntil);
  if (validUntil) {
    challenge.validUntil = validUntil;
  }
  const progress = asNumber(value.progress);
  if (progress !== undefined) {
    challenge.progress = progress;
  }
  const goal = asNumber(value.goal);
  if (goal !== undefined) {
    challenge.goal = goal;
  }
  return challenge;
};

export const parseAchievementList = <T>(value: T): Achievement[] => {
  const entries = asJsonArray(value) ?? [];
  const achievements: Achievement[] = [];
  for (const entry of entries) {
    const achievement = toAchievement(entry);
    if (achievement) {
      achievements.push(achievement);
    }
  }
  return achievements;
};

export const parseDailyChallengeList = <T>(value: T): DailyChallenge[] => {
  const entries = asJsonArray(value) ?? [];
  const challenges: DailyChallenge[] = [];
  for (const entry of entries) {
    const challenge = toDailyChallenge(entry);
    if (challenge) {
      challenges.push(challenge);
    }
  }
  return challenges;
};
