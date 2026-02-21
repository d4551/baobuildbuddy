import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { APP_LANGUAGE_CODES } from "../packages/shared/src/constants/settings";
import { APP_BRAND } from "../packages/shared/src/constants/branding";
import { writeError, writeOutput } from "./utils/cli-output";

type RouteVerificationResult = {
  locale: string;
  route: string;
  status: number;
  heading: string;
  title: string;
};

type RouteVerificationFailure = {
  locale: string;
  route: string;
  status: number;
  reason: string;
};

const defaultVerifyHost = process.env.VERIFY_HOST || "localhost";
const defaultVerifyPort = process.env.VERIFY_PORT || "3001";
const defaultBaseUrl = `http://${defaultVerifyHost}:${defaultVerifyPort}`;
const baseUrl = (process.env.VERIFY_BASE_URL || defaultBaseUrl).replace(/\/$/u, "");
const htmlHeadingPattern = /<h1\b[^>]*>([\s\S]*?)<\/h1>/iu;
const htmlTitlePattern = /<title\b[^>]*>([\s\S]*?)<\/title>/iu;
const htmlMainPattern = /<main\b[^>]*>/iu;
const htmlTagPattern = /<[^>]+>/gu;
const whitespacePattern = /\s+/gu;
const lineSeparator = "-".repeat(72);
const expectedBrandToken = APP_BRAND.name.toLowerCase();

const routePaths = Array.from(new Set(Object.values(APP_ROUTES)));

const normalizeText = (value: string): string =>
  value.replace(htmlTagPattern, " ").replace(whitespacePattern, " ").trim();

const verifyRoute = async (
  locale: string,
  route: string,
): Promise<RouteVerificationResult | RouteVerificationFailure> => {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: {
      "accept-language": locale,
      cookie: `bao-locale=${locale}`,
    },
  });

  if (!response.ok) {
    return {
      locale,
      route,
      status: response.status,
      reason: `Expected 2xx status but received ${response.status}.`,
    };
  }

  const html = await response.text();
  if (route === "/" && !html.toLowerCase().includes(expectedBrandToken)) {
    return {
      locale,
      route,
      status: response.status,
      reason: `Root route did not include expected brand token "${APP_BRAND.name}". Verify VERIFY_HOST/VERIFY_PORT target the BaoBuildBuddy app.`,
    };
  }

  const headingMatch = html.match(htmlHeadingPattern);
  const heading = normalizeText(headingMatch?.[1] ?? "");

  if (heading.length === 0) {
    return {
      locale,
      route,
      status: response.status,
      reason: "No non-empty <h1> heading found in SSR HTML.",
    };
  }

  const titleMatch = html.match(htmlTitlePattern);
  const title = normalizeText(titleMatch?.[1] ?? "");

  if (title.length === 0) {
    return {
      locale,
      route,
      status: response.status,
      reason: "No non-empty <title> found in SSR HTML.",
    };
  }

  const hasMainLandmark = htmlMainPattern.test(html);
  if (!hasMainLandmark) {
    return {
      locale,
      route,
      status: response.status,
      reason: "No <main> landmark found in SSR HTML.",
    };
  }

  return {
    locale,
    route,
    status: response.status,
    heading,
    title,
  };
};

const main = async (): Promise<void> => {
  const successes: RouteVerificationResult[] = [];
  const failures: RouteVerificationFailure[] = [];

  for (const locale of APP_LANGUAGE_CODES) {
    for (const route of routePaths) {
      const result = await verifyRoute(locale, route);
      if ("reason" in result) {
        failures.push(result);
      } else {
        successes.push(result);
      }
    }
  }

  await writeOutput(`Route/content verification against ${baseUrl}`);
  await writeOutput(lineSeparator);
  for (const success of successes) {
    await writeOutput(
      `[ok] ${success.locale.padEnd(5)} ${success.status} ${success.route.padEnd(26)} ${success.heading} | ${success.title}`,
    );
  }

  if (failures.length === 0) {
    await writeOutput(lineSeparator);
    await writeOutput(
      `Verified ${successes.length} localized route renders with non-empty page title, heading, and main landmark.`,
    );
    return;
  }

  await writeError(lineSeparator);
  await writeError("Route/content verification failures:");
  for (const failure of failures) {
    await writeError(
      `[fail] ${failure.locale.padEnd(5)} ${failure.status} ${failure.route.padEnd(26)} ${failure.reason}`,
    );
  }

  process.exit(1);
};

await main();
