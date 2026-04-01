import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const outputDir = '/tmp/bao-page-audit-shots-fresh';
mkdirSync(outputDir, { recursive: true });

const authKey = 'bao_oSilwPFBy0u8alZKTfXVZumk4fPtfaJK';
const baseUrl = 'http://localhost:3001';
const routes = [
  { name: 'home', route: '/', selector: 'h1' },
  { name: 'setup', route: '/setup', selector: 'h1' },
  { name: 'jobs-index', route: '/jobs', selector: 'h1' },
  { name: 'jobs-detail', route: '/jobs/ac76b88c-a501-47e8-a07c-f7c290a31010', selector: 'h1' },
  { name: 'resume-index', route: '/resume?id=019d0c3f-0e65-7000-b6d6-b47aa79a9a27', selector: 'h1' },
  { name: 'resume-build', route: '/resume/build', selector: 'h1' },
  { name: 'resume-preview', route: '/resume/preview?id=019d0c3f-0e65-7000-b6d6-b47aa79a9a27', selector: 'h1' },
  { name: 'cover-letter-index', route: '/cover-letter', selector: 'h1' },
  { name: 'cover-letter-detail', route: '/cover-letter/019d474f-fb3e-7000-99cc-46f8c5262d05', selector: 'h1' },
  { name: 'portfolio-index', route: '/portfolio', selector: 'h1' },
  { name: 'portfolio-preview', route: '/portfolio/preview', selector: 'h1' },
  { name: 'studios-index', route: '/studios', selector: 'h1' },
  { name: 'studios-detail', route: '/studios/019d0c3f-0e45-7000-9ab9-dc945f28ad59', selector: 'h1' },
  { name: 'studios-analytics', route: '/studios/analytics', selector: 'h1' },
  { name: 'interview-index', route: '/interview', selector: 'h1' },
  { name: 'interview-session', route: '/interview/session?id=019d474e-b501-7000-bf5b-90b8fb574384', selector: 'h1' },
  { name: 'interview-history', route: '/interview/history', selector: 'h1' },
  { name: 'skills-index', route: '/skills', selector: 'h1' },
  { name: 'skills-pathways', route: '/skills/pathways', selector: 'h1' },
  { name: 'automation-index', route: '/automation', selector: 'h1' },
  { name: 'automation-email', route: '/automation/email', selector: 'h1' },
  { name: 'automation-job-apply', route: '/automation/job-apply', selector: 'h1' },
  { name: 'automation-scraper', route: '/automation/scraper', selector: 'h1' },
  { name: 'automation-runs-index', route: '/automation/runs', selector: 'h1' },
  { name: 'automation-run-detail', route: '/automation/runs/019d4595-27a3-7000-965a-53438df6de2c', selector: 'h1' },
  { name: 'ai-chat', route: '/ai/chat', selector: 'h1' },
  { name: 'ai-dashboard', route: '/ai/dashboard', selector: 'h1' },
  { name: 'settings', route: '/settings', selector: 'h1' },
  { name: 'gamification', route: '/gamification', selector: 'h1' },
  { name: 'docs-api', route: '/docs/api', selector: 'h1' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
await context.addCookies([
  {
    name: 'bao_api_key',
    value: authKey,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  },
]);

const page = await context.newPage();
const report = [];

for (const item of routes) {
  const url = `${baseUrl}${item.route}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => null);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  const alerts = await page.locator('[role="alert"], .alert-error').allInnerTexts().catch(() => []);
  const screenshotPath = `${outputDir}/${item.name}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  report.push({
    name: item.name,
    route: item.route,
    url,
    finalUrl: page.url(),
    title,
    h1,
    alerts,
    screenshotPath,
  });
}

writeFileSync(`${outputDir}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify({ outputDir, count: report.length }, null, 2));
