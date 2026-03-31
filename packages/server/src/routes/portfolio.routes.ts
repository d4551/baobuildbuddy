import {
  API_ERROR_EXPORT_PORTFOLIO,
  API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE,
  API_ERROR_PORTFOLIO_NOT_FOUND,
  API_ERROR_PROJECT_NOT_FOUND,
  API_ERROR_UNKNOWN,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  type PortfolioMetadata,
  ROUTE_GAMIFICATION_XP,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_MEDIUM,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
  settle,
} from "@bao/shared";
import { StandardSchemaV1 } from "baobox";
import Type from "baobox";
import { Elysia } from "elysia";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { gamificationService } from "../services/gamification-service";
import { portfolioService } from "../services/portfolio-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";

export const portfolioRoutes = new Elysia({ prefix: "/portfolio", tags: ["Portfolio"] })
  .get("/", async () => {
    return await portfolioService.getPortfolioPayload();
  })
  .put(
    "/",
    async ({ body }) => {
      return await portfolioService.updatePortfolio({ metadata: body.metadata });
    },
    {
      body: StandardSchemaV1(
        Type.Object(
          {
            metadata: Type.Record(Type.String(), Type.Unknown()),
          },
          { required: ["metadata"] },
        ),
      ),
    },
  )
  .post(
    "/projects",
    async ({ body, set }) => {
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
      body: StandardSchemaV1(
        Type.Object(
          {
            title: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
            description: Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION }),
            technologies: Type.Optional(
              Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
                maxItems: SCHEMA_MAX_ITEMS_LARGE,
              }),
            ),
            image: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
            liveUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
            githubUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
            tags: Type.Optional(
              Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
                maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
              }),
            ),
            featured: Type.Optional(Type.Boolean()),
            role: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
            platforms: Type.Optional(
              Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
                maxItems: SCHEMA_MAX_ITEMS_SMALL,
              }),
            ),
            engines: Type.Optional(
              Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
                maxItems: SCHEMA_MAX_ITEMS_SMALL,
              }),
            ),
            sortOrder: Type.Optional(Type.Number()),
          },
          { required: ["title", "description"] },
        ),
      ),
    },
  )
  .post(
    "/projects/reorder",
    async ({ body, set }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return { error: API_ERROR_PORTFOLIO_ID_NOT_AVAILABLE };
      }
      await portfolioService.reorderProjects(portfolio.id, body.orderedIds);
      return await portfolioService.getPortfolioPayload();
    },
    {
      body: StandardSchemaV1(
        Type.Object(
          {
            orderedIds: Type.Array(Type.String({ minLength: 1 })),
          },
          { required: ["orderedIds"] },
        ),
      ),
    },
  )
  .put(
    "/projects/:id",
    async ({ params, body, set }) => {
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
      params: StandardSchemaV1(
        Type.Object(
          {
            id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
          },
          { required: ["id"] },
        ),
      ),
      body: StandardSchemaV1(
        Type.Object({
          title: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          description: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
          technologies: Type.Optional(
            Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
              maxItems: SCHEMA_MAX_ITEMS_LARGE,
            }),
          ),
          image: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
          liveUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
          githubUrl: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
          tags: Type.Optional(
            Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
              maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
            }),
          ),
          featured: Type.Optional(Type.Boolean()),
          role: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
          platforms: Type.Optional(
            Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
              maxItems: SCHEMA_MAX_ITEMS_SMALL,
            }),
          ),
          engines: Type.Optional(
            Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }), {
              maxItems: SCHEMA_MAX_ITEMS_SMALL,
            }),
          ),
          sortOrder: Type.Optional(Type.Number()),
        }),
      ),
    },
  )
  .delete(
    "/projects/:id",
    async ({ params, set }) => {
      const deleted = await portfolioService.deleteProject(params.id);
      if (!deleted) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_PROJECT_NOT_FOUND };
      }

      return { success: true, id: params.id };
    },
    {
      params: StandardSchemaV1(
        Type.Object(
          {
            id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
          },
          { required: ["id"] },
        ),
      ),
    },
  )
  .post(
    "/export",
    async ({ body, set }) => {
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
      body: StandardSchemaV1(
        Type.Object({
          format: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
        }),
      ),
    },
  );
