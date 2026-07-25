import { describe, expect, test } from "bun:test";
import { collectBiomeSoftenerRatchetViolations } from "./validate-biome-softener-ratchet";

describe("collectBiomeSoftenerRatchetViolations", () => {
  test("passes zero-softener config", () => {
    const sample = `{ "linter": { "enabled": true }, "overrides": [] }`;
    expect(collectBiomeSoftenerRatchetViolations(sample)).toHaveLength(0);
  });

  test("flags any off softener", () => {
    expect(
      collectBiomeSoftenerRatchetViolations(`"a": "off"`).some((v) => v.message.includes('"off"')),
    ).toBe(true);
  });

  test("flags enabled=false", () => {
    expect(
      collectBiomeSoftenerRatchetViolations(`"enabled": false`).some((v) =>
        v.message.includes("enabled=false"),
      ),
    ).toBe(true);
  });

  test("flags warn/info introduction", () => {
    expect(
      collectBiomeSoftenerRatchetViolations(`"rule": "warn"`).some((v) =>
        v.message.includes("warn"),
      ),
    ).toBe(true);
  });
});
