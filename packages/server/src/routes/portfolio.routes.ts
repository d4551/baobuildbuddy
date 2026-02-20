import type { PortfolioMetadata } from "@bao/shared";
import { Elysia, t } from "elysia";
import { exportService } from "../services/export-service";
import { portfolioService } from "../services/portfolio-service";

export const portfolioRoutes = new Elysia({ prefix: "/portfolio" })
  .get("/", async () => {
    return await portfolioService.getPortfolioPayload();
  })
  .put(
    "/",
    async ({ body }) => {
      return await portfolioService.updatePortfolio({ metadata: body.metadata });
    },
    {
      body: t.Object({
        metadata: t.Record(t.String(), t.Any()),
      }),
    },
  )
  .post(
    "/projects",
    async ({ body, set }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        set.status = 500;
        return { error: "Portfolio id is not available" };
      }
      const newProject = await portfolioService.addProject(portfolio.id, {
        title: body.title,
        description: body.description,
        technologies: body.technologies || [],
        image: body.image,
        liveUrl: body.liveUrl,
        githubUrl: body.githubUrl,
        tags: body.tags || [],
        featured: body.featured || false,
        role: body.role,
        platforms: body.platforms || [],
        engines: body.engines || [],
        sortOrder: body.sortOrder || 0,
      });
      set.status = 201;
      return newProject;
    },
    {
      body: t.Object({
        title: t.String({ maxLength: 200 }),
        description: t.String({ maxLength: 5000 }),
        technologies: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
        image: t.Optional(t.String({ maxLength: 500 })),
        liveUrl: t.Optional(t.String({ maxLength: 500 })),
        githubUrl: t.Optional(t.String({ maxLength: 500 })),
        tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 30 })),
        featured: t.Optional(t.Boolean()),
        role: t.Optional(t.String({ maxLength: 200 })),
        platforms: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
        engines: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
        sortOrder: t.Optional(t.Number()),
      }),
    },
  )
  .post(
    "/projects/reorder",
    async ({ body, set }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio.id) {
        set.status = 500;
        return { error: "Portfolio id is not available" };
      }
      await portfolioService.reorderProjects(portfolio.id, body.orderedIds);
      return await portfolioService.getPortfolioPayload();
    },
    {
      body: t.Object({
        orderedIds: t.Array(t.String({ minLength: 1 })),
      }),
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
        set.status = 404;
        return { error: "Project not found" };
      }

      return updated;
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        title: t.Optional(t.String({ maxLength: 200 })),
        description: t.Optional(t.String({ maxLength: 5000 })),
        technologies: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
        image: t.Optional(t.String({ maxLength: 500 })),
        liveUrl: t.Optional(t.String({ maxLength: 500 })),
        githubUrl: t.Optional(t.String({ maxLength: 500 })),
        tags: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 30 })),
        featured: t.Optional(t.Boolean()),
        role: t.Optional(t.String({ maxLength: 200 })),
        platforms: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
        engines: t.Optional(t.Array(t.String({ maxLength: 50 }), { maxItems: 20 })),
        sortOrder: t.Optional(t.Number()),
      }),
    },
  )
  .delete(
    "/projects/:id",
    async ({ params, set }) => {
      const deleted = await portfolioService.deleteProject(params.id);
      if (!deleted) {
        set.status = 404;
        return { error: "Project not found" };
      }

      return { success: true, id: params.id };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .post(
    "/export",
    async ({ set }) => {
      const portfolio = await portfolioService.getPortfolioPayload();
      if (!portfolio) {
        set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        const metadata: PortfolioMetadata = portfolio.metadata ?? {};
        const pdfBytes = await exportService.exportPortfolioPDF(metadata, portfolio.projects);

        set.headers["content-type"] = "application/pdf";
        set.headers["content-disposition"] = `attachment; filename="portfolio-${portfolio.id}.pdf"`;

        return new Response(Buffer.from(pdfBytes), {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="portfolio-${portfolio.id}.pdf"`,
          },
        });
      } catch (error) {
        set.status = 500;
        return {
          error: "Failed to export portfolio",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        format: t.Optional(t.String({ maxLength: 20 })),
      }),
    },
  );
