import { INTERVIEW_DEFAULT_ROLE_TYPE } from "@bao/shared/constants/interview";
import type { Ref } from "vue";
import {
  normalizeRoleCandidate,
  type InterviewJobView,
} from "~/composables/interview-hub-bootstrap";

type InterviewHubRoleOptionsInput = {
  jobs: Ref<readonly InterviewJobView[]>;
  pathways: Ref<readonly { readonly title: string; readonly matchScore: number }[]>;
  profile: Ref<{ readonly currentRole?: string | null } | null>;
  readiness: Ref<{
    readonly targetRoleReadiness?: readonly {
      readonly roleTitle: string;
      readonly readinessScore: number;
    }[];
  } | null>;
};

export function useInterviewRoleOptions({
  jobs,
  pathways,
  profile,
  readiness,
}: InterviewHubRoleOptionsInput) {
  const pathwayRoleTitles = computed<readonly string[]>(() =>
    [...pathways.value]
      .sort((left, right) => right.matchScore - left.matchScore)
      .map((pathway) => pathway.title),
  );
  const readinessRoleTitles = computed<readonly string[]>(() =>
    [...(readiness.value?.targetRoleReadiness ?? [])]
      .sort((left, right) => right.readinessScore - left.readinessScore)
      .map((entry) => entry.roleTitle),
  );

  return computed<readonly string[]>(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();

    const addRole = (value: string | null | undefined): void => {
      if (!value) {
        return;
      }
      const normalized = normalizeRoleCandidate(value);
      if (normalized.length === 0) {
        return;
      }
      const dedupeKey = normalized.toLowerCase();
      if (seen.has(dedupeKey)) {
        return;
      }
      seen.add(dedupeKey);
      ordered.push(normalized);
    };

    addRole(profile.value?.currentRole ?? null);
    for (const roleTitle of readinessRoleTitles.value) addRole(roleTitle);
    for (const roleTitle of pathwayRoleTitles.value) addRole(roleTitle);
    for (const job of jobs.value) addRole(job.title);
    addRole(INTERVIEW_DEFAULT_ROLE_TYPE);

    return ordered;
  });
}
