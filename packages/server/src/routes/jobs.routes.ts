import { API_ERROR_JOB_NOT_FOUND, API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_JOB_REFRESH_COMPLETE } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { Elysia } from "elysia";
import { JobAggregator } from "../services/jobs/job-aggregator";
import { createServerLogger } from "../utils/logger";
import {
  applyJobBodySchema,
  applicationsListResponses,
  applyJobResponses,
  deleteSavedJobResponses,
  jobEntityResponses,
  jobIdParamsSchema,
  jobsListResponses,
  jobsListQuerySchema,
  jobsRefreshResponses,
  recommendationsResponses,
  savedJobsListResponses,
  saveJobResponses,
  saveJobBodySchema,
  savedJobParamsSchema,
  updateApplicationBodySchema,
  updateApplicationParamsSchema,
  updateApplicationResponses,
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
})
  .get(
    "/",
    {
      detail: { tags: ["Jobs"] },
      query: jobsListQuerySchema,
      response: jobsListResponses,
    },
    async ({ query, status }) => status(HTTP_STATUS_OK, await listJobs(query)),
  )
  .get(
    "/:id",
    {
      detail: { tags: ["Jobs"] },
      params: jobIdParamsSchema,
      response: jobEntityResponses,
    },
    async ({ params, status }) => {
      const job = await getJobById(params.id);
      if (!job) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_JOB_NOT_FOUND });
      }
      return status(HTTP_STATUS_OK, job);
    },
  )
  .post(
    "/save",
    {
      detail: { tags: ["Jobs"] },
      body: saveJobBodySchema,
      response: saveJobResponses,
    },
    async ({ body, status }) => {
      const result = await saveJob(body.jobId);
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      if (result.status === HTTP_STATUS_CREATED) {
        return status(HTTP_STATUS_CREATED, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .delete(
    "/save/:jobId",
    {
      detail: { tags: ["Jobs"] },
      params: savedJobParamsSchema,
      response: deleteSavedJobResponses,
    },
    async ({ params, status }) =>
      status(HTTP_STATUS_OK, await deleteSavedJob(params.jobId)),
  )
  .get(
    "/saved",
    {
      detail: { tags: ["Jobs"] },
      response: savedJobsListResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await listSavedJobs()),
  )
  .post(
    "/apply",
    {
      detail: { tags: ["Jobs"] },
      body: applyJobBodySchema,
      response: applyJobResponses,
    },
    async ({ body, status }) => {
      const result = await createApplication(body.jobId, body.notes ?? "");
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      if (result.status === HTTP_STATUS_CREATED) {
        return status(HTTP_STATUS_CREATED, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .put(
    "/apply/:id",
    {
      detail: { tags: ["Jobs"] },
      params: updateApplicationParamsSchema,
      body: updateApplicationBodySchema,
      response: updateApplicationResponses,
    },
    async ({ params, body, status }) => {
      const result = await updateApplication(params.id, body.status, body.notes);
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .get(
    "/applications",
    {
      detail: { tags: ["Jobs"] },
      response: applicationsListResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await listApplications()),
  )
  .get(
    "/recommendations",
    {
      detail: { tags: ["Jobs"] },
      response: recommendationsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await getRecommendations()),
  )
  .post(
    "/refresh",
    {
      detail: { tags: ["Jobs"] },
      response: jobsRefreshResponses,
    },
    async ({ status }) => {
      const aggregator = new JobAggregator();
      const refreshResult = await settle(aggregator.refreshJobs());
      if (refreshResult.status === "rejected") {
        jobsRoutesLogger.error("Job refresh error:", refreshResult.reason);
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: `Job refresh failed: ${
            refreshResult.reason instanceof Error ? refreshResult.reason.message : API_ERROR_UNKNOWN
          }`,
        });
      }

      return status(HTTP_STATUS_OK, {
        message: API_MESSAGE_JOB_REFRESH_COMPLETE,
        status: "completed",
        totalJobs: refreshResult.value.total,
        newJobs: refreshResult.value.new,
        updatedJobs: refreshResult.value.updated,
      });
    },
  );
