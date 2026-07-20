import { Database } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { automationSettingsSchema } from "@bao/shared/schemas/settings.schema";
import { DEFAULT_PROFILE_ID, DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { initializeDatabase } from "./init";

const transientDatabases: Database[] = [];

const createTransientDatabase = (): Database => {
  const sqlite = new Database(":memory:");
  transientDatabases.push(sqlite);
  return sqlite;
};

afterEach(() => {
  for (const sqlite of transientDatabases.splice(0)) {
    sqlite.close();
  }
});

describe("initializeDatabase", () => {
  test("creates singleton rows with valid default automation settings", () => {
    const sqlite = createTransientDatabase();

    initializeDatabase(sqlite);

    const settingsRow = sqlite
      .query("SELECT id, automation_settings FROM settings WHERE id = ? LIMIT 1")
      .get(DEFAULT_SETTINGS_ID) as
      | {
          id: string;
          automation_settings: string;
        }
      | undefined;
    const authRow = sqlite
      .query("SELECT id FROM auth WHERE id = ? LIMIT 1")
      .get(DEFAULT_PROFILE_ID) as { id: string } | undefined;
    const gamificationRow = sqlite
      .query("SELECT id FROM gamification WHERE id = ? LIMIT 1")
      .get(DEFAULT_PROFILE_ID) as { id: string } | undefined;
    const userProfileRow = sqlite
      .query("SELECT id FROM user_profile WHERE id = ? LIMIT 1")
      .get(DEFAULT_PROFILE_ID) as { id: string } | undefined;

    expect(settingsRow?.id).toBe(DEFAULT_SETTINGS_ID);
    expect(authRow?.id).toBe(DEFAULT_PROFILE_ID);
    expect(gamificationRow?.id).toBe(DEFAULT_PROFILE_ID);
    expect(userProfileRow?.id).toBe(DEFAULT_PROFILE_ID);

    const parsedAutomationSettings = automationSettingsSchema.safeParse(
      settingsRow ? JSON.parse(settingsRow.automation_settings) : undefined,
    );
    expect(parsedAutomationSettings.success).toBe(true);
    if (!parsedAutomationSettings.success) {
      return;
    }

    expect(parsedAutomationSettings.data.jobProviders).toBeDefined();
    expect(parsedAutomationSettings.data.jobProviders?.hitmarkerEnabled).toBe(true);
    const hitmarkerPortal = parsedAutomationSettings.data.jobProviders?.gamingPortals?.find(
      (portal) => portal.id === "hitmarker",
    );
    expect(hitmarkerPortal?.enabled).toBe(true);
  });
});
