import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull(),
    remote: integer("remote", { mode: "boolean" }).default(false),
    hybrid: integer("hybrid", { mode: "boolean" }).default(false),
    salary: text("salary", { mode: "json" }).$type<Record<string, unknown>>(),
    description: text("description"),
    requirements: text("requirements", { mode: "json" }).$type<string[]>(),
    technologies: text("technologies", { mode: "json" }).$type<string[]>(),
    experienceLevel: text("experience_level"),
    type: text("type").default("full-time"),
    postedDate: text("posted_date"),
    url: text("url"),
    source: text("source"),
    studioType: text("studio_type"),
    gameGenres: text("game_genres", { mode: "json" }).$type<string[]>(),
    platforms: text("platforms", { mode: "json" }).$type<string[]>(),
    contentHash: text("content_hash"),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    companyLogo: text("company_logo"),
    applicationUrl: text("application_url"),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index("jobs_source_idx").on(table.source),
    index("jobs_posted_date_idx").on(table.postedDate),
    uniqueIndex("jobs_content_hash_idx").on(table.contentHash),
  ],
);

export const savedJobs = sqliteTable(
  "saved_jobs",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    savedAt: text("saved_at").notNull(),
  },
  (table) => [index("saved_jobs_job_id_idx").on(table.jobId)],
);

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: text("status").default("applied"),
    appliedDate: text("applied_date").notNull(),
    notes: text("notes").default(""),
    timeline: text("timeline", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("applications_job_id_idx").on(table.jobId)],
);
