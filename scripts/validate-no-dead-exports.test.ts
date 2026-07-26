import { describe, expect, test } from "bun:test";
import { collectIdentifierOccurrences } from "./utils/dead-export-references";
import {
  collectImportedTargets,
  isDeadExportViolation,
  isOrphanExportViolation,
} from "./validate-no-dead-exports";

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

  test("resolves directory imports to index modules", () => {
    const importedTargets = collectImportedTargets([
      {
        filePath: "packages/client/pages/example.vue",
        content: 'const card = await import("../components/ui");',
      },
    ]);

    expect(importedTargets.has("packages/client/components/ui/index.ts")).toBe(true);
    expect(importedTargets.has("packages/client/components/ui/index.vue")).toBe(true);
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

const orphansIn = (sources: Array<{ filePath: string; content: string }>, target: string) => {
  const occurrences = collectIdentifierOccurrences(sources);
  const entry = sources.find((source) => source.filePath === target);
  return isOrphanExportViolation({
    filePath: target,
    content: entry?.content ?? "",
    identifierOccurrences: occurrences,
  });
};

describe("isOrphanExportViolation", () => {
  test("an import that never uses the symbol does not keep it alive", () => {
    const violations = orphansIn(
      [
        { filePath: "packages/shared/src/constants/a.ts", content: "export const DEAD_TOKEN = 8;" },
        {
          filePath: "packages/server/src/uses.ts",
          content:
            'import { DEAD_TOKEN } from "@bao/shared/constants/a";\nexport const other = 1;\n',
        },
      ],
      "packages/shared/src/constants/a.ts",
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("DEAD_TOKEN");
  });

  test("a symbol consumed through a renamed import is live", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content: "export const resolveRunArtifactDir = () => '';",
          },
          {
            filePath: "packages/server/src/uses.ts",
            content:
              'import { resolveRunArtifactDir as resolveRunArtifactDirectory } from "@bao/shared/constants/a";\nexport const dir = resolveRunArtifactDirectory();\n',
          },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(0);
  });

  test("a renamed import whose alias is never used stays dead", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content: "export const unusedAliasSource = () => '';",
          },
          {
            filePath: "packages/server/src/uses.ts",
            content:
              'import { unusedAliasSource as neverCalled } from "@bao/shared/constants/a";\nexport const other = 1;\n',
          },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(1);
  });

  test("a symbol referenced by a real caller is live", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content: "export const LIVE_TOKEN = 8;",
          },
          {
            filePath: "packages/server/src/uses.ts",
            content:
              'import { LIVE_TOKEN } from "@bao/shared/constants/a";\nexport const sum = LIVE_TOKEN + 1;\n',
          },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(0);
  });
});

describe("orphan reference counting ignores prose but never code", () => {
  test("a name mentioned only in prose does not keep a symbol alive", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content: "export const PROSE_ONLY = 8;",
          },
          {
            filePath: "packages/server/src/notes.ts",
            content:
              "// PROSE_ONLY is documented here.\n/* PROSE_ONLY again */\nexport const x = 1;\n",
          },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(1);
  });

  test("prose describing a re-export is not mined for export names", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content:
              "/** Structured as assignments, not `export { … } from`. */\nexport const USED = 1;",
          },
          { filePath: "packages/server/src/uses.ts", content: "export const total = USED + 1;" },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(0);
  });
});

describe("isOrphanExportViolation usage contexts", () => {
  test("a URL inside a string does not truncate the rest of the line", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content: "export const AFTER_URL = 1;",
          },
          {
            filePath: "packages/server/src/uses.ts",
            content: 'const base = "https://example.com"; export const sum = AFTER_URL + 1;\n',
          },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(0);
  });

  test("a Vue template binding inside a quoted attribute counts as usage", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/client/constants/ui-layout.ts",
            content: "export const SHELL_CLASS = 'p-4';",
          },
          {
            filePath: "packages/client/components/Shell.vue",
            content: '<template>\n  <div :class="SHELL_CLASS" />\n</template>\n',
          },
        ],
        "packages/client/constants/ui-layout.ts",
      ),
    ).toHaveLength(0);
  });

  // Template literals are never blanked by the stripper, so a name appearing
  // inside one — interpolated or not — still counts as a live reference.
  test("a reference inside a template literal counts as usage", () => {
    expect(
      orphansIn(
        [
          {
            filePath: "packages/shared/src/constants/a.ts",
            content: "export const TEMPLATE_TOKEN = 1;",
          },
          {
            filePath: "packages/server/src/uses.ts",
            content: "export const label = `value: {TEMPLATE_TOKEN}`;\n",
          },
        ],
        "packages/shared/src/constants/a.ts",
      ),
    ).toHaveLength(0);
  });
});
