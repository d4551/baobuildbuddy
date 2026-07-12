import { SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_SHORT } from "@bao/shared/constants/schema-limits";
import Type, { StandardSchemaV1, type StaticParse } from "baobox";

export const awardXpBodySchema = Type.Object({
  amount: Type.Number({ minimum: 0, maximum: 10000 }),
  reason: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
});

export type AwardXpBody = StaticParse<typeof awardXpBodySchema>;

export const challengeIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);

export type ChallengeIdParams = StaticParse<typeof challengeIdParamsSchema>;

export const awardXpBody = StandardSchemaV1(awardXpBodySchema);
export const challengeIdParams = StandardSchemaV1(challengeIdParamsSchema);
