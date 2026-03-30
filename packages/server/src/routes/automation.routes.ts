import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared";
import { Elysia, t } from "elysia";
import { automationRateLimit } from "../utils/rate-limit";
import {
  handleAutomationCapabilitiesRoute,
  handleAutomationRunByIdRoute,
  handleEmailResponseRoute,
  handleJobApplyRoute,
  handleScheduledEmailResponseRoute,
  handleScheduledJobApplyRoute,
  handleScheduledScrapeRoute,
  handleScrapeRoute,
  handleVerifyAutomationContext,
} from "./automation-route-actions";
import {
  automationRouteErrorResponses,
  automationRunEnvelopeBodySchema,
  automationRunIdParamsSchema,
  automationRunQuerySchema,
  AUTOMATION_STATUS_SUCCESS,
  capabilityAuditReportBodySchema,
  emailResponseBodySchema,
  jobApplyBodySchema,
  routeErrorBodySchema,
  scheduledEmailResponseBodySchema,
  scheduledJobApplyBodySchema,
  scheduledScrapeBodySchema,
  scrapeBodySchema,
} from "./automation-route-contracts";
import {
  listAutomationRuns,
} from "./automation-route-support";

/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export const automationRoutes = new Elysia({ prefix: "/automation", tags: ["Automation"] })
  .use(automationRateLimit)
  .get(
    "/verify/context",
    async ({ set }) => handleVerifyAutomationContext(set),
    {
      response: {
        [HTTP_STATUS_OK]: t.Object({
          resumeId: t.String({ minLength: 1 }),
        }),
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
      },
    },
  )
  .post(
    "/job-apply",
    async ({ body, set }) => handleJobApplyRoute(body, set),
    {
      body: jobApplyBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/job-apply/schedule",
    async ({ body, set }) => handleScheduledJobApplyRoute(body, set),
    {
      body: scheduledJobApplyBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/email-response",
    async ({ body, set }) => handleEmailResponseRoute(body, set),
    {
      body: emailResponseBodySchema,
      response: {
        [HTTP_STATUS_OK]: t.Object({
          runId: t.String(),
          status: t.Literal(AUTOMATION_STATUS_SUCCESS),
          reply: t.String(),
          provider: t.String(),
          model: t.String(),
          delivered: t.Boolean(),
          recipientEmail: t.Optional(t.String()),
          deliveredAt: t.Optional(t.String()),
          messageId: t.Optional(t.String()),
        }),
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/email-response/schedule",
    async ({ body, set }) => handleScheduledEmailResponseRoute(body, set),
    {
      body: scheduledEmailResponseBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/scrape",
    async ({ body, set }) => handleScrapeRoute(body, set),
    {
      body: scrapeBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/scrape/schedule",
    async ({ body, set }) => handleScheduledScrapeRoute(body, set),
    {
      body: scheduledScrapeBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .get(
    "/capabilities",
    async ({ set }) => handleAutomationCapabilitiesRoute(set),
    {
      response: {
        [HTTP_STATUS_OK]: capabilityAuditReportBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .get(
    "/runs",
    async ({ query }) => listAutomationRuns(query),
    {
      response: t.Array(automationRunEnvelopeBodySchema),
      query: automationRunQuerySchema,
    },
  )
  .get(
    "/runs/:id",
    async ({ params, set }) => handleAutomationRunByIdRoute(params.id, set),
    {
      params: automationRunIdParamsSchema,
      response: {
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
      },
    },
  );
