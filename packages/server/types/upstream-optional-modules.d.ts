/**
 * Ambient stubs for optional Drizzle *driver* packages that are not installed
 * in this Bun/SQLite deployment. Required when `skipLibCheck` is false so
 * TypeScript can resolve unused `drizzle-orm/*` driver declaration files.
 *
 * PRODUCT ORM = Drizzle + `bun:sqlite` only (see docs/STACK-CONTRACT.md).
 * These declares are typing noise for unused upstream drivers — NOT stack
 * choices. In particular, `@prisma/client` does not mean Prisma is used;
 * drizzle-orm ships optional `drizzle-orm/prisma/*` modules that reference it.
 */
declare module "gel";
declare module "mysql2/promise";
declare module "mysql2";
/** Unused drizzle-orm prisma module typing only — product does not use Prisma. */
declare module "@prisma/client";
declare module "pg";
declare module "pg-native";
declare module "better-sqlite3";
declare module "sql.js";
declare module "@neondatabase/serverless";
declare module "@cloudflare/workers-types";
declare module "@opentelemetry/api";
