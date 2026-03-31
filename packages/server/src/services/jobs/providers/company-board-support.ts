import type { CompanyBoardATSType, JobProviderSettings } from "@bao/shared/types/settings-contracts";
import { generateId } from "@bao/shared/utils/validation";

export interface ATSJob extends Record<string, unknown> {
  id?: string;
  title?: string;
  text?: string;
  name?: string;
  content?: string;
  description?: string;
  descriptionPlain?: string;
  location?: { name?: string; city?: string } | string;
  offices?: Array<{ name?: string }>;
  categories?: { location?: string };
  absolute_url?: string;
  hostedUrl?: string;
  applyUrl?: string;
  url?: string;
  ref?: string;
  updated_at?: string;
  created_at?: string;
  createdAt?: number | string;
  releasedDate?: string;
}

type ATSResponseFields = {
  jobs?: ATSJob[];
  content?: ATSJob[];
  postings?: ATSJob[];
  results?: ATSJob[];
  data?: ATSJob[];
};

export type ATSResponse = ATSJob[] | (ATSResponseFields & Record<string, unknown>);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAtsJob = (value: unknown): value is ATSJob => isRecord(value);

export const isAtsResponse = (value: unknown): value is ATSResponse =>
  (Array.isArray(value) && value.every(isAtsJob)) || isRecord(value);

export const resolveLocation = (location: ATSJob["location"]): string => {
  if (typeof location === "string") {
    return location;
  }
  return location?.name ?? location?.city ?? "";
};

export const toISODate = (value?: string | number): string => {
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
};

const sanitizeHashFragment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

export const resolveHashFragment = (job: ATSJob): string => {
  const candidate =
    job.id ??
    job.url ??
    job.absolute_url ??
    job.hostedUrl ??
    job.applyUrl ??
    job.ref ??
    job.title ??
    job.name ??
    job.text ??
    generateId();

  return sanitizeHashFragment(String(candidate)) || generateId();
};

export const resolveJobs = (
  data: ATSResponse,
  keys: ReadonlyArray<keyof ATSResponseFields>,
): ATSJob[] => {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    const candidate = data[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

export const resolveBoardUrl = (
  providerType: CompanyBoardATSType,
  token: string,
  settings: JobProviderSettings,
): string => settings.companyBoardApiTemplates[providerType].replaceAll("{token}", token);
