import { API_ERROR_JOB_NOT_FOUND, API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_JOB_REFRESH_COMPLETE } from "@bao/shared/constants/api-messages";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { Elysia } from "elysia";
import { JobAggregator } from "../services/jobs/job-aggregator";
import { createServerLogger } from "../utils/logger";
import {
  type ApplyJobBody,
  applyJobBodySchema,
  applyJobResponses,
  applicationsListResponses,
  deleteSavedJobResponses,
  type JobIdParams,
  type JobListQuery,
  jobEntityResponses,
  jobIdParamsSchema,
  jobsListQuerySchema,
  jobsListResponses,
  jobsRefreshResponses,
  recommendationsResponses,
  type SavedJobParams,
  type SaveJobBody,
  saveJobBodySchema,
  saveJobResponses,
  savedJobParamsSchema,
  savedJobsListResponses,
  type UpdateApplicationBody,
  type UpdateApplicationParams,
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
    async ({ query }: { query: JobListQuery }) => listJobs(query),
  )
  .get(
    "/:id",
    {
      detail: { tags: ["Jobs"] },
      params: jobIdParamsSchema,
      response: jobEntityResponses,
    },
    async ({ params, set }: { params: JobIdParams; set: { status?: number | string } }) => {
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
      detail: { tags: ["Jobs"] },
      body: saveJobBodySchema,
      response: saveJobResponses,
    },
    async ({ body, set }: { body: SaveJobBody; set: { status?: number | string } }) => {
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
      detail: { tags: ["Jobs"] },
      params: savedJobParamsSchema,
      response: deleteSavedJobResponses,
    },
    async ({ params }: { params: SavedJobParams }) => deleteSavedJob(params.jobId),
  )
  .get(
    "/saved",
    {
      detail: { tags: ["Jobs"] },
      response: savedJobsListResponses,
    },
    async () => listSavedJobs(),
  )
  .post(
    "/apply",
    {
      detail: { tags: ["Jobs"] },
      body: applyJobBodySchema,
      response: applyJobResponses,
    },
    async ({ body, set }: { body: ApplyJobBody; set: { status?: number | string } }) => {
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
      detail: { tags: ["Jobs"] },
      params: updateApplicationParamsSchema,
      body: updateApplicationBodySchema,
      response: updateApplicationResponses,
    },
    async ({
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
  .get(
    "/applications",
    {
      detail: { tags: ["Jobs"] },
      response: applicationsListResponses,
    },
    async () => listApplications(),
  )
  .get(
    "/recommendations",
    {
      detail: { tags: ["Jobs"] },
      response: recommendationsResponses,
    },
    async () => getRecommendations(),
  )
  .post(
    "/refresh",
    {
      detail: { tags: ["Jobs"] },
      response: jobsRefreshResponses,
    },
    async ({ set }) => {
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
    },
  );
