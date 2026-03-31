import { expect, it } from "vitest";
import {
  INTERVIEW_HISTORY_RADIAL_PROGRESS_SIZE_BY_TOKEN,
  INTERVIEW_HISTORY_RADIAL_PROGRESS_THICKNESS,
  createInterviewHistoryRadialProgressStyle,
} from "./interview-history-radial-progress";

it("builds shared radial progress styles from the canonical tokens", () => {
  expect(createInterviewHistoryRadialProgressStyle(87, "compact")).toEqual({
    "--value": "87",
    "--size": INTERVIEW_HISTORY_RADIAL_PROGRESS_SIZE_BY_TOKEN.compact,
    "--thickness": INTERVIEW_HISTORY_RADIAL_PROGRESS_THICKNESS,
  });
});

it("uses the detail radial progress size token for the session panel", () => {
  expect(createInterviewHistoryRadialProgressStyle(94, "detail")).toEqual({
    "--value": "94",
    "--size": INTERVIEW_HISTORY_RADIAL_PROGRESS_SIZE_BY_TOKEN.detail,
    "--thickness": INTERVIEW_HISTORY_RADIAL_PROGRESS_THICKNESS,
  });
});
