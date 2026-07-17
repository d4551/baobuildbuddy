import type { Static } from "typebox";
import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import { t } from "elysia";

export const awardXpBodySchema = t.Object({
  amount: t.Number({ minimum: 0, maximum: 10000 }),
  reason: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
});

export type AwardXpBody = Static<typeof awardXpBodySchema>;

export const challengeIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);

export type ChallengeIdParams = Static<typeof challengeIdParamsSchema>;

export const awardXpBody = awardXpBodySchema;
export const challengeIdParams = challengeIdParamsSchema;
