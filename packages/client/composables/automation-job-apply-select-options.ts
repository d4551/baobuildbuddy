import { asJsonArray, isRecord } from "@bao/shared/utils/type-guards";
import type { CoverLetterSelectOption, ResumeSelectOption } from "~/types/automation-job-apply";

export interface JobApplyRequestBody {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
}

export const toResumeSelectOptions = <T>(value: T): ResumeSelectOption[] => {
  const entries = asJsonArray(value);
  if (!entries) {
    return [];
  }
  const options: ResumeSelectOption[] = [];
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.id !== "string") {
      continue;
    }
    options.push({
      id: entry.id,
      ...(typeof entry.name === "string" ? { name: entry.name } : {}),
    });
  }
  return options;
};

export const toCoverLetterSelectOptions = <T>(value: T): CoverLetterSelectOption[] => {
  const entries = asJsonArray(value);
  if (!entries) {
    return [];
  }
  const options: CoverLetterSelectOption[] = [];
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.id !== "string") {
      continue;
    }
    options.push({
      id: entry.id,
      ...(typeof entry.company === "string" ? { company: entry.company } : {}),
      ...(typeof entry.position === "string" ? { position: entry.position } : {}),
    });
  }
  return options;
};

export function buildJobApplyBody(input: {
  jobUrl: { value: string };
  resumeId: { value: string };
  coverLetterId: { value: string };
  jobId: { value: string };
}): JobApplyRequestBody {
  const coverLetterId = input.coverLetterId.value.trim();
  const jobId = input.jobId.value.trim();

  return {
    jobUrl: input.jobUrl.value.trim(),
    resumeId: input.resumeId.value,
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(jobId ? { jobId } : {}),
  };
}
