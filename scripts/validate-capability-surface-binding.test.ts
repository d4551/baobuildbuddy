import { describe, expect, test } from "bun:test";
import { collectMatrixPages } from "./validate-capability-surface-binding";

describe("collectMatrixPages", () => {
  test("extracts page references from the feature-trace-matrix (VACUOUS_GATE_TEST)", () => {
    const matrixPages = collectMatrixPages();
    // The matrix references real page paths — verify extraction works.
    expect(matrixPages.size).toBeGreaterThan(0);
    expect([...matrixPages].every((p) => p.startsWith("packages/client/pages/"))).toBe(true);
  });
});
