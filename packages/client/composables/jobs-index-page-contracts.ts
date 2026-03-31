import { JOB_EXPERIENCE_LEVELS, JOB_FILTER_ALL_VALUE, JOB_GAME_GENRES, JOB_STUDIO_TYPES, JOB_SUPPORTED_PLATFORMS } from "@bao/shared/constants/jobs";
import type { GameGenre, JobExperienceLevel, Platform, StudioType } from "@bao/shared/types/jobs";

export type FilterSelection<T extends string> = T | typeof JOB_FILTER_ALL_VALUE;
export type JobsTranslate = (key: string, params?: Record<string, unknown>) => string;

export interface JobsFilterState {
  location: string;
  remote: boolean;
  experienceLevel: FilterSelection<JobExperienceLevel>;
  studioType: FilterSelection<StudioType>;
  platform: FilterSelection<Platform>;
  genre: FilterSelection<GameGenre>;
}

export function createJobsFilterState() {
  return reactive<JobsFilterState>({
    location: "",
    remote: false,
    experienceLevel: JOB_FILTER_ALL_VALUE,
    studioType: JOB_FILTER_ALL_VALUE,
    platform: JOB_FILTER_ALL_VALUE,
    genre: JOB_FILTER_ALL_VALUE,
  });
}

export function createJobsFilterOptions() {
  return {
    experienceOptions: JOB_EXPERIENCE_LEVELS,
    studioTypeOptions: JOB_STUDIO_TYPES,
    platformOptions: JOB_SUPPORTED_PLATFORMS,
    genreOptions: JOB_GAME_GENRES,
  };
}
