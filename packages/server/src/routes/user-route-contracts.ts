import {
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_PHONE,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import Type, { type StaticParse } from "baobox";

export const userProfileUpdateBodySchema = Type.Object({
  name: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  email: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  phone: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
  location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  website: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  linkedin: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  github: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  summary: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  currentRole: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  currentCompany: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  yearsExperience: Type.Optional(Type.Number({ minimum: 0, maximum: 80 })),
  technicalSkills: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  softSkills: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  gamingExperience: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  careerGoals: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

export type UserProfileUpdateRouteBody = StaticParse<typeof userProfileUpdateBodySchema>;
