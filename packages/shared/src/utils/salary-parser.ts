/**
 * Parse salary strings into structured data
 */

import { DEFAULT_UNSPECIFIED_LABEL } from "../constants/default-labels";
import type { SalaryRange } from "../types/jobs";

export function parseSalary(input: string | SalaryRange | undefined): SalaryRange | undefined {
  if (!input) return;
  if (typeof input !== "string") return input;

  // Try to extract numbers from string like "$80,000 - $120,000"
  const numbers = input.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return;

  const parsed = numbers.map((n) => Number.parseInt(n.replace(/,/g, ""), 10));

  if (parsed.length >= 2) {
    return {
      min: Math.min(...parsed),
      max: Math.max(...parsed),
      currency: "USD",
      frequency: "yearly",
    };
  }
  if (parsed.length === 1) {
    const firstValue = parsed[0];
    if (firstValue === undefined) {
      return;
    }
    return { min: firstValue, max: firstValue, currency: "USD", frequency: "yearly" };
  }

  return;
}

export function formatSalary(salary: SalaryRange | string | undefined): string {
  if (!salary) return DEFAULT_UNSPECIFIED_LABEL;
  if (typeof salary === "string") return salary;

  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: salary.currency || "USD",
    maximumFractionDigits: 0,
  });
  if (salary.min === salary.max) return fmt.format(salary.min);
  return `${fmt.format(salary.min)} - ${fmt.format(salary.max)}`;
}
