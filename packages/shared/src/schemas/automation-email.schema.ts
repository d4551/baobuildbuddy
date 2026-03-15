import z from "zod";
import {
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_EMAIL_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "../constants/schema-limits";
import { isValidEmail } from "../utils/validation";

/**
 * Supported tones for AI-generated email replies.
 */
export const emailResponseToneSchema = z.enum(["professional", "friendly", "concise"]);

/**
 * Request payload for the automation email-response endpoint.
 */
export const emailResponseRequestSchema = z.object({
  subject: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT),
  message: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_EMAIL_MESSAGE),
  sender: z.string().trim().min(1).max(SCHEMA_MAX_LENGTH_SHORT).optional(),
  tone: emailResponseToneSchema.optional(),
  recipientEmail: z
    .string()
    .trim()
    .min(1)
    .max(SCHEMA_MAX_LENGTH_EMAIL)
    .refine((value) => isValidEmail(value), {
      message: "recipientEmail must be a valid email address",
    })
    .optional(),
  deliverAfterGeneration: z.boolean().optional(),
});

/**
 * Successful response payload for the automation email-response endpoint.
 */
export const emailResponseResultSchema = z.object({
  runId: z.string().min(1),
  status: z.literal("success"),
  reply: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  delivered: z.boolean(),
  recipientEmail: z.string().trim().max(SCHEMA_MAX_LENGTH_EMAIL).optional(),
  deliveredAt: z.string().trim().min(1).optional(),
  messageId: z.string().trim().min(1).optional(),
});

/**
 * Email response tone derived from `emailResponseToneSchema`.
 */
export type EmailResponseTone = z.infer<typeof emailResponseToneSchema>;

/**
 * Email response request payload derived from `emailResponseRequestSchema`.
 */
export type EmailResponseRequest = z.infer<typeof emailResponseRequestSchema>;

/**
 * Email response result payload derived from `emailResponseResultSchema`.
 */
export type EmailResponseResult = z.infer<typeof emailResponseResultSchema>;
