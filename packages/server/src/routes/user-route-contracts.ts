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
import type { Static } from "typebox";

const experienceLevelSchema = t.Union([
  t.Literal("entry"),
  t.Literal("junior"),
  t.Literal("mid"),
  t.Literal("senior"),
  t.Literal("lead"),
  t.Literal("principal"),
  t.Literal("director"),
]);

const shippedTitleSchema = t.Object({
  name: t.String(),
  platforms: t.Array(t.String()),
  releaseDate: t.Optional(t.String()),
  role: t.String(),
  teamSize: t.Optional(t.Number()),
});

const gamingExperienceSchema = t.Object({
  yearsInGaming: t.Optional(t.Number()),
  experienceLevel: t.Optional(experienceLevelSchema),
  specializations: t.Optional(t.Array(t.String())),
  gameEngines: t.Optional(t.Array(t.String())),
  platforms: t.Optional(t.Array(t.String())),
  genres: t.Optional(t.Array(t.String())),
  shippedTitles: t.Optional(t.Array(shippedTitleSchema)),
});

const careerGoalsSchema = t.Object({
  desiredRoles: t.Optional(t.Array(t.String())),
  preferredCompanySize: t.Optional(t.Array(t.String())),
  preferredLocations: t.Optional(t.Array(t.String())),
  remotePreference: t.Optional(
    t.Union([t.Literal("onsite"), t.Literal("hybrid"), t.Literal("remote"), t.Literal("flexible")]),
  ),
  salaryRange: t.Optional(
    t.Object({
      min: t.Number(),
      max: t.Number(),
      currency: t.Optional(t.String()),
    }),
  ),
  willingToRelocate: t.Optional(t.Boolean()),
});

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
  gamingExperience: t.Optional(gamingExperienceSchema),
  careerGoals: t.Optional(careerGoalsSchema),
});

export type UserProfileUpdateRouteBody = Static<typeof userProfileUpdateBodySchema>;

export const userProfileResponseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.Union([t.String(), t.Null()]),
  phone: t.Union([t.String(), t.Null()]),
  location: t.Union([t.String(), t.Null()]),
  website: t.Union([t.String(), t.Null()]),
  linkedin: t.Union([t.String(), t.Null()]),
  github: t.Union([t.String(), t.Null()]),
  summary: t.Union([t.String(), t.Null()]),
  currentRole: t.Union([t.String(), t.Null()]),
  currentCompany: t.Union([t.String(), t.Null()]),
  yearsExperience: t.Union([t.Number(), t.Null()]),
  technicalSkills: t.Array(t.String()),
  softSkills: t.Array(t.String()),
  gamingExperience: gamingExperienceSchema,
  careerGoals: careerGoalsSchema,
  createdAt: t.String(),
  updatedAt: t.String(),
});
