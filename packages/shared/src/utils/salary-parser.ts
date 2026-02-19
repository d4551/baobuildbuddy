/**
 * Parse salary strings into structured data
 */

import type { SalaryRange } from "../types/jobs";

export function parseSalary(input: string | SalaryRange | undefined): SalaryRange | undefined {
  if (!input) return undefined;
  if (typeof input !== "string") return input;

  // Try to extract numbers from string like "$80,000 - $120,000"
  const numbers = input.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return undefined;

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
    return { min: parsed[0], max: parsed[0], currency: "USD", frequency: "yearly" };
  }

  return undefined;
}

export function formatSalary(salary: SalaryRange | string | undefined): string {
  if (!salary) return "Not specified";
  if (typeof salary === "string") return salary;

  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: salary.currency || "USD",
    maximumFractionDigits: 0,
  });
  if (salary.min === salary.max) return fmt.format(salary.min);
  return `${fmt.format(salary.min)} - ${fmt.format(salary.max)}`;
}
