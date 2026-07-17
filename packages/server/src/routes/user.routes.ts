import { API_ERROR_USER_PROFILE_NOT_FOUND } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_NOT_FOUND, HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import Type, { StandardSchemaV1 } from "baobox";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db/client";
import { userProfile } from "../db/schema/user";
import { simpleRouteErrorResponses } from "./route-error-envelope";
import {
  type UserProfileUpdateRouteBody,
  userProfileUpdateBodySchema,
} from "./user-route-contracts";

const userProfileResponseSchema = StandardSchemaV1(
  Type.Object({
    id: Type.String(),
    name: Type.String(),
    email: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    website: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    linkedin: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    github: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    summary: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    currentRole: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    currentCompany: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    yearsExperience: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    technicalSkills: Type.Optional(Type.Array(Type.String())),
    softSkills: Type.Optional(Type.Array(Type.String())),
    gamingExperience: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    careerGoals: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    createdAt: Type.Optional(Type.String()),
    updatedAt: Type.Optional(Type.String()),
  }),
);

export const userRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.userBase),
  tags: ["User"],
})
  .get(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    {
      response: {
        [HTTP_STATUS_OK]: userProfileResponseSchema,
        ...simpleRouteErrorResponses,
      },
    },
    async ({ set }) => {
      const rows = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      if (rows.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_USER_PROFILE_NOT_FOUND };
      }
      return rows[0];
    },
  )
  .put(
    toApiChildPath(API_ENDPOINTS.userBase, API_ENDPOINTS.userProfile),
    {
      body: StandardSchemaV1(userProfileUpdateBodySchema),
      response: {
        [HTTP_STATUS_OK]: userProfileResponseSchema,
        ...simpleRouteErrorResponses,
      },
    },
    async ({ body }: { body: UserProfileUpdateRouteBody }) => {
      const existing = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      if (existing.length === 0) {
        await db.insert(userProfile).values({ id: DEFAULT_PROFILE_ID, ...body });
      } else {
        await db
          .update(userProfile)
          .set({ ...body, updatedAt: new Date().toISOString() })
          .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      }
      const updated = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      return updated[0];
    },
  );
