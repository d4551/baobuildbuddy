import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const portfolios = sqliteTable("portfolios", {
  id: text("id").primaryKey(),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const portfolioProjects = sqliteTable(
  "portfolio_projects",
  {
    id: text("id").primaryKey(),
    portfolioId: text("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    technologies: text("technologies", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    image: text("image"),
    liveUrl: text("live_url"),
    githubUrl: text("github_url"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    featured: integer("featured", { mode: "boolean" }).default(false),
    role: text("role"),
    platforms: text("platforms", { mode: "json" }).$type<string[]>(),
    engines: text("engines", { mode: "json" }).$type<string[]>(),
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("portfolio_projects_portfolio_id_idx").on(table.portfolioId)],
);
