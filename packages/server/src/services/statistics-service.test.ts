import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { isRecord } from "@bao/shared/utils/type-guards";
import type * as StatisticsServiceModule from "./statistics-service";

type LoggerEntry = readonly unknown[];
type ServiceModule = typeof StatisticsServiceModule;

const loggerEntries: {
  warn: LoggerEntry[];
} = {
  warn: [],
};

const noopLogger = (): void => undefined;
const isServiceModule = (value: unknown): value is ServiceModule =>
  isRecord(value) && "statisticsService" in value;

const logger = {
  debug: noopLogger,
  error: noopLogger,
  info: noopLogger,
  warn: (...values: readonly unknown[]) => {
    loggerEntries.warn.push(values);
  },
};

const realDbClient = await import("../db/client");
// Bound so restoring it cannot detach `this` from the Drizzle client.
const originalSelect = realDbClient.db.select.bind(realDbClient.db);

await mock.module("../utils/logger", () => ({
  createServerLogger: () => logger,
}));

const loadService = async (): Promise<ServiceModule> => {
  const moduleValue: unknown = await import(`./statistics-service.ts?test=${crypto.randomUUID()}`);
  if (!isServiceModule(moduleValue)) {
    throw new Error("Failed to load statistics service module");
  }
  return moduleValue;
};

const failingSelect = (): never => {
  throw new Error("db unavailable");
};

beforeEach(() => {
  loggerEntries.warn.length = 0;
  realDbClient.db.select = failingSelect;
});

afterEach(() => {
  realDbClient.db.select = originalSelect;
});

describe("statistics service degradation logging", () => {
  test("logs the failing stat name before degrading to defaults", async () => {
    const { statisticsService } = await loadService();

    const stats = await statisticsService.getDashboardStats();

    expect(stats.profile.completeness).toBe(0);
    expect(stats.jobs.saved).toBe(0);
    const loggedStatNames = loggerEntries.warn.map((entry) => JSON.stringify(entry));
    expect(loggedStatNames.some((entry) => entry.includes("profile.completeness"))).toBe(true);
    expect(loggedStatNames.some((entry) => entry.includes('"jobs"'))).toBe(true);
    expect(loggedStatNames.some((entry) => entry.includes("db unavailable"))).toBe(true);
  });
});
