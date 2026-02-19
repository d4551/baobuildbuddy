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
