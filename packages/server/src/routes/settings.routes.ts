import {
  API_ERROR_INIT_SETTINGS_ROW,
  API_ERROR_INVALID_AUTOMATION_PAYLOAD,
  API_ERROR_LOAD_SETTINGS,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia, type status } from "elysia";
import {
  RATE_LIMIT_SETTINGS_DURATION_MS,
  RATE_LIMIT_SETTINGS_READ_MAX_REQUESTS,
  RATE_LIMIT_SETTINGS_WRITE_MAX_REQUESTS,
} from "../config/rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { updateJobTaxonomy } from "../services/jobs/job-taxonomy-service";
import { openapiDetail } from "../utils/openapi-detail";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  type ApiKeysUpdateBody,
  apiKeysUpdateBodySchema,
  apiKeysUpdateResponses,
  type ImportSettingsBody,
  importSettingsBodySchema,
  type JobTaxonomyUpdateBody,
  jobTaxonomyUpdateBodySchema,
  jobTaxonomyUpdateResponses,
  type ProviderTestBody,
  providerTestBodySchema,
  providerTestResponses,
  type SettingsUpdateBody,
  settingsExportResponses,
  settingsImportResponses,
  settingsReadResponses,
  settingsUpdateBodySchema,
  settingsUpdateResponses,
} from "./settings-route-contracts";
import { buildSettingsResponse, testProviderConnection } from "./settings-route-provider-support";
import { readOrCreateSettingsRow } from "./settings-route-support";
import { buildApiKeysUpdate, buildSettingsUpdate } from "./settings-route-update-support";

type RouteStatus = typeof status;

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
      .get(
        "/",
        {
          detail: openapiDetail(
            "Settings",
            "Retrieve application settings including AI and automation prefs.",
          ),
          response: settingsReadResponses,
        },
        async ({ status }: { status: RouteStatus }) => {
          const row = await readOrCreateSettingsRow();
          if (!row) {
            return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, { error: API_ERROR_LOAD_SETTINGS });
          }

          return status(HTTP_STATUS_OK, await buildSettingsResponse(row));
        },
      ),
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
        {
          detail: openapiDetail(
            "Settings",
            "Replace application settings for AI, speech, and automation.",
          ),
          body: settingsUpdateBodySchema,
          response: settingsUpdateResponses,
        },
        async ({ body, status }: { body: SettingsUpdateBody; status: RouteStatus }) => {
          const existingRow = await readOrCreateSettingsRow();
          if (!existingRow) {
            return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
              error: API_ERROR_INIT_SETTINGS_ROW,
            });
          }

          const update = buildSettingsUpdate(existingRow, body);
          if (!update) {
            return status(HTTP_STATUS_UNPROCESSABLE_ENTITY, {
              error: API_ERROR_INVALID_AUTOMATION_PAYLOAD,
            });
          }

          await db
            .update(settings)
            .set({ ...update, updatedAt: new Date().toISOString() })
            .where(eq(settings.id, DEFAULT_SETTINGS_ID));

          return status(HTTP_STATUS_OK, { success: true });
        },
      )
      .put(
        "/job-taxonomy",
        {
          detail: openapiDetail(
            "Settings",
            "Replace the job taxonomy used for filtering and matching.",
          ),
          body: jobTaxonomyUpdateBodySchema,
          response: jobTaxonomyUpdateResponses,
        },
        async ({ body, status }: { body: JobTaxonomyUpdateBody; status: RouteStatus }) => {
          const jobTaxonomy = await updateJobTaxonomy(body);
          return status(HTTP_STATUS_OK, { success: true, jobTaxonomy });
        },
      )
      .put(
        "/api-keys",
        {
          detail: openapiDetail(
            "Settings",
            "Replace encrypted API keys for cloud AI providers.",
          ),
          body: apiKeysUpdateBodySchema,
          response: apiKeysUpdateResponses,
        },
        async ({ body, status }: { body: ApiKeysUpdateBody; status: RouteStatus }) => {
          await readOrCreateSettingsRow();
          await db
            .update(settings)
            .set(buildApiKeysUpdate(body))
            .where(eq(settings.id, DEFAULT_SETTINGS_ID));

          return status(HTTP_STATUS_OK, { success: true });
        },
      )
      .post(
        "/test-api-key",
        {
          detail: openapiDetail(
            "Settings",
            "Test a provider API key without persisting credentials.",
          ),
          body: providerTestBodySchema,
          response: providerTestResponses,
        },
        async ({ body, status }: { body: ProviderTestBody; status: RouteStatus }) =>
          status(HTTP_STATUS_OK, await testProviderConnection(body)),
      )
      .get(
        "/export",
        {
          detail: openapiDetail(
            "Settings",
            "Export settings as a portable configuration payload.",
          ),
          response: settingsExportResponses,
        },
        async ({ status }: { status: RouteStatus }) => {
          const { dataService } = await import("../services/data-service");
          return status(HTTP_STATUS_OK, await dataService.exportAll());
        },
      )
      .post(
        "/import",
        {
          detail: openapiDetail(
            "Settings",
            "Import settings from a portable configuration payload.",
          ),
          body: importSettingsBodySchema,
          response: settingsImportResponses,
        },
        async ({ body, status }: { body: ImportSettingsBody; status: RouteStatus }) => {
          const { dataService } = await import("../services/data-service");
          return status(
            HTTP_STATUS_OK,
            await dataService.importAll({
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
            }),
          );
        },
      ),
  );
