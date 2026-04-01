import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readConfig, shouldUsePrettyLogTransport } from "./env";

const originalHost = Bun.env.HOST;
const originalDisableAuth = Bun.env.BAO_DISABLE_AUTH;

beforeEach(() => {
  Bun.env.HOST = undefined;
  Bun.env.BAO_DISABLE_AUTH = undefined;
});

afterEach(() => {
  if (originalHost === undefined) {
    Bun.env.HOST = undefined;
  } else {
    Bun.env.HOST = originalHost;
  }

  if (originalDisableAuth === undefined) {
    Bun.env.BAO_DISABLE_AUTH = undefined;
  } else {
    Bun.env.BAO_DISABLE_AUTH = originalDisableAuth;
  }
});

describe("config.disableAuth", () => {
  test("does not disable auth just because the host is loopback", () => {
    Bun.env.HOST = "127.0.0.1";

    const config = readConfig();

    expect(config.disableAuth).toBe(false);
  });

  test("disables auth only when explicitly configured", () => {
    Bun.env.BAO_DISABLE_AUTH = "true";

    const config = readConfig();

    expect(config.disableAuth).toBe(true);
  });
});

describe("pretty log transport gating", () => {
  test("enables pretty logging for Bun-driven development processes", () => {
    expect(shouldUsePrettyLogTransport("", "/opt/homebrew/bin/bun", "")).toBe(true);
  });

  test("disables pretty logging for packaged desktop server executables", () => {
    expect(
      shouldUsePrettyLogTransport(undefined, "/Applications/BaoBuildBuddy/bao-desktop-server"),
    ).toBe(false);
  });

  test("disables pretty logging for production runtimes", () => {
    expect(shouldUsePrettyLogTransport("production", "/opt/homebrew/bin/bun")).toBe(false);
  });

  test("disables pretty logging for test runtimes", () => {
    expect(shouldUsePrettyLogTransport("test", "/opt/homebrew/bin/bun", "1")).toBe(false);
  });
});
