/**
 * Guards the one place the resume template list is spelled out twice.
 *
 * `resumeTemplateBodySchema` must be a literal tuple: building it with
 * `RESUME_TEMPLATE_OPTIONS.map(...)` produces a plain array whose TypeBox
 * `Static` collapses to `never`, which silently widens every response schema
 * that embeds a template. This test keeps RESUME_TEMPLATE_OPTIONS the single
 * source of truth by failing the moment the two lists diverge.
 */
import { RESUME_TEMPLATE_OPTIONS } from "@bao/shared/constants/resume";
import { describe, expect, test } from "bun:test";
import { resumeTemplateBodySchema } from "./resume-route-response-contracts";

const schemaTemplateValues = (): string[] =>
  resumeTemplateBodySchema.anyOf.map((member) => String(member.const));

describe("resume template response schema parity", () => {
  test("schema literals match RESUME_TEMPLATE_OPTIONS exactly", () => {
    expect([...schemaTemplateValues()].sort()).toEqual([...RESUME_TEMPLATE_OPTIONS].sort());
  });

  test("schema declares every template exactly once", () => {
    const values = schemaTemplateValues();
    expect(new Set(values).size).toBe(values.length);
  });
});
