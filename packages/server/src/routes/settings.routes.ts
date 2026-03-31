import { API_ERROR_INIT_SETTINGS_ROW, API_ERROR_INVALID_AUTOMATION_PAYLOAD, API_ERROR_LOAD_SETTINGS } from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_UNPROCESSABLE_ENTITY } from "@bao/shared/constants/http";
import { DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { StandardSchemaV1 } from "baobox";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import {
  RATE_LIMIT_SETTINGS_DURATION_MS,
  RATE_LIMIT_SETTINGS_MAX_REQUESTS,
} from "../config/rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  apiKeysUpdateBodySchema,
  importSettingsBodySchema,
  jobTaxonomyUpdateBodySchema,
  providerTestBodySchema,
  settingsUpdateBodySchema,
} from "./settings-route-contracts";
import { buildSettingsResponse, testProviderConnection } from "./settings-route-provider-support";
import { updateJobTaxonomy } from "../services/jobs/job-taxonomy-service";
import { buildApiKeysUpdate, buildSettingsUpdate } from "./settings-route-update-support";
import { readOrCreateSettingsRow } from "./settings-route-support";

export const settingsRoutes = new Elysia({ prefix: "/settings", tags: ["Settings"] })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: RATE_LIMIT_SETTINGS_DURATION_MS,
      max: RATE_LIMIT_SETTINGS_MAX_REQUESTS,
      generator: (request) => resolveRateLimitClientKey(request),
    }),
  )
  .get("/", async () => {
    const row = await readOrCreateSettingsRow();
    if (!row) {
      return { error: API_ERROR_LOAD_SETTINGS };
    }

    return buildSettingsResponse(row);
  })
  .put(
    "/",
    async ({ body, set }) => {
      const existingRow = await readOrCreateSettingsRow();
      if (!existingRow) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return { success: false, error: API_ERROR_INIT_SETTINGS_ROW };
      }

      const update = buildSettingsUpdate(existingRow, body);
      if (!update) {
        set.status = HTTP_STATUS_UNPROCESSABLE_ENTITY;
        return {
          success: false,
          error: API_ERROR_INVALID_AUTOMATION_PAYLOAD,
        };
      }

      await db
        .update(settings)
        .set({ ...update, updatedAt: new Date().toISOString() })
        .where(eq(settings.id, DEFAULT_SETTINGS_ID));

      return { success: true };
    },
    {
      body: StandardSchemaV1(settingsUpdateBodySchema),
    },
  )
  .put(
    "/job-taxonomy",
    async ({ body }) => {
      const jobTaxonomy = await updateJobTaxonomy(body);
      return { success: true, jobTaxonomy };
    },
    {
      body: StandardSchemaV1(jobTaxonomyUpdateBodySchema),
    },
  )
  .put(
    "/api-keys",
    async ({ body }) => {
      await readOrCreateSettingsRow();
      await db
        .update(settings)
        .set(buildApiKeysUpdate(body))
        .where(eq(settings.id, DEFAULT_SETTINGS_ID));

      return { success: true };
    },
    {
      body: StandardSchemaV1(apiKeysUpdateBodySchema),
    },
  )
  .post("/test-api-key", async ({ body }) => testProviderConnection(body), {
    body: StandardSchemaV1(providerTestBodySchema),
  })
  .get("/export", async () => {
    const { dataService } = await import("../services/data-service");
    return dataService.exportAll();
  })
  .post(
    "/import",
    async ({ body }) => {
      const { dataService } = await import("../services/data-service");
      return dataService.importAll({
        version: body.version,
        exportedAt: body.exportedAt,
        profile: body.profile,
        settings: body.settings,
        resumes: body.resumes,
        coverLetters: body.coverLetters,
        portfolio: body.portfolio,
        portfolioProjects: body.portfolioProjects,
        interviewSessions: body.interviewSessions,
        gamification: body.gamification,
        skillMappings: body.skillMappings,
        savedJobs: body.savedJobs,
        applications: body.applications,
        chatHistory: body.chatHistory,
      });
    },
    {
      body: StandardSchemaV1(importSettingsBodySchema),
    },
  );
