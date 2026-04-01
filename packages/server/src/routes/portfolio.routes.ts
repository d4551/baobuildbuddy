import {
  API_ERROR_EXPORT_PORTFOLIO,
  API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE,
  API_ERROR_PORTFOLIO_NOT_FOUND,
  API_ERROR_PROJECT_NOT_FOUND,
  API_ERROR_UNKNOWN,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@bao/shared/constants/http";
import type { PortfolioMetadata } from "@bao/shared/types/portfolio";
import { settle } from "@bao/shared/utils/promise";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { gamificationService } from "../services/gamification-service";
import { portfolioService } from "../services/portfolio-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";
import {
  type PortfolioExportRouteBody,
  type PortfolioProjectCreateRouteBody,
  type PortfolioProjectIdParams,
  type PortfolioProjectReorderRouteBody,
  type PortfolioProjectUpdateRouteBody,
  type PortfolioUpdateRouteBody,
  type RouteSetState,
  portfolioExportBodySchema,
  portfolioProjectCreateBodySchema,
  portfolioProjectIdParamsSchema,
  portfolioProjectReorderBodySchema,
  portfolioProjectUpdateBodySchema,
  portfolioUpdateBodySchema,
} from "./portfolio-route-contracts";

export const portfolioRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.portfolioBase),
  tags: ["Portfolio"],
})
  .get("/", async () => {
    return await portfolioService.getPortfolioPayload();
  })
  .put(
    "/",
    async ({ body }: { body: PortfolioUpdateRouteBody }) => {
      return await portfolioService.updatePortfolio({ metadata: body.metadata });
    },
    {
      body: StandardSchemaV1(portfolioUpdateBodySchema),
    },
  )
  .post(
    "/projects",
    async ({ body, set }: { body: PortfolioProjectCreateRouteBody; set: RouteSetState }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return { error: API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE };
      }
      const newProject = await portfolioService.addProject(portfolio.id, {
        title: body.title,
        description: body.description,
        technologies: body.technologies || [],
        image: body.image,
        liveUrl: body.liveUrl,
        githubUrl: body.githubUrl,
        tags: body.tags || [],
        featured: body.featured,
        role: body.role,
        platforms: body.platforms || [],
        engines: body.engines || [],
        sortOrder: body.sortOrder || 0,
      });
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "portfolioItems",
        ROUTE_GAMIFICATION_XP.portfolioItems,
        "portfolio_project_added",
      );
      return newProject;
    },
    {
      body: StandardSchemaV1(portfolioProjectCreateBodySchema),
    },
  )
  .post(
    "/projects/reorder",
    async ({ body, set }: { body: PortfolioProjectReorderRouteBody; set: RouteSetState }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return { error: API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE };
      }
      await portfolioService.reorderProjects(portfolio.id, body.orderedIds);
      return await portfolioService.getPortfolioPayload();
    },
    {
      body: StandardSchemaV1(portfolioProjectReorderBodySchema),
    },
  )
  .put(
    "/projects/:id",
    async ({
      params,
      body,
      set,
    }: {
      params: PortfolioProjectIdParams;
      body: PortfolioProjectUpdateRouteBody;
      set: RouteSetState;
    }) => {
      const updated = await portfolioService.updateProject(params.id, {
        title: body.title,
        description: body.description,
        technologies: body.technologies,
        image: body.image,
        liveUrl: body.liveUrl,
        githubUrl: body.githubUrl,
        tags: body.tags,
        featured: body.featured,
        role: body.role,
        platforms: body.platforms,
        engines: body.engines,
        sortOrder: body.sortOrder,
      });

      if (!updated) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_PROJECT_NOT_FOUND };
      }

      return updated;
    },
    {
      params: StandardSchemaV1(portfolioProjectIdParamsSchema),
      body: StandardSchemaV1(portfolioProjectUpdateBodySchema),
    },
  )
  .delete(
    "/projects/:id",
    async ({ params, set }: { params: PortfolioProjectIdParams; set: RouteSetState }) => {
      const deleted = await portfolioService.deleteProject(params.id);
      if (!deleted) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_PROJECT_NOT_FOUND };
      }

      return { success: true, id: params.id };
    },
    {
      params: StandardSchemaV1(portfolioProjectIdParamsSchema),
    },
  )
  .post(
    "/export",
    async ({ body, set }: { body: PortfolioExportRouteBody; set: RouteSetState }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_PORTFOLIO_NOT_FOUND };
      }

      const metadata: PortfolioMetadata = portfolio.metadata ?? {};

      if (body.format === "docx") {
        const docxResult = await settle(
          docxExportService.exportPortfolioDocx(metadata, portfolio.projects),
        );
        if (docxResult.status === "rejected") {
          set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
          return {
            error: API_ERROR_EXPORT_PORTFOLIO,
            details:
              docxResult.reason instanceof Error ? docxResult.reason.message : API_ERROR_UNKNOWN,
          };
        }
        return createDocxAttachmentResponse(docxResult.value, `portfolio-${portfolio.id}.docx`);
      }

      const exportResult = await settle(
        exportService.exportPortfolioPDF(metadata, portfolio.projects),
      );
      if (exportResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_EXPORT_PORTFOLIO,
          details:
            exportResult.reason instanceof Error ? exportResult.reason.message : API_ERROR_UNKNOWN,
        };
      }

      return createPdfAttachmentResponse(
        Buffer.from(exportResult.value),
        `portfolio-${portfolio.id}.pdf`,
      );
    },
    {
      body: StandardSchemaV1(portfolioExportBodySchema),
    },
  );
