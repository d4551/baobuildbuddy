import z from "zod";
import { SCHEMA_MAX_LENGTH_SHORT } from "../constants/schema-limits";

/**
 * Health payload contract served by `GET /api/health`.
 *
 * The server declares the same shape as a TypeBox `HealthResponse` model so it
 * lands in the OpenAPI document. This Zod mirror is the contract for consumers
 * that must *recognise* our backend rather than merely serve it — notably the
 * dev-stack identity probe, which has to distinguish our server from any other
 * process that happens to hold the advertised port.
 *
 * `packages/server/src/routes/core-routes.test.ts` asserts the live response
 * satisfies this schema, so the two representations cannot drift silently.
 */
export const healthResponseSchema = z.object({
  status: z.string().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  timestamp: z.string().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  database: z.string().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  uptime: z.number(),
});

/** Health payload as served by `GET /api/health`. */
export type HealthResponse = z.infer<typeof healthResponseSchema>;
