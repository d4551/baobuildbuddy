import type { Static } from "typebox";
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
import { t } from "elysia";

export const userProfileUpdateBodySchema = t.Object({
  name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  email: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  phone: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
  location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  website: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  linkedin: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  github: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  summary: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  currentRole: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  currentCompany: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  yearsExperience: t.Optional(t.Number({ minimum: 0, maximum: 80 })),
  technicalSkills: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  softSkills: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  gamingExperience: t.Optional(t.Record(t.String(), t.Unknown())),
  careerGoals: t.Optional(t.Record(t.String(), t.Unknown())),
});

export type UserProfileUpdateRouteBody = Static<typeof userProfileUpdateBodySchema>;
