export declare const AUTOMATION_RUNS_TABLE_NAME = "automation_runs";
export declare const SETTINGS_TABLE_NAME = "settings";
export declare const JOBS_TABLE_NAME = "jobs";
export declare const STUDIOS_TABLE_NAME = "studios";
export declare const AUTH_TABLE_NAME = "auth";
export declare const AUTOMATION_RUNS_REQUIRED_COLUMNS: {
    readonly exit_code: "INTEGER";
    readonly timed_out: "INTEGER NOT NULL DEFAULT 0";
    readonly aborted: "INTEGER NOT NULL DEFAULT 0";
    readonly execution_ms: "INTEGER";
};
export declare const SETTINGS_REQUIRED_COLUMNS: {
    readonly ai_routing: `TEXT DEFAULT '${string}'`;
    readonly email_transport_settings: `TEXT DEFAULT '${string}'`;
    readonly email_transport_password: "TEXT";
};
export declare const JOBS_REQUIRED_COLUMNS: {
    readonly enrichment: "TEXT";
};
export declare const AUTH_REQUIRED_COLUMNS: {
    readonly api_key_hash: "TEXT";
    readonly api_key_created_at: "TEXT";
    readonly api_key_expires_at: "TEXT";
    readonly api_key_revoked_at: "TEXT";
};
export declare const STUDIOS_REQUIRED_COLUMNS: {
    readonly enrichment: "TEXT";
};
