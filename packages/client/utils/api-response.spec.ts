import { expect, it } from "vitest";
import {
  hasApiResponseError,
  readRequiredApiPayload,
  requireApiResponseData,
  requireApiResponsePayload,
  unwrapApiResponsePayload,
} from "./api-response";

it("unwraps repo-standard data envelopes", () => {
  expect(unwrapApiResponsePayload({ data: { id: "studio-1" } })).toEqual({ id: "studio-1" });
});

it("preserves raw array payloads", () => {
  expect(requireApiResponsePayload([{ id: "studio-1" }], "fallback")).toEqual([{ id: "studio-1" }]);
});

it("rejects repo-standard error envelopes", () => {
  expect(() => requireApiResponsePayload({ error: "failed" }, "fallback")).toThrow("fallback");
  expect(hasApiResponseError({ error: "failed" })).toBe(true);
});

it("rejects non-object payloads", () => {
  expect(() => requireApiResponsePayload("invalid", "fallback")).toThrow("fallback");
});

it("requireApiResponseData returns typed data and formats errors", () => {
  expect(requireApiResponseData({ data: { ok: true } }, "fallback")).toEqual({ ok: true });
  expect(() =>
    requireApiResponseData({ data: null, error: "boom" }, "fallback", (error, fallback) =>
      typeof error === "string" ? error : fallback,
    ),
  ).toThrow("boom");
});

it("readRequiredApiPayload rejects error envelopes", async () => {
  await expect(readRequiredApiPayload(Promise.resolve({ error: "nope" }), "fallback")).rejects.toThrow(
    "fallback",
  );
  await expect(readRequiredApiPayload(Promise.resolve({ data: [1, 2] }), "fallback")).resolves.toEqual([
    1, 2,
  ]);
});
