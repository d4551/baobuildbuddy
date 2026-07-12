import { API_ERROR_CHALLENGE_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_CHALLENGE_COMPLETED } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
import { gamificationService } from "../services/gamification-service";
import type { RouteSetState } from "../types/route-state";
import {
  type AwardXpBody,
  awardXpBody,
  type ChallengeIdParams,
  challengeIdParams,
} from "./gamification-route-contracts";

export const gamificationRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.gamificationBase),
  tags: ["Gamification"],
})
  .get("/progress", async () => {
    return gamificationService.getProgress();
  })
  .post(
    "/award-xp",
    async ({ body, set }: { body: AwardXpBody; set: RouteSetState }) => {
      if (!(typeof body.amount === "number" && typeof body.reason === "string")) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return { error: "amount and reason are required." };
      }

      const levelUp = await gamificationService.awardXP(body.amount, body.reason);
      const progress = await gamificationService.getProgress();

      return {
        xp: progress.xp,
        level: progress.level,
        leveledUp: levelUp !== null,
        levelUp,
        reason: body.reason,
        message: levelUp
          ? `Level up! You're now level ${levelUp.newLevel} — ${levelUp.newTitle}`
          : `+${body.amount} XP earned`,
      };
    },
    {
      body: awardXpBody,
    },
  )
  .get("/achievements", async () => {
    return gamificationService.getAchievements();
  })
  .get("/challenges", async () => {
    const challenges = await gamificationService.getDailyChallenges();
    const today = new Date().toISOString().split("T")[0];
    const completedCount = challenges.filter((c) => c.completed).length;

    return {
      date: today,
      challenges,
      completedCount,
      totalCount: challenges.length,
    };
  })
  .post(
    "/challenges/:id/complete",
    async ({ params, set }: { params: ChallengeIdParams; set: RouteSetState }) => {
      if (!params.id) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return { message: API_ERROR_CHALLENGE_NOT_FOUND, completed: false };
      }

      const completed = await gamificationService.completeChallenge(params.id);

      if (!completed) {
        return { message: API_ERROR_CHALLENGE_NOT_FOUND, completed: false };
      }

      const progress = await gamificationService.getProgress();

      set.status = HTTP_STATUS_CREATED;
      return {
        message: API_MESSAGE_CHALLENGE_COMPLETED,
        challengeId: params.id,
        completed: true,
        totalXP: progress.xp,
        level: progress.level,
      };
    },
    {
      params: challengeIdParams,
    },
  )
  .get("/weekly", async () => {
    return gamificationService.getWeeklyProgress();
  })
  .get("/monthly", async () => {
    return gamificationService.getMonthlyStats();
  });
