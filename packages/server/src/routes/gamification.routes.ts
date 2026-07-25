import {
  API_ERROR_CHALLENGE_NOT_FOUND,
  API_ERROR_XP_AMOUNT_REASON_REQUIRED,
} from "@bao/shared/constants/api-errors";
import { API_MESSAGE_CHALLENGE_COMPLETED } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { Elysia } from "elysia";
import { gamificationService } from "../services/gamification-service";
import { openapiDetail } from "../utils/openapi-detail";
import {
  achievementsResponses,
  awardXpBody,
  awardXpResponses,
  challengeCompleteResponses,
  challengeIdParams,
  challengesListResponses,
  gamificationProgressResponses,
  monthlyStatsResponses,
  weeklyProgressResponses,
} from "./gamification-route-contracts";

export const gamificationRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.gamificationBase),
})
  .get(
    "/progress",
    {
      detail: openapiDetail(
        "Gamification",
        "Retrieve XP, level, and streak progress for the user.",
      ),
      response: gamificationProgressResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await gamificationService.getProgress()),
  )
  .post(
    "/award-xp",
    {
      detail: openapiDetail(
        "Gamification",
        "Award XP for a completed career action event.",
      ),
      body: awardXpBody,
      response: awardXpResponses,
    },
    async ({ body, status }) => {
      if (!(typeof body.amount === "number" && typeof body.reason === "string")) {
        return status(HTTP_STATUS_BAD_REQUEST, { error: API_ERROR_XP_AMOUNT_REASON_REQUIRED });
      }

      const levelUp = await gamificationService.awardXP(body.amount, body.reason);
      const progress = await gamificationService.getProgress();

      return status(HTTP_STATUS_OK, {
        xp: progress.xp,
        level: progress.level,
        leveledUp: levelUp !== null,
        levelUp,
        reason: body.reason,
        message: levelUp
          ? `+${body.amount} XP earned — level up! You're now level ${levelUp.newLevel} (${levelUp.newTitle})`
          : `+${body.amount} XP earned`,
      });
    },
  )
  .get(
    "/achievements",
    {
      detail: openapiDetail(
        "Gamification",
        "List unlocked and locked gamification achievements.",
      ),
      response: achievementsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await gamificationService.getAchievements()),
  )
  .get(
    "/challenges",
    {
      detail: openapiDetail(
        "Gamification",
        "List active gamification challenges and completion state.",
      ),
      response: challengesListResponses,
    },
    async ({ status }) => {
      const challenges = await gamificationService.getDailyChallenges();
      const today = new Date().toISOString().split("T")[0];
      const completedCount = challenges.filter((challenge) => challenge.completed).length;

      return status(HTTP_STATUS_OK, {
        date: today,
        challenges,
        completedCount,
        totalCount: challenges.length,
      });
    },
  )
  .post(
    "/challenges/:id/complete",
    {
      detail: openapiDetail(
        "Gamification",
        "Mark a gamification challenge complete and grant rewards.",
      ),
      params: challengeIdParams,
      response: challengeCompleteResponses,
    },
    async ({ params, status }) => {
      if (!params.id) {
        return status(HTTP_STATUS_BAD_REQUEST, { error: API_ERROR_CHALLENGE_NOT_FOUND });
      }

      const completed = await gamificationService.completeChallenge(params.id);

      if (!completed) {
        return status(HTTP_STATUS_OK, { message: API_ERROR_CHALLENGE_NOT_FOUND, completed: false });
      }

      const progress = await gamificationService.getProgress();

      return status(HTTP_STATUS_CREATED, {
        message: API_MESSAGE_CHALLENGE_COMPLETED,
        challengeId: params.id,
        completed: true,
        totalXP: progress.xp,
        level: progress.level,
      });
    },
  )
  .get(
    "/weekly",
    {
      detail: openapiDetail(
        "Gamification",
        "Retrieve weekly gamification activity and XP totals.",
      ),
      response: weeklyProgressResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await gamificationService.getWeeklyProgress()),
  )
  .get(
    "/monthly",
    {
      detail: openapiDetail(
        "Gamification",
        "Retrieve monthly gamification activity and XP totals.",
      ),
      response: monthlyStatsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await gamificationService.getMonthlyStats()),
  );
