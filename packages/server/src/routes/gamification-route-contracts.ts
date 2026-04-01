import {
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import { StandardSchemaV1 } from "baobox";
import Type, { type StaticParse } from "baobox";

export type RouteSetState = {
  status?: number | string;
};

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
