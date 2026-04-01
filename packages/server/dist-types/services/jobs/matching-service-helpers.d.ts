import type { Job, MatchScore } from "@bao/shared";
import type { ParsedSalaryRange } from "./matching-service-contracts";
export declare const resolveMatchScore: (value: number | MatchScore | undefined) => number;
export declare const parseSalaryRange: (salary: Job["salary"]) => ParsedSalaryRange | null;
export declare const calculateOverlapScore: (salaryRange: ParsedSalaryRange, userMin: number, userMax: number) => number;
