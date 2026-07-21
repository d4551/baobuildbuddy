const reportPath = "artifacts/baseline/browser-smoke/report.json";
const payload = await Bun.file(reportPath).json() as {
  report?: Array<{
    ok: boolean;
    slug: string;
    route: string;
    viewport: string;
    consoleErrors?: string[];
    pageErrors?: string[];
    reason?: string | null;
  }>;
};
const rows = payload.report ?? [];
const fails = rows.filter((row) => !row.ok);
const lines = fails.map((row) =>
  [
    `${row.viewport}/${row.slug} ${row.route}`,
    ...(row.consoleErrors ?? []).map((msg) => `  console: ${msg}`),
    ...(row.pageErrors ?? []).map((msg) => `  page: ${msg}`),
    row.reason ? `  reason: ${row.reason}` : "",
  ]
    .filter(Boolean)
    .join("\n"),
);
await Bun.write("scripts/.tmp-smoke-fails.txt", `${lines.join("\n\n")}\ncount=${fails.length}\n`);
