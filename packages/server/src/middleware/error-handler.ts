import { Elysia } from "elysia";

export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not found" };
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation error" };
    }
    // Log internally but don't leak raw error details to the client
    console.error(`[${code}]`, error instanceof Error ? error.message : error);
    set.status = 500;
    return { error: "Internal server error" };
  },
);
