import { describe, expect, test } from "bun:test";
import { collectImportedTargets, isDeadExportViolation } from "./validate-no-dead-exports";

describe("collectImportedTargets", () => {
  test("tracks dynamic literal imports as module consumers", () => {
    const importedTargets = collectImportedTargets([
      {
        filePath: "packages/server/src/services/example.ts",
        content: 'const routes = await import("../routes/jobs.routes");',
      },
    ]);

    expect(importedTargets.has("packages/server/src/routes/jobs.routes.ts")).toBe(true);
  });

  test("tracks re-exported modules as module consumers", () => {
    const importedTargets = collectImportedTargets([
      {
        filePath: "packages/shared/src/constants/index.ts",
        content: 'export { APP_ROUTES } from "./routes";',
      },
    ]);

    expect(importedTargets.has("packages/shared/src/constants/routes.ts")).toBe(true);
  });
});

describe("isDeadExportViolation", () => {
  test("treats dynamically imported modules as live exports", () => {
    const importSources = [
      {
        filePath: "packages/server/src/services/example.ts",
        content: 'const routes = await import("../routes/jobs.routes");',
      },
    ];
    const importedTargets = collectImportedTargets(importSources);

    expect(
      isDeadExportViolation({
        filePath: "packages/server/src/routes/jobs.routes.ts",
        content: "export const jobsRoutes = {};",
        importSources,
        autoImportNames: new Set(),
        importedTargets,
      }),
    ).toHaveLength(0);
  });
});
