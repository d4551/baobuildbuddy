import { BRAND_NAME, EXPECTED_BRAND_TOKEN } from "./verify-pages-env";

export type RouteVerificationResult = {
  locale: string;
  route: string;
  status: number;
  heading: string;
  title: string;
};

export type RouteVerificationFailure = {
  locale: string;
  route: string;
  status: number;
  reason: string;
};

const htmlHeadingPattern = /<h1\b[^>]*>([\s\S]*?)<\/h1>/iu;
const htmlTitlePattern = /<title\b[^>]*>([\s\S]*?)<\/title>/iu;
const htmlMainPattern = /<main\b[^>]*>/iu;
const htmlTagPattern = /<[^>]+>/gu;
const whitespacePattern = /\s+/gu;

const normalizeText = (value: string): string =>
  value.replace(htmlTagPattern, " ").replace(whitespacePattern, " ").trim();

export const createRouteFailure = (
  locale: string,
  route: string,
  status: number,
  reason: string,
): RouteVerificationFailure => ({
  locale,
  route,
  status,
  reason,
});

export const verifyHtmlContent = (
  locale: string,
  route: string,
  status: number,
  html: string,
): RouteVerificationResult | RouteVerificationFailure => {
  if (route === "/" && !html.toLowerCase().includes(EXPECTED_BRAND_TOKEN)) {
    const reason = ['Root route did not include expected brand token "', BRAND_NAME, '".'].join("");
    return createRouteFailure(locale, route, status, reason);
  }

  const headingMatch = html.match(htmlHeadingPattern);
  const heading = normalizeText(headingMatch?.[1] ?? "");
  if (heading.length === 0) {
    return createRouteFailure(
      locale,
      route,
      status,
      "No non-empty <h1> heading found in SSR HTML.",
    );
  }

  const titleMatch = html.match(htmlTitlePattern);
  const title = normalizeText(titleMatch?.[1] ?? "");
  if (title.length === 0) {
    return createRouteFailure(locale, route, status, "No non-empty <title> found in SSR HTML.");
  }

  if (!htmlMainPattern.test(html)) {
    return createRouteFailure(locale, route, status, "No <main> landmark found in SSR HTML.");
  }

  return { locale, route, status, heading, title };
};
