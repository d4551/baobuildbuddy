import { API_ERROR_JOB_NOT_FOUND, API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { API_MESSAGE_JOB_REFRESH_COMPLETE } from "@bao/shared/constants/api-messages";
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
  applyJobBodySchema,
  jobIdParamsSchema,
  jobsListQuerySchema,
  saveJobBodySchema,
  savedJobParamsSchema,
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
  .get("/", async ({ query }) => listJobs(query), {
    query: StandardSchemaV1(jobsListQuerySchema),
  })
  .get(
    "/:id",
    async ({ params, set }) => {
      const job = await getJobById(params.id);
      if (!job) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_JOB_NOT_FOUND };
      }
      return job;
    },
    {
      params: StandardSchemaV1(jobIdParamsSchema),
    },
  )
  .post(
    "/save",
    async ({ body, set }) => {
      const result = await saveJob(body.jobId);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      body: StandardSchemaV1(saveJobBodySchema),
    },
  )
  .delete("/save/:jobId", async ({ params }) => deleteSavedJob(params.jobId), {
    params: StandardSchemaV1(savedJobParamsSchema),
  })
  .get("/saved", async () => listSavedJobs())
  .post(
    "/apply",
    async ({ body, set }) => {
      const result = await createApplication(body.jobId, body.notes ?? "");
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      body: StandardSchemaV1(applyJobBodySchema),
    },
  )
  .put(
    "/apply/:id",
    async ({ params, body, set }) => {
      const result = await updateApplication(params.id, body.status, body.notes);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      params: StandardSchemaV1(updateApplicationParamsSchema),
      body: StandardSchemaV1(updateApplicationBodySchema),
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
