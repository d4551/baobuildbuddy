import { describe, expect, test } from "bun:test";
import { createDevStackRuntime } from "./dev-stack";

describe("createDevStackRuntime", () => {
  test("uses CLI port flags ahead of environment defaults", () => {
    const runtime = createDevStackRuntime(["--server-port", "3100", "--client-port", "3101"], {
      SERVER_PORT: "3000",
      CLIENT_PORT: "3001",
      HOST: "0.0.0.0",
    });

    expect(runtime.serverPort).toBe(3100);
    expect(runtime.clientPort).toBe(3101);
    expect(runtime.serverEnv.PORT).toBe("3100");
    expect(runtime.clientEnv.NUXT_PUBLIC_API_BASE).toBe("http://localhost:3100");
    expect(runtime.clientEnv.NUXT_PUBLIC_WS_BASE).toBe("http://localhost:3100");
  });

  test("supports inline CLI flags", () => {
    const runtime = createDevStackRuntime(["--server-port=3200", "--client-port=3201"], {});

    expect(runtime.serverPort).toBe(3200);
    expect(runtime.clientPort).toBe(3201);
  });

  test("falls back to environment values when CLI flags are absent", () => {
    const runtime = createDevStackRuntime([], {
      SERVER_PORT: "3300",
      CLIENT_PORT: "3301",
      NUXT_HOST: "127.0.0.1",
      HOST: "0.0.0.0",
    });

    expect(runtime.serverPort).toBe(3300);
    expect(runtime.clientPort).toBe(3301);
    expect(runtime.clientHost).toBe("127.0.0.1");
    expect(runtime.serverEnv.CORS_ORIGINS).toContain("http://localhost:3301");
  });
});
