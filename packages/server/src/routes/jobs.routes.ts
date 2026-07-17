import { API_ERROR_JOB_NOT_FOUND, API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_JOB_REFRESH_COMPLETE } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { JobAggregator } from "../services/jobs/job-aggregator";
import { createServerLogger } from "../utils/logger";
import {
  type ApplyJobBody,
  applyJobBodySchema,
  type JobIdParams,
  type JobListQuery,
  jobIdParamsSchema,
  jobsListQuerySchema,
  type SavedJobParams,
  type SaveJobBody,
  savedJobParamsSchema,
  saveJobBodySchema,
  type UpdateApplicationBody,
  type UpdateApplicationParams,
  updateApplicationBodySchema,
  updateApplicationParamsSchema,
} from "./jobs-route-contracts";
import {
  createApplication,
  deleteSavedJob,
  getJobById,
  listApplications,
  listJobs,
  listSavedJobs,
  saveJob,
  updateApplication,
} from "./jobs-route-listing";
import { getRecommendations } from "./jobs-route-recommendations";

const jobsRoutesLogger = createServerLogger("jobs-routes");

export const jobsRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.jobsBase),
  tags: ["Jobs"],
})
  .get("/", {
    query: StandardSchemaV1(jobsListQuerySchema),
  }, async ({ query }: { query: JobListQuery }) => listJobs(query))
  .get(
    "/:id",
    {
      params: StandardSchemaV1(jobIdParamsSchema),
    }, async ({ params, set }: { params: JobIdParams; set: { status?: number | string } }) => {
      const job = await getJobById(params.id);
      if (!job) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_JOB_NOT_FOUND };
      }
      return job;
    },
  )
  .post(
    "/save",
    {
      body: StandardSchemaV1(saveJobBodySchema),
    }, async ({ body, set }: { body: SaveJobBody; set: { status?: number | string } }) => {
      const result = await saveJob(body.jobId);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .delete(
    "/save/:jobId",
    {
      params: StandardSchemaV1(savedJobParamsSchema),
    }, async ({ params }: { params: SavedJobParams }) => deleteSavedJob(params.jobId),
  )
  .get("/saved", async () => listSavedJobs())
  .post(
    "/apply",
    {
      body: StandardSchemaV1(applyJobBodySchema),
    }, async ({ body, set }: { body: ApplyJobBody; set: { status?: number | string } }) => {
      const result = await createApplication(body.jobId, body.notes ?? "");
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .put(
    "/apply/:id",
    {
      params: StandardSchemaV1(updateApplicationParamsSchema),
      body: StandardSchemaV1(updateApplicationBodySchema),
    }, async ({
      params,
      body,
      set,
    }: {
      params: UpdateApplicationParams;
      body: UpdateApplicationBody;
      set: { status?: number | string };
    }) => {
      const result = await updateApplication(params.id, body.status, body.notes);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .get("/applications", async () => listApplications())
  .get("/recommendations", async () => getRecommendations())
  .post("/refresh", async ({ set }) => {
    const aggregator = new JobAggregator();
    const refreshResult = await settle(aggregator.refreshJobs());
    if (refreshResult.status === "rejected") {
      jobsRoutesLogger.error("Job refresh error:", refreshResult.reason);
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return {
        message: `Job refresh failed: ${refreshResult.reason instanceof Error ? refreshResult.reason.message : API_ERROR_UNKNOWN}`,
        status: "failed",
        totalJobs: 0,
        newJobs: 0,
        updatedJobs: 0,
      };
    }

    return {
      message: API_MESSAGE_JOB_REFRESH_COMPLETE,
      status: "completed",
      totalJobs: refreshResult.value.total,
      newJobs: refreshResult.value.new,
      updatedJobs: refreshResult.value.updated,
    };
  });
