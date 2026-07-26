/**
 * Guards the one place the RPA capability issue codes are spelled out twice.
 *
 * `rpaCapabilityIssueCodeSchema` must be a literal tuple: building it with
 * `RPA_CAPABILITY_ISSUE_CODES.map(...)` produces a plain array whose TypeBox
 * `Static` collapses to `never`, silently widening the capability response.
 * This test keeps RPA_CAPABILITY_ISSUE_CODES the single source of truth by
 * failing the moment a code is added on one side only.
 */
import { RPA_CAPABILITY_ISSUE_CODES } from "@bao/shared/constants/automation";
import { describe, expect, test } from "bun:test";
import { rpaCapabilityIssueCodeSchema } from "./automation-route-contracts";

const schemaIssueCodes = (): string[] =>
  rpaCapabilityIssueCodeSchema.anyOf.map((member) => String(member.const));

describe("RPA capability issue code schema parity", () => {
  test("schema literals match RPA_CAPABILITY_ISSUE_CODES exactly", () => {
    expect([...schemaIssueCodes()].sort()).toEqual([...RPA_CAPABILITY_ISSUE_CODES].sort());
  });

  test("schema declares every issue code exactly once", () => {
    const codes = schemaIssueCodes();
    expect(new Set(codes).size).toBe(codes.length);
  });
});
