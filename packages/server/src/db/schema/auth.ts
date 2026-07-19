import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auth = sqliteTable("auth", {
  id: text("id").primaryKey().default(DEFAULT_PROFILE_ID),
  apiKeyHash: text("api_key_hash"),
  apiKeyCreatedAt: text("api_key_created_at"),
  apiKeyExpiresAt: text("api_key_expires_at"),
  apiKeyRevokedAt: text("api_key_revoked_at"),
});
