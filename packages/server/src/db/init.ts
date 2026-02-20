import type { Database } from "bun:sqlite";

const TABLE_DEFINITIONS = [
  `CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY DEFAULT 'default',
      name TEXT NOT NULL DEFAULT '',
      email TEXT,
      phone TEXT,
      location TEXT,
      website TEXT,
      linkedin TEXT,
      github TEXT,
      summary TEXT,
      current_role TEXT,
      current_company TEXT,
      years_experience INTEGER,
      technical_skills TEXT DEFAULT '[]',
      soft_skills TEXT DEFAULT '[]',
      gaming_experience TEXT DEFAULT '{}',
      career_goals TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      gemini_api_key TEXT,
      openai_api_key TEXT,
      claude_api_key TEXT,
      huggingface_token TEXT,
      local_model_endpoint TEXT DEFAULT 'http://localhost:8080/v1',
      local_model_name TEXT DEFAULT 'llama3.2',
      preferred_provider TEXT DEFAULT 'local',
      preferred_model TEXT,
      preferred_models TEXT,
      theme TEXT DEFAULT 'bao-light',
      language TEXT DEFAULT 'en',
      notifications TEXT DEFAULT '{"achievements":true,"dailyChallenges":true,"levelUp":true,"jobAlerts":true}',
      automation_settings TEXT DEFAULT '{"headless":true,"defaultTimeout":30,"screenshotRetention":7,"maxConcurrentRuns":1,"defaultBrowser":"chrome","enableSmartSelectors":true,"autoSaveScreenshots":true}',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS auth (
      id TEXT PRIMARY KEY DEFAULT 'default',
      api_key TEXT
    )`,
  `CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      remote INTEGER DEFAULT 0,
      hybrid INTEGER DEFAULT 0,
      salary TEXT,
      description TEXT,
      requirements TEXT,
      technologies TEXT,
      experience_level TEXT,
      type TEXT DEFAULT 'full-time',
      posted_date TEXT,
      url TEXT,
      source TEXT,
      studio_type TEXT,
      game_genres TEXT,
      platforms TEXT,
      content_hash TEXT,
      tags TEXT,
      company_logo TEXT,
      application_url TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS saved_jobs (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      saved_at TEXT NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'applied',
      applied_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      timeline TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Untitled Resume',
      personal_info TEXT,
      summary TEXT,
      experience TEXT DEFAULT '[]',
      education TEXT DEFAULT '[]',
      skills TEXT,
      projects TEXT DEFAULT '[]',
      gaming_experience TEXT,
      template TEXT DEFAULT 'modern',
      theme TEXT DEFAULT 'light',
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS cover_letters (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      job_info TEXT,
      content TEXT DEFAULT '{}',
      template TEXT DEFAULT 'professional',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS portfolio_projects (
      id TEXT PRIMARY KEY,
      portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      technologies TEXT DEFAULT '[]',
      image TEXT,
      live_url TEXT,
      github_url TEXT,
      tags TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      role TEXT,
      platforms TEXT,
      engines TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS interview_sessions (
      id TEXT PRIMARY KEY,
      studio_id TEXT NOT NULL,
      config TEXT,
      questions TEXT DEFAULT '[]',
      responses TEXT DEFAULT '[]',
      final_analysis TEXT,
      status TEXT DEFAULT 'preparing',
      start_time INTEGER,
      end_time INTEGER,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS studios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      website TEXT,
      location TEXT,
      size TEXT,
      type TEXT,
      description TEXT,
      games TEXT DEFAULT '[]',
      technologies TEXT DEFAULT '[]',
      culture TEXT,
      interview_style TEXT,
      remote_work INTEGER,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS gamification (
      id TEXT PRIMARY KEY DEFAULT 'default',
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      achievements TEXT DEFAULT '[]',
      daily_challenges TEXT DEFAULT '{}',
      longest_streak INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      last_active_date TEXT,
      stats TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS skill_mappings (
      id TEXT PRIMARY KEY,
      game_expression TEXT NOT NULL,
      transferable_skill TEXT NOT NULL,
      industry_applications TEXT DEFAULT '[]',
      evidence TEXT DEFAULT '[]',
      confidence INTEGER DEFAULT 50,
      category TEXT,
      demand_level TEXT DEFAULT 'medium',
      ai_generated INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      session_id TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
  `CREATE TABLE IF NOT EXISTS automation_runs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      job_id TEXT,
      user_id TEXT,
      input TEXT,
      output TEXT,
      screenshots TEXT,
      error TEXT,
      progress INTEGER DEFAULT 0,
      current_step INTEGER,
      total_steps INTEGER,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )`,
] as const;

const INDEXES = [
  "CREATE INDEX IF NOT EXISTS jobs_source_idx ON jobs(source)",
  "CREATE INDEX IF NOT EXISTS jobs_posted_date_idx ON jobs(posted_date)",
  "CREATE UNIQUE INDEX IF NOT EXISTS jobs_content_hash_idx ON jobs(content_hash)",
  "CREATE INDEX IF NOT EXISTS saved_jobs_job_id_idx ON saved_jobs(job_id)",
  "CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications(job_id)",
  "CREATE INDEX IF NOT EXISTS portfolio_projects_portfolio_id_idx ON portfolio_projects(portfolio_id)",
  "CREATE INDEX IF NOT EXISTS interview_sessions_studio_id_idx ON interview_sessions(studio_id)",
  "CREATE INDEX IF NOT EXISTS chat_history_session_id_idx ON chat_history(session_id)",
  "CREATE INDEX IF NOT EXISTS chat_history_timestamp_idx ON chat_history(timestamp)",
] as const;

/**
 * Initialize SQLite schema for all supported tables.
 */
export function initializeDatabase(sqlite: Database): void {
  for (const ddl of TABLE_DEFINITIONS) {
    try {
      sqlite.exec(ddl);
    } catch (error) {
      console.error(`Failed to create table: ${error instanceof Error ? error.message : error}`);
    }
  }

  for (const indexSql of INDEXES) {
    try {
      sqlite.exec(indexSql);
    } catch (error) {
      console.error(`Failed to create index: ${error instanceof Error ? error.message : error}`);
    }
  }
}
