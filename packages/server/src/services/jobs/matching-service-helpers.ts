import type { Job, MatchScore } from "@bao/shared";
import { DECIMAL_RADIX, JOB_SALARY_PARSE_MULTIPLIER } from "@bao/shared";
import type { ParsedSalaryRange } from "./matching-service-contracts";

export const resolveMatchScore = (value: number | MatchScore | undefined): number => {
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object") {
    return value.overall;
  }
  return 0;
};

export const parseSalaryRange = (salary: Job["salary"]): ParsedSalaryRange | null => {
  if (!salary) {
    return null;
  }

  if (typeof salary === "string") {
    const numbers = salary.match(/\d+/g);
    if (!(numbers && numbers.length >= 1)) {
      return null;
    }
    const min = Number.parseInt(numbers[0], DECIMAL_RADIX) * JOB_SALARY_PARSE_MULTIPLIER;
    const max =
      numbers.length > 1
        ? Number.parseInt(numbers[1], DECIMAL_RADIX) * JOB_SALARY_PARSE_MULTIPLIER
        : min;
    return { min, max };
  }

  if (
    typeof salary === "object" &&
    typeof salary.min === "number" &&
    typeof salary.max === "number"
  ) {
    return { min: salary.min, max: salary.max };
  }

  return null;
};

export const calculateOverlapScore = (
  salaryRange: ParsedSalaryRange,
  userMin: number,
  userMax: number,
): number => {
  const overlapStart = Math.max(salaryRange.min, userMin);
  const overlapEnd = Math.min(salaryRange.max, userMax);
  const overlapSize = overlapEnd - overlapStart;
  const userRangeSize = userMax - userMin;
  const overlapPercent = overlapSize / userRangeSize;
  return Math.min(100, Math.round(overlapPercent * 100 + 50));
};
