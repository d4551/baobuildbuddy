import { API_ERROR_NETWORK_REQUEST_FAILED, HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@bao/shared";
import { config } from "../../config/env";
import type { FetchPageResult } from "./smart-field-mapper-contracts";

export const wait = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(), delayMs);
    if (
      typeof timer === "object" &&
      timer !== null &&
      "unref" in timer &&
      typeof timer.unref === "function"
    ) {
      timer.unref();
    }
  });

const isRetryableFetchFailure = (result: FetchPageResult): boolean => {
  if (result.ok) {
    return false;
  }
  if (typeof result.statusCode !== "number") {
    return true;
  }
  return result.statusCode === 429 || result.statusCode >= HTTP_STATUS_INTERNAL_SERVER_ERROR;
};

const fetchPage = (url: string): Promise<FetchPageResult> =>
  fetch(url, {
    signal: AbortSignal.timeout(config.smartFieldMapperFetchTimeoutMs),
    headers: {
      "User-Agent": config.smartFieldMapperUserAgent,
    },
  }).then(
    async (response) => {
      if (!response.ok) {
        return {
          ok: false,
          statusCode: response.status,
          message: `HTTP ${response.status}`,
        } satisfies FetchPageResult;
      }

      return {
        ok: true,
        html: await response.text(),
      } satisfies FetchPageResult;
    },
    () =>
      ({
        ok: false,
        message: API_ERROR_NETWORK_REQUEST_FAILED,
      }) satisfies FetchPageResult,
  );

export const fetchPageWithRetry = (params: {
  url: string;
  attemptsRemaining: number;
  delayMs: number;
}): Promise<FetchPageResult> =>
  fetchPage(params.url).then(async (result) => {
    if (!isRetryableFetchFailure(result) || params.attemptsRemaining <= 1) {
      return result;
    }

    await wait(params.delayMs);
    return fetchPageWithRetry({
      ...params,
      attemptsRemaining: params.attemptsRemaining - 1,
      delayMs: params.delayMs * 2,
    });
  });
