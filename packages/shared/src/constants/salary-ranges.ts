/**
 * Salary range constants for gaming industry
 */

export const SALARY_RANGES = {
  ENTRY: { min: 50_000, max: 75_000 },
  JUNIOR: { min: 60_000, max: 85_000 },
  MID: { min: 75_000, max: 110_000 },
  SENIOR: { min: 100_000, max: 150_000 },
  PRINCIPAL: { min: 140_000, max: 200_000 },
  DIRECTOR: { min: 180_000, max: 300_000 },
} as const;

export type SalaryTier = keyof typeof SALARY_RANGES;

/**
 * Pathway-specific salary ranges (single source of truth for career pathway averageSalary).
 * Keys match SKILL_CATEGORY_IDS.
 */
export const PATHWAY_SALARY_RANGES = {
  technical: SALARY_RANGES.MID,
  leadership: { min: 80_000, max: 140_000 },
  community: { min: 50_000, max: 90_000 },
  creative: { min: 60_000, max: 110_000 },
  analytical: { min: 65_000, max: 105_000 },
  communication: { min: 50_000, max: 85_000 },
  project_management: { min: 75_000, max: 130_000 },
} as const;
