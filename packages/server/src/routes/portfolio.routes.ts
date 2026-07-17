import { Elysia } from "elysia";
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
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import type {
  PortfolioData,
  PortfolioMetadata,
  PortfolioProject,
} from "@bao/shared/types/portfolio";
import { settle } from "@bao/shared/utils/promise";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { gamificationService } from "../services/gamification-service";
import { portfolioService } from "../services/portfolio-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";
import {
  type PortfolioExportRouteBody,
  portfolioExportBodySchema,
  portfolioExportResponses,
  portfolioMutationResponses,
  type PortfolioProjectCreateRouteBody,
  portfolioProjectDeleteResponses,
  portfolioProjectCreateBodySchema,
  type PortfolioProjectIdParams,
  portfolioProjectIdParamsSchema,
  portfolioProjectMutationResponses,
  type PortfolioProjectReorderRouteBody,
  portfolioProjectReorderBodySchema,
  portfolioProjectReorderResponses,
  type PortfolioProjectUpdateRouteBody,
  portfolioProjectUpdateBodySchema,
  portfolioResponses,
  type PortfolioUpdateRouteBody,
  portfolioUpdateBodySchema,
} from "./portfolio-route-contracts";

type RouteStatus = typeof import("elysia").status;

const toPortfolioProjectResponse = (project: PortfolioProject) => ({
  id: project.id,
  portfolioId: project.portfolioId,
  title: project.title,
  description: project.description,
  technologies: project.technologies,
  image: project.image,
  liveUrl: project.liveUrl,
  githubUrl: project.githubUrl,
  tags: project.tags,
  featured: project.featured,
  role: project.role,
  platforms: project.platforms,
  engines: project.engines,
  sortOrder: project.sortOrder,
});

const toPortfolioResponse = (portfolio: PortfolioData) => ({
  id: portfolio.id,
  metadata: portfolio.metadata ? { ...portfolio.metadata } : undefined,
  projects: portfolio.projects.map(toPortfolioProjectResponse),
  createdAt: portfolio.createdAt,
  updatedAt: portfolio.updatedAt,
});

export const portfolioRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.portfolioBase),
})
  .get(
    "/",
    {
      detail: { tags: ["Portfolio"] },
      response: portfolioResponses,
    },
    async ({ status }: { status: RouteStatus }) => {
      return status(
        HTTP_STATUS_OK,
        toPortfolioResponse(await portfolioService.getPortfolioPayload()),
      );
    },
  )
  .put(
    "/",
    {
      detail: { tags: ["Portfolio"] },
      body: portfolioUpdateBodySchema,
      response: portfolioMutationResponses,
    },
    async ({ body, status }: { body: PortfolioUpdateRouteBody; status: RouteStatus }) => {
      return status(
        HTTP_STATUS_OK,
        toPortfolioResponse(await portfolioService.updatePortfolio({ metadata: body.metadata })),
      );
    },
  )
  .post(
    "/projects",
    {
      detail: { tags: ["Portfolio"] },
      body: portfolioProjectCreateBodySchema,
      response: portfolioProjectMutationResponses,
    },
    async ({ body, status }: { body: PortfolioProjectCreateRouteBody; status: RouteStatus }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE,
        });
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
      gamificationService.trackActionFireAndForget(
        "portfolioItems",
        ROUTE_GAMIFICATION_XP.portfolioItems,
        "portfolio_project_added",
      );
      return status(HTTP_STATUS_CREATED, toPortfolioProjectResponse(newProject));
    },
  )
  .post(
    "/projects/reorder",
    {
      detail: { tags: ["Portfolio"] },
      body: portfolioProjectReorderBodySchema,
      response: portfolioProjectReorderResponses,
    },
    async ({ body, status }: { body: PortfolioProjectReorderRouteBody; status: RouteStatus }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE,
        });
      }
      await portfolioService.reorderProjects(portfolio.id, body.orderedIds);
      return status(
        HTTP_STATUS_OK,
        toPortfolioResponse(await portfolioService.getPortfolioPayload()),
      );
    },
  )
  .put(
    "/projects/:id",
    {
      detail: { tags: ["Portfolio"] },
      params: portfolioProjectIdParamsSchema,
      body: portfolioProjectUpdateBodySchema,
      response: portfolioProjectMutationResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: PortfolioProjectIdParams;
      body: PortfolioProjectUpdateRouteBody;
      status: RouteStatus;
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
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_PROJECT_NOT_FOUND });
      }

      return status(HTTP_STATUS_OK, toPortfolioProjectResponse(updated));
    },
  )
  .delete(
    "/projects/:id",
    {
      detail: { tags: ["Portfolio"] },
      params: portfolioProjectIdParamsSchema,
      response: portfolioProjectDeleteResponses,
    },
    async ({ params, status }: { params: PortfolioProjectIdParams; status: RouteStatus }) => {
      const deleted = await portfolioService.deleteProject(params.id);
      if (!deleted) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_PROJECT_NOT_FOUND });
      }

      return status(HTTP_STATUS_OK, { success: true, id: params.id });
    },
  )
  .post(
    "/export",
    {
      detail: { tags: ["Portfolio"] },
      body: portfolioExportBodySchema,
      response: portfolioExportResponses,
    },
    async ({ body, status }: { body: PortfolioExportRouteBody; status: RouteStatus }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio) {
        return status(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_PORTFOLIO_NOT_FOUND });
      }

      const metadata: PortfolioMetadata = portfolio.metadata ?? {};

      if (body.format === "docx") {
        const docxResult = await settle(
          docxExportService.exportPortfolioDocx(metadata, portfolio.projects),
        );
        if (docxResult.status === "rejected") {
          return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
            error: API_ERROR_EXPORT_PORTFOLIO,
            details:
              docxResult.reason instanceof Error ? docxResult.reason.message : API_ERROR_UNKNOWN,
          });
        }
        return status(
          HTTP_STATUS_OK,
          createDocxAttachmentResponse(docxResult.value, `portfolio-${portfolio.id}.docx`),
        );
      }

      const exportResult = await settle(
        exportService.exportPortfolioPDF(metadata, portfolio.projects),
      );
      if (exportResult.status === "rejected") {
        return status(HTTP_STATUS_INTERNAL_SERVER_ERROR, {
          error: API_ERROR_EXPORT_PORTFOLIO,
          details:
            exportResult.reason instanceof Error ? exportResult.reason.message : API_ERROR_UNKNOWN,
        });
      }

      return status(
        HTTP_STATUS_OK,
        createPdfAttachmentResponse(
          Buffer.from(exportResult.value),
          `portfolio-${portfolio.id}.pdf`,
        ),
      );
    },
  );
