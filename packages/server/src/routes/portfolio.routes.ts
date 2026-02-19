import { generateId } from "@navi/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { exportService } from "../services/export-service";

export const portfolioRoutes = new Elysia({ prefix: "/portfolio" })
  .get("/", async () => {
    // Single portfolio per user, auto-create if missing
    const rows = await db.select().from(portfolios);
    if (rows.length === 0) {
      const newPortfolio = {
        id: generateId(),
        metadata: {},
      };
      await db.insert(portfolios).values(newPortfolio);
      return newPortfolio;
    }
    return rows[0];
  })
  .put(
    "/",
    async ({ body }) => {
      const existing = await db.select().from(portfolios);
      let portfolioId: string;

      if (existing.length === 0) {
        portfolioId = generateId();
        await db.insert(portfolios).values({
          id: portfolioId,
          metadata: body.metadata || {},
        });
      } else {
        portfolioId = existing[0].id;
        await db
          .update(portfolios)
          .set({
            metadata: body.metadata,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(portfolios.id, portfolioId));
      }

      const updated = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId));
      return updated[0];
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
      // Ensure portfolio exists
      let portfolio = await db.select().from(portfolios);
      if (portfolio.length === 0) {
        const newPortfolio = {
          id: generateId(),
          metadata: {},
        };
        await db.insert(portfolios).values(newPortfolio);
        portfolio = [newPortfolio];
      }

      const newProject = {
        id: generateId(),
        portfolioId: portfolio[0].id,
        title: body.title,
        description: body.description,
        technologies: body.technologies || [],
        image: body.image || null,
        liveUrl: body.liveUrl || null,
        githubUrl: body.githubUrl || null,
        tags: body.tags || [],
        featured: body.featured || false,
        role: body.role || null,
        platforms: body.platforms || null,
        engines: body.engines || null,
        sortOrder: body.sortOrder || 0,
      };

      await db.insert(portfolioProjects).values(newProject);
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
  .put(
    "/projects/:id",
    async ({ params, body, set }) => {
      const existing = await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Project not found" };
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.technologies !== undefined) updates.technologies = body.technologies;
      if (body.image !== undefined) updates.image = body.image;
      if (body.liveUrl !== undefined) updates.liveUrl = body.liveUrl;
      if (body.githubUrl !== undefined) updates.githubUrl = body.githubUrl;
      if (body.tags !== undefined) updates.tags = body.tags;
      if (body.featured !== undefined) updates.featured = body.featured;
      if (body.role !== undefined) updates.role = body.role;
      if (body.platforms !== undefined) updates.platforms = body.platforms;
      if (body.engines !== undefined) updates.engines = body.engines;
      if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

      await db.update(portfolioProjects).set(updates).where(eq(portfolioProjects.id, params.id));

      const updated = await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.id, params.id));
      return updated[0];
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
      const existing = await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Project not found" };
      }

      await db.delete(portfolioProjects).where(eq(portfolioProjects.id, params.id));
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
    async ({ body, set }) => {
      const portfolioRows = await db.select().from(portfolios);
      if (portfolioRows.length === 0) {
        set.status = 404;
        return { error: "Portfolio not found" };
      }

      const portfolio = portfolioRows[0];
      const projects = await db
        .select()
        .from(portfolioProjects)
        .where(eq(portfolioProjects.portfolioId, portfolio.id));

      try {
        const pdfBytes = await exportService.exportPortfolioPDF(portfolio.metadata, projects);

        set.headers["content-type"] = "application/pdf";
        set.headers["content-disposition"] = `attachment; filename="portfolio-${portfolio.id}.pdf"`;

        return new Response(pdfBytes, {
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
