import { Elysia, t } from "elysia";
import { gamificationService } from "../services/gamification-service";

export const gamificationRoutes = new Elysia({ prefix: "/gamification" })
  .get("/progress", async () => {
    return gamificationService.getProgress();
  })
  .post(
    "/award-xp",
    async ({ body }) => {
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
      body: t.Object({
        amount: t.Number({ minimum: 0, maximum: 10000 }),
        reason: t.String({ maxLength: 200 }),
      }),
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
    async ({ params, set }) => {
      const completed = await gamificationService.completeChallenge(params.id);

      if (!completed) {
        return { message: "Challenge already completed or not found", completed: false };
      }

      const progress = await gamificationService.getProgress();

      set.status = 201;
      return {
        message: "Challenge completed!",
        challengeId: params.id,
        completed: true,
        totalXP: progress.xp,
        level: progress.level,
      };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .get("/weekly", async () => {
    return gamificationService.getWeeklyProgress();
  })
  .get("/monthly", async () => {
    return gamificationService.getMonthlyStats();
  });
