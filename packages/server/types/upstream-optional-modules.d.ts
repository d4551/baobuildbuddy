/**
 * Ambient stubs for optional Drizzle driver packages that are not installed
 * in this Bun/SQLite deployment. Required when `skipLibCheck` is false so
 * TypeScript does not fail on unused drizzle-orm driver declaration files.
 */
declare module "gel";
declare module "mysql2/promise";
declare module "mysql2";
declare module "@prisma/client";
declare module "pg";
declare module "pg-native";
declare module "better-sqlite3";
declare module "sql.js";
declare module "@neondatabase/serverless";
declare module "@cloudflare/workers-types";
declare module "@opentelemetry/api";
