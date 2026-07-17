import { t, Elysia } from "elysia";
import {
  API_ERROR_INIT_SETTINGS_ROW,
  API_ERROR_INVALID_AUTOMATION_PAYLOAD,
  API_ERROR_LOAD_SETTINGS,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import {
  RATE_LIMIT_SETTINGS_DURATION_MS,
  RATE_LIMIT_SETTINGS_READ_MAX_REQUESTS,
  RATE_LIMIT_SETTINGS_WRITE_MAX_REQUESTS,
} from "../config/rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { updateJobTaxonomy } from "../services/jobs/job-taxonomy-service";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  type ApiKeysUpdateBody,
  apiKeysUpdateBodySchema,
  type ImportSettingsBody,
  importSettingsBodySchema,
  type JobTaxonomyUpdateBody,
  jobTaxonomyUpdateBodySchema,
  type ProviderTestBody,
  providerTestBodySchema,
  type SettingsUpdateBody,
  settingsUpdateBodySchema,
} from "./settings-route-contracts";
import { buildSettingsResponse, testProviderConnection } from "./settings-route-provider-support";
import { readOrCreateSettingsRow } from "./settings-route-support";
import { buildApiKeysUpdate, buildSettingsUpdate } from "./settings-route-update-support";

export const settingsRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.settings),
})
  .use(
    new Elysia()
      .use(
        rateLimit({
          scoping: "scoped",
          duration: RATE_LIMIT_SETTINGS_DURATION_MS,
          max: RATE_LIMIT_SETTINGS_READ_MAX_REQUESTS,
          generator: (request) => resolveRateLimitClientKey(request),
        }),
      )
      .get("/",{ detail: { tags: ["Settings"] } }, async () => {
        const row = await readOrCreateSettingsRow();
        if (!row) {
          return { error: API_ERROR_LOAD_SETTINGS };
        }

        return buildSettingsResponse(row);
      }),
  )
  .use(
    new Elysia()
      .use(
        rateLimit({
          scoping: "scoped",
          duration: RATE_LIMIT_SETTINGS_DURATION_MS,
          max: RATE_LIMIT_SETTINGS_WRITE_MAX_REQUESTS,
          generator: (request) => resolveRateLimitClientKey(request),
        }),
      )
      .put(
        "/",
        { detail: { tags: ["Settings"] }, body: settingsUpdateBodySchema,
        }, async ({ body, set }: { body: SettingsUpdateBody; set: { status?: number | string } }) => {
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
      )
      .put(
        "/job-taxonomy",
        { detail: { tags: ["Settings"] }, body: jobTaxonomyUpdateBodySchema,
        }, async ({ body }: { body: JobTaxonomyUpdateBody }) => {
          const jobTaxonomy = await updateJobTaxonomy(body);
          return { success: true, jobTaxonomy };
        },
      )
      .put(
        "/api-keys",
        { detail: { tags: ["Settings"] }, body: apiKeysUpdateBodySchema,
        }, async ({ body }: { body: ApiKeysUpdateBody }) => {
          await readOrCreateSettingsRow();
          await db
            .update(settings)
            .set(buildApiKeysUpdate(body))
            .where(eq(settings.id, DEFAULT_SETTINGS_ID));

          return { success: true };
        },
      )
      .post(
        "/test-api-key",
        { detail: { tags: ["Settings"] }, body: providerTestBodySchema,
        }, async ({ body }: { body: ProviderTestBody }) => testProviderConnection(body),
      )
      .get("/export",{ detail: { tags: ["Settings"] } }, async () => {
        const { dataService } = await import("../services/data-service");
        return dataService.exportAll();
      })
      .post(
        "/import",
        { detail: { tags: ["Settings"] }, body: importSettingsBodySchema,
        }, async ({ body }: { body: ImportSettingsBody }) => {
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
      ),
  );
