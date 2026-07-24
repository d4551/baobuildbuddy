/**
 * Headed proof for Navigation IA cutover (contract-escalation-ia-2026-07-24).
 * Asserts groups, dock set, no sidebar kbd, section-only crumb, FAB desktop-only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { DOCK_NAVIGATION_IDS, NAVIGATION_GROUP_IDS } from "../packages/client/constants/navigation";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";

const CLIENT_BASE = (process.env.PAGE_PROOF_CLIENT_BASE ?? "http://127.0.0.1:3001").replace(
  /\/$/u,
  "",
);
const OUT_DIR = process.env.NAV_IA_PROOF_OUT ?? "/opt/cursor/artifacts/debug-ia/proof-nav-ia";

type Finding = { readonly check: string; readonly ok: boolean; readonly detail: string };

const collectFabRegions = async (page: Page): Promise<number> =>
  page.locator('.fab[aria-label*="quick actions" i], .fab[role="region"]').count();

const main = async (): Promise<void> => {
  await mkdir(OUT_DIR, { recursive: true });
  const findings: Finding[] = [];
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-dev-shm-usage"],
  });

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(900);

  const groupTitles = await desktop.locator("aside .menu-title").allTextContents();
  const normalizedGroups = groupTitles.map((title) => title.trim().toLowerCase());
  const expectedGroups = NAVIGATION_GROUP_IDS.map((id) => id);
  const groupsOk = expectedGroups.every((id) =>
    normalizedGroups.some((title) => title.includes(id)),
  );
  findings.push({
    check: "sidebar-groups",
    ok: groupsOk,
    detail: `titles=${JSON.stringify(groupTitles)}`,
  });

  const kbdCount = await desktop.locator("aside kbd").count();
  findings.push({
    check: "no-sidebar-kbd",
    ok: kbdCount === 0,
    detail: `kbdCount=${String(kbdCount)}`,
  });

  const desktopFabCount = await collectFabRegions(desktop);
  findings.push({
    check: "desktop-fab-present",
    ok: desktopFabCount >= 1,
    detail: `fabCount=${String(desktopFabCount)}`,
  });
  await desktop.screenshot({ path: join(OUT_DIR, "desktop-dashboard.png") });

  await desktop.goto(`${CLIENT_BASE}${APP_ROUTES.settings}`, { waitUntil: "networkidle" });
  await desktop.waitForTimeout(700);
  const crumb = (await desktop.locator(".breadcrumbs").first().innerText().catch(() => "")).trim();
  const crumbOk = crumb === "Settings" || /^Settings$/iu.test(crumb);
  findings.push({
    check: "section-only-crumb",
    ok: crumbOk,
    detail: `crumb=${JSON.stringify(crumb)}`,
  });
  const alertCount = await desktop.locator(".alert.alert-warning").count();
  findings.push({
    check: "settings-ai-alert",
    ok: alertCount >= 1,
    detail: `alertCount=${String(alertCount)}`,
  });
  await desktop.screenshot({ path: join(OUT_DIR, "desktop-settings.png") });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${CLIENT_BASE}${APP_ROUTES.dashboard}`, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(900);
  const dockHrefs = await mobile
    .locator("nav.dock a")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
  const expectedDockPaths = [
    APP_ROUTES.dashboard,
    APP_ROUTES.jobs,
    APP_ROUTES.resume,
    APP_ROUTES.aiChat,
    APP_ROUTES.settings,
  ];
  const dockOk =
    dockHrefs.length === DOCK_NAVIGATION_IDS.length &&
    expectedDockPaths.every((path, index) => dockHrefs[index] === path);
  findings.push({
    check: "mobile-dock-set",
    ok: dockOk,
    detail: `dock=${JSON.stringify(dockHrefs)}`,
  });

  const mobileFabCount = await collectFabRegions(mobile);
  findings.push({
    check: "mobile-fab-absent",
    ok: mobileFabCount === 0,
    detail: `fabCount=${String(mobileFabCount)}`,
  });
  await mobile.screenshot({ path: join(OUT_DIR, "mobile-dock.png") });

  await browser.close();

  const reportPath = join(OUT_DIR, "report.json");
  await writeFile(reportPath, `${JSON.stringify({ findings }, null, 2)}\n`, "utf8");
  const failures = findings.filter((finding) => !finding.ok);
  if (failures.length > 0) {
    console.error("browser-proof-nav-ia FAILED:");
    for (const failure of failures) {
      console.error(`- ${failure.check}: ${failure.detail}`);
    }
    process.exit(1);
  }
  console.log(`browser-proof-nav-ia: ${String(findings.length)} checks passed → ${reportPath}`);
};

await main();
