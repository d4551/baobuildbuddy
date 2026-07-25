import { describe, expect, test } from "bun:test";
import { collectBiomeSoftenerRatchetViolations } from "./validate-biome-softener-ratchet";

describe("collectBiomeSoftenerRatchetViolations", () => {
  test("passes current-shaped softener counts", () => {
    const sample = `{
      "linter": { "enabled": true },
      "overrides": [
        { "linter": { "enabled": false } },
        { "linter": { "rules": { "security": { "noSecrets": "off" } } } },
        { "linter": { "rules": { "security": { "noSecrets": "off" } } } },
        { "linter": { "rules": { "security": { "noSecrets": "off" } } } },
        { "linter": { "rules": { "performance": { "noBarrelFile": "off" } } } },
        { "linter": { "rules": { "performance": { "noAwaitInLoops": "off" } } } }
      ]
    }`;
    expect(collectBiomeSoftenerRatchetViolations(sample)).toHaveLength(0);
  });

  test("flags growth of off softeners", () => {
    const sample = `"a": "off", "b": "off", "c": "off", "d": "off", "e": "off", "f": "off"`;
    expect(
      collectBiomeSoftenerRatchetViolations(sample).some((v) => v.message.includes('"off"')),
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
