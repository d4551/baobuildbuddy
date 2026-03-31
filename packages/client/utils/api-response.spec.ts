import { expect, it } from "vitest";
import {
  hasApiResponseError,
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
