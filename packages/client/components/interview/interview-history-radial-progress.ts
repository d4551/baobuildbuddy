export type InterviewHistoryRadialProgressSizeToken = "compact" | "detail";

export const INTERVIEW_HISTORY_RADIAL_PROGRESS_SIZE_BY_TOKEN: Record<
  InterviewHistoryRadialProgressSizeToken,
  string
> = {
  compact: "2.5rem",
  detail: "3rem",
};

export const INTERVIEW_HISTORY_RADIAL_PROGRESS_THICKNESS = "0.18rem";

export const createInterviewHistoryRadialProgressStyle = (
  value: number,
  sizeToken: InterviewHistoryRadialProgressSizeToken,
): Record<string, string> => ({
  "--value": String(value),
  "--size": INTERVIEW_HISTORY_RADIAL_PROGRESS_SIZE_BY_TOKEN[sizeToken],
  "--thickness": INTERVIEW_HISTORY_RADIAL_PROGRESS_THICKNESS,
});
