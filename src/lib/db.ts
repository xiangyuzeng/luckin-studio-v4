import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './db-schema';
import { seedPrompts } from './db-seed';

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Vercel serverless: /tmp is the only writable directory
  const isVercel = !!process.env.VERCEL;
  const dbDir = isVercel
    ? '/tmp/data'
    : path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'luckin-studio.db');
  _db = new Database(dbPath);

  // Performance & integrity pragmas
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Run schema migrations
  runMigrations(_db);

  // Seed prompts if the table is empty
  const count = _db.prepare('SELECT COUNT(*) AS cnt FROM prompts').get() as { cnt: number };
  if (count.cnt === 0) {
    seedPrompts(_db);
  }

  return _db;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Prompt {
  id: string;
  category: string;
  title_en: string;
  title_cn: string;
  description: string;
  style: string | null;
  camera: string | null;
  lighting: string | null;
  setting: string | null;
  duration_seconds: number;
  aspect_ratio: string;
  focus: string | null;
  cuts: number;
  elements: string | null;
  shot_list: string | null;
  motion: string | null;
  ending: string | null;
  text_overlay: string | null;
  audio: string | null;
  negative_prompts: string | null;
  keywords: string | null;
  is_custom: number;
  created_at: number;
  updated_at: number;
}

export interface VideoTask {
  id: string;
  kie_task_id: string | null;
  model: string;
  model_path: string | null;
  prompt: string;
  prompt_id: string | null;
  source_type: string;
  input_image_url: string | null;
  aspect_ratio: string;
  duration_seconds: number;
  status: string;
  progress: number;
  result_url: string | null;
  error_message: string | null;
  account_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface Account {
  id: string;
  name: string;
  api_key: string;
  is_primary: number;
  daily_quota: number;
  used_today: number;
  last_reset: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: number;
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

export function getPrompts(filters?: {
  category?: string;
  search?: string;
  custom?: boolean;
  page?: number;
  limit?: number;
}): { prompts: Prompt[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters?.category) {
    conditions.push('category = @category');
    params.category = filters.category;
  }
  if (filters?.search) {
    conditions.push('(title_en LIKE @search OR title_cn LIKE @search OR description LIKE @search)');
    params.search = `%${filters.search}%`;
  }
  if (filters?.custom !== undefined) {
    conditions.push('is_custom = @is_custom');
    params.is_custom = filters.custom ? 1 : 0;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM prompts ${where}`).get(params) as { cnt: number }).cnt;
  const prompts = db.prepare(`SELECT * FROM prompts ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset }) as Prompt[];

  return { prompts, total };
}

export function getPromptById(id: string): Prompt | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as Prompt | undefined;
  return row ?? null;
}

export function createPrompt(data: Omit<Prompt, 'created_at' | 'updated_at' | 'is_custom'>): Prompt {
  const db = getDb();
  db.prepare(`
    INSERT INTO prompts (
      id, category, title_en, title_cn, description,
      style, camera, lighting, setting,
      duration_seconds, aspect_ratio, focus, cuts,
      elements, shot_list, motion, ending,
      text_overlay, audio, negative_prompts, keywords,
      is_custom
    ) VALUES (
      @id, @category, @title_en, @title_cn, @description,
      @style, @camera, @lighting, @setting,
      @duration_seconds, @aspect_ratio, @focus, @cuts,
      @elements, @shot_list, @motion, @ending,
      @text_overlay, @audio, @negative_prompts, @keywords,
      1
    )
  `).run(data);

  return getPromptById(data.id)!;
}

export function searchPrompts(query: string): Prompt[] {
  const db = getDb();
  const pattern = `%${query}%`;
  return db.prepare(
    'SELECT * FROM prompts WHERE title_en LIKE ? OR title_cn LIKE ? OR description LIKE ? ORDER BY created_at DESC'
  ).all(pattern, pattern, pattern) as Prompt[];
}

// ---------------------------------------------------------------------------
// Video Tasks
// ---------------------------------------------------------------------------

export function createTask(data: Pick<VideoTask, 'id' | 'model' | 'prompt'> & Partial<VideoTask>): VideoTask {
  const db = getDb();
  db.prepare(`
    INSERT INTO video_tasks (
      id, kie_task_id, model, model_path, prompt, prompt_id,
      source_type, input_image_url, aspect_ratio, duration_seconds,
      status, progress, result_url, error_message, account_id
    ) VALUES (
      @id, @kie_task_id, @model, @model_path, @prompt, @prompt_id,
      @source_type, @input_image_url, @aspect_ratio, @duration_seconds,
      @status, @progress, @result_url, @error_message, @account_id
    )
  `).run({
    id: data.id,
    kie_task_id: data.kie_task_id ?? null,
    model: data.model,
    model_path: data.model_path ?? null,
    prompt: data.prompt,
    prompt_id: data.prompt_id ?? null,
    source_type: data.source_type ?? 'text',
    input_image_url: data.input_image_url ?? null,
    aspect_ratio: data.aspect_ratio ?? '9:16',
    duration_seconds: data.duration_seconds ?? 8,
    status: data.status ?? 'pending',
    progress: data.progress ?? 0,
    result_url: data.result_url ?? null,
    error_message: data.error_message ?? null,
    account_id: data.account_id ?? null,
  });

  return getTaskById(data.id)!;
}

export function updateTask(id: string, updates: Partial<Omit<VideoTask, 'id' | 'created_at'>>): VideoTask | null {
  const db = getDb();
  const fields = Object.keys(updates).filter((k) => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getTaskById(id);

  const setClauses = fields.map((f) => `${f} = @${f}`);
  setClauses.push('updated_at = unixepoch()');

  db.prepare(`UPDATE video_tasks SET ${setClauses.join(', ')} WHERE id = @id`).run({ ...updates, id });
  return getTaskById(id);
}

export function getTaskById(id: string): VideoTask | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM video_tasks WHERE id = ?').get(id) as VideoTask | undefined;
  return row ?? null;
}

export function getTasks(filters?: {
  status?: string;
  model?: string;
  page?: number;
  limit?: number;
}): { tasks: VideoTask[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters?.status) {
    conditions.push('status = @status');
    params.status = filters.status;
  }
  if (filters?.model) {
    conditions.push('model = @model');
    params.model = filters.model;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM video_tasks ${where}`).get(params) as { cnt: number }).cnt;
  const tasks = db.prepare(`SELECT * FROM video_tasks ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset }) as VideoTask[];

  return { tasks, total };
}

export function getTaskStats(): {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  completedToday: number;
} {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS cnt FROM video_tasks').get() as { cnt: number }).cnt;
  const completed = (db.prepare("SELECT COUNT(*) AS cnt FROM video_tasks WHERE status = 'completed'").get() as { cnt: number }).cnt;
  const pending = (db.prepare("SELECT COUNT(*) AS cnt FROM video_tasks WHERE status = 'pending'").get() as { cnt: number }).cnt;
  const processing = (db.prepare("SELECT COUNT(*) AS cnt FROM video_tasks WHERE status = 'processing'").get() as { cnt: number }).cnt;

  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const completedToday = (db.prepare(
    "SELECT COUNT(*) AS cnt FROM video_tasks WHERE status = 'completed' AND updated_at >= ?"
  ).get(todayStart) as { cnt: number }).cnt;

  return { total, completed, pending, processing, completedToday };
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export function getAccounts(): Account[] {
  const db = getDb();
  return db.prepare('SELECT * FROM accounts ORDER BY is_primary DESC, created_at ASC').all() as Account[];
}

export function getAccountById(id: string): Account | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined;
  return row ?? null;
}

export function createAccount(data: Pick<Account, 'id' | 'name' | 'api_key'> & Partial<Account>): Account {
  const db = getDb();
  db.prepare(`
    INSERT INTO accounts (id, name, api_key, is_primary, daily_quota, used_today, last_reset, notes)
    VALUES (@id, @name, @api_key, @is_primary, @daily_quota, @used_today, @last_reset, @notes)
  `).run({
    id: data.id,
    name: data.name,
    api_key: data.api_key,
    is_primary: data.is_primary ?? 0,
    daily_quota: data.daily_quota ?? 50,
    used_today: data.used_today ?? 0,
    last_reset: data.last_reset ?? null,
    notes: data.notes ?? null,
  });

  return getAccountById(data.id)!;
}

export function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'created_at'>>): Account | null {
  const db = getDb();
  const fields = Object.keys(data).filter((k) => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getAccountById(id);

  const setClauses = fields.map((f) => `${f} = @${f}`);
  setClauses.push('updated_at = unixepoch()');

  db.prepare(`UPDATE accounts SET ${setClauses.join(', ')} WHERE id = @id`).run({ ...data, id });
  return getAccountById(id);
}

export function deleteAccount(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | null {
  // Environment variable override (critical for Vercel where DB is ephemeral)
  const envMap: Record<string, string> = {
    kie_api_key: 'KIE_API_KEY',
    kie_base_url: 'KIE_BASE_URL',
    default_model: 'DEFAULT_MODEL',
  };
  const envKey = envMap[key];
  if (envKey && process.env[envKey]) {
    return process.env[envKey]!;
  }

  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (@key, @value, unixepoch())
    ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = unixepoch()
  `).run({ key, value });
}

export function getAllSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
