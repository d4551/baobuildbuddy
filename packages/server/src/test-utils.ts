import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export interface ApiResponseEnvelope<T> {
  status: number;
  body: T;
}

export interface AppRequestHandler {
  handle(request: Request): Response | Promise<Response>;
}

export function createTestDbPath(prefix: string): string {
  const testDbPath = join(tmpdir(), `bao-${prefix}`, `${crypto.randomUUID()}.db`);
  mkdirSync(dirname(testDbPath), { recursive: true });
  return testDbPath;
}

export async function requestJson<T>(
  app: AppRequestHandler,
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<ApiResponseEnvelope<T>> {
  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

  return {
    status: response.status,
    body: (await response.json()) as T,
  };
}
