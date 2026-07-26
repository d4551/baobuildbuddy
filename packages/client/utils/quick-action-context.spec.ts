import { AI_CHAT_ROUTE_QUERY_KEYS } from "@bao/shared/constants/ai-chat";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { describe, expect, it } from "vitest";
import { resolveQuickActionSourceEntity, resolveQuickActionTarget } from "./quick-action-context";

const STUDIO_KEY = AI_CHAT_ROUTE_QUERY_KEYS.studioId;
const JOB_KEY = AI_CHAT_ROUTE_QUERY_KEYS.jobId;
const RESUME_KEY = AI_CHAT_ROUTE_QUERY_KEYS.resumeId;

describe("resolveQuickActionSourceEntity", () => {
  it("reads the studio id from a studio detail path", () => {
    expect(resolveQuickActionSourceEntity(`${APP_ROUTES.studios}/riot-games`, {})).toEqual({
      studioId: "riot-games",
      jobId: null,
      resumeId: null,
    });
  });

  it("does not treat the studio index or analytics page as a studio entity", () => {
    expect(resolveQuickActionSourceEntity(APP_ROUTES.studios, {}).studioId).toBe(null);
    expect(resolveQuickActionSourceEntity(APP_ROUTES.studiosAnalytics, {}).studioId).toBe(null);
  });

  it("reads the job id from a job detail path", () => {
    expect(resolveQuickActionSourceEntity(`${APP_ROUTES.jobs}/job-42`, {}).jobId).toBe("job-42");
  });

  it("falls back to route query when the path carries no entity", () => {
    expect(
      resolveQuickActionSourceEntity(APP_ROUTES.dashboard, {
        [STUDIO_KEY]: "valve",
        [JOB_KEY]: "job-7",
        [RESUME_KEY]: "resume-3",
      }),
    ).toEqual({ studioId: "valve", jobId: "job-7", resumeId: "resume-3" });
  });

  it("ignores blank query values", () => {
    expect(resolveQuickActionSourceEntity(APP_ROUTES.dashboard, { [STUDIO_KEY]: "   " })).toEqual({
      studioId: null,
      jobId: null,
      resumeId: null,
    });
  });
});

describe("resolveQuickActionTarget", () => {
  it("carries the studio into AI chat so the assistant has page context", () => {
    expect(
      resolveQuickActionTarget(APP_ROUTES.aiChat, `${APP_ROUTES.studios}/riot-games`, {}),
    ).toEqual({ path: APP_ROUTES.aiChat, query: { [STUDIO_KEY]: "riot-games" } });
  });

  it("carries the job into the interview hub, which bootstraps from it", () => {
    expect(resolveQuickActionTarget(APP_ROUTES.interview, `${APP_ROUTES.jobs}/job-42`, {})).toEqual(
      {
        path: APP_ROUTES.interview,
        query: { [JOB_KEY]: "job-42" },
      },
    );
  });

  it("forwards only the entities a destination can act on", () => {
    const fromChatWithEverything = {
      [STUDIO_KEY]: "valve",
      [JOB_KEY]: "job-7",
      [RESUME_KEY]: "resume-3",
    };
    // The interview hub reads studio + job, but never a resume id.
    expect(
      resolveQuickActionTarget(APP_ROUTES.interview, APP_ROUTES.dashboard, fromChatWithEverything)
        .query,
    ).toEqual({ [STUDIO_KEY]: "valve", [JOB_KEY]: "job-7" });
    expect(
      resolveQuickActionTarget(APP_ROUTES.aiChat, APP_ROUTES.dashboard, fromChatWithEverything)
        .query,
    ).toEqual(fromChatWithEverything);
  });

  it("carries the studio into cover letter generation", () => {
    expect(
      resolveQuickActionTarget(APP_ROUTES.coverLetter, `${APP_ROUTES.studios}/riot-games`, {}),
    ).toEqual({ path: APP_ROUTES.coverLetter, query: { [STUDIO_KEY]: "riot-games" } });
  });

  it("does not forward to destinations that ignore the query", () => {
    // Resume and portfolio do not read these keys off the route yet.
    for (const destination of [APP_ROUTES.resume, APP_ROUTES.portfolio]) {
      expect(resolveQuickActionTarget(destination, `${APP_ROUTES.studios}/riot-games`, {})).toEqual(
        { path: destination, query: {} },
      );
    }
  });

  it("emits no query when navigating to the page already open", () => {
    expect(
      resolveQuickActionTarget(APP_ROUTES.aiChat, APP_ROUTES.aiChat, { [STUDIO_KEY]: "valve" }),
    ).toEqual({ path: APP_ROUTES.aiChat, query: {} });
  });

  it("emits no query for destinations that take no entity context", () => {
    expect(
      resolveQuickActionTarget(APP_ROUTES.gamification, `${APP_ROUTES.studios}/riot-games`, {}),
    ).toEqual({ path: APP_ROUTES.gamification, query: {} });
  });

  it("emits no query when the source page has no entity", () => {
    expect(resolveQuickActionTarget(APP_ROUTES.aiChat, APP_ROUTES.dashboard, {}).query).toEqual({});
  });
});
