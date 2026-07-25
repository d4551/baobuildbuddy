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
import { openapiDetail } from "../utils/openapi-detail";
import {
  applicationsListResponses,
  applyJobBodySchema,
  applyJobResponses,
  deleteSavedJobResponses,
  jobEntityResponses,
  jobIdParamsSchema,
  jobsListQuerySchema,
  jobsListResponses,
  jobsRefreshResponses,
  recommendationsResponses,
  savedJobParamsSchema,
  savedJobsListResponses,
  saveJobBodySchema,
  saveJobResponses,
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
      detail: openapiDetail("Jobs", "List jobs in the feed with filters and pagination."),
      query: jobsListQuerySchema,
      response: jobsListResponses,
    },
    async ({ query, status }) => status(HTTP_STATUS_OK, await listJobs(query)),
  )
  .get(
    "/:id",
    {
      detail: openapiDetail("Jobs", "Retrieve a single job posting by id with details."),
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
      detail: openapiDetail(
        "Jobs",
        "Save a job posting to the user's shortlist.",
      ),
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
      detail: openapiDetail("Jobs", "Remove a job posting from the user's shortlist."),
      params: savedJobParamsSchema,
      response: deleteSavedJobResponses,
    },
    async ({ params, status }) => status(HTTP_STATUS_OK, await deleteSavedJob(params.jobId)),
  )
  .get(
    "/saved",
    {
      detail: openapiDetail("Jobs", "List jobs the user has saved to their shortlist."),
      response: savedJobsListResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await listSavedJobs()),
  )
  .post(
    "/apply",
    {
      detail: openapiDetail(
        "Jobs",
        "Record a manual job application for a posting.",
      ),
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
      detail: openapiDetail("Jobs", "Update application status and notes for a job."),
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
      detail: openapiDetail(
        "Jobs",
        "List job applications with status and timestamps.",
      ),
      response: applicationsListResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await listApplications()),
  )
  .get(
    "/recommendations",
    {
      detail: openapiDetail(
        "Jobs",
        "Retrieve personalized job recommendations for the profile.",
      ),
      response: recommendationsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await getRecommendations()),
  )
  .post(
    "/refresh",
    {
      detail: openapiDetail(
        "Jobs",
        "Refresh the job feed from configured providers.",
      ),
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
