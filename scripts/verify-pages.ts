import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { APP_LANGUAGE_CODES } from "../packages/shared/src/constants/settings";

type RouteVerificationResult = {
  locale: string;
  route: string;
  status: number;
  heading: string;
};

type RouteVerificationFailure = {
  locale: string;
  route: string;
  status: number;
  reason: string;
};

const defaultBaseUrl = "http://127.0.0.1:3001";
const baseUrl = (process.env.VERIFY_BASE_URL || defaultBaseUrl).replace(/\/$/u, "");
const htmlHeadingPattern = /<h1\b[^>]*>([\s\S]*?)<\/h1>/iu;
const htmlTagPattern = /<[^>]+>/gu;
const whitespacePattern = /\s+/gu;
const lineSeparator = "-".repeat(72);

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

  return {
    locale,
    route,
    status: response.status,
    heading,
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

  console.log(`Route/content verification against ${baseUrl}`);
  console.log(lineSeparator);
  for (const success of successes) {
    console.log(
      `[ok] ${success.locale.padEnd(5)} ${success.status} ${success.route.padEnd(26)} ${success.heading}`,
    );
  }

  if (failures.length === 0) {
    console.log(lineSeparator);
    console.log(
      `Verified ${successes.length} localized route renders with non-empty page headings.`,
    );
    return;
  }

  console.error(lineSeparator);
  console.error("Route/content verification failures:");
  for (const failure of failures) {
    console.error(
      `[fail] ${failure.locale.padEnd(5)} ${failure.status} ${failure.route.padEnd(26)} ${failure.reason}`,
    );
  }

  process.exit(1);
};

await main();
