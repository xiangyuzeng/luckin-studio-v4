import type Database from 'better-sqlite3';

const CREATE_PROMPTS_TABLE = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_cn TEXT NOT NULL,
  description TEXT NOT NULL,
  style TEXT,
  camera TEXT,
  lighting TEXT,
  setting TEXT,
  duration_seconds INTEGER DEFAULT 8,
  aspect_ratio TEXT DEFAULT '9:16',
  focus TEXT,
  cuts INTEGER DEFAULT 5,
  elements TEXT,
  shot_list TEXT,
  motion TEXT,
  ending TEXT,
  text_overlay TEXT DEFAULT 'none',
  audio TEXT,
  negative_prompts TEXT,
  keywords TEXT,
  is_custom INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
`;

const CREATE_VIDEO_TASKS_TABLE = `
CREATE TABLE IF NOT EXISTS video_tasks (
  id TEXT PRIMARY KEY,
  kie_task_id TEXT,
  model TEXT NOT NULL,
  model_path TEXT,
  prompt TEXT NOT NULL,
  prompt_id TEXT,
  source_type TEXT DEFAULT 'text',
  input_image_url TEXT,
  aspect_ratio TEXT DEFAULT '9:16',
  duration_seconds INTEGER DEFAULT 8,
  status TEXT DEFAULT 'pending',
  progress REAL DEFAULT 0,
  result_url TEXT,
  error_message TEXT,
  account_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
`;

const CREATE_ACCOUNTS_TABLE = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  daily_quota INTEGER DEFAULT 50,
  used_today INTEGER DEFAULT 0,
  last_reset TEXT,
  notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
`;

const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch())
);
`;

const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);',
  'CREATE INDEX IF NOT EXISTS idx_prompts_custom ON prompts(is_custom);',
  'CREATE INDEX IF NOT EXISTS idx_tasks_status ON video_tasks(status);',
  'CREATE INDEX IF NOT EXISTS idx_tasks_created ON video_tasks(created_at DESC);',
];

export function runMigrations(db: Database.Database): void {
  db.exec(CREATE_PROMPTS_TABLE);
  db.exec(CREATE_VIDEO_TASKS_TABLE);
  db.exec(CREATE_ACCOUNTS_TABLE);
  db.exec(CREATE_SETTINGS_TABLE);

  for (const index of CREATE_INDEXES) {
    db.exec(index);
  }
}
