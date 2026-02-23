import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

interface PromptJson {
  id: string;
  category: string;
  title: { en: string; cn: string };
  description: string;
  style?: string;
  camera?: string;
  lighting?: string;
  setting?: string;
  duration_seconds?: number;
  aspect_ratio?: string;
  focus?: string;
  cuts?: number;
  elements?: string[];
  shot_list?: { tStart: string; tEnd: string; desc: string }[];
  motion?: string;
  ending?: string;
  text?: string;
  audio?: string;
  negative_prompts?: string[];
  keywords?: string[];
}

interface PromptLibrary {
  version: string;
  brand: string;
  prompt_count: number;
  prompts: PromptJson[];
}

export function seedPrompts(db: Database.Database): void {
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'luckin_product_prompt_library.json');

  if (!fs.existsSync(jsonPath)) {
    console.warn(`[db-seed] Prompt library not found at ${jsonPath}, skipping seed.`);
    return;
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const library: PromptLibrary = JSON.parse(raw);

  if (!library.prompts || library.prompts.length === 0) {
    console.warn('[db-seed] No prompts found in library JSON, skipping seed.');
    return;
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO prompts (
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
      @is_custom
    )
  `);

  const insertAll = db.transaction((prompts: PromptJson[]) => {
    for (const p of prompts) {
      insert.run({
        id: p.id,
        category: p.category,
        title_en: p.title.en,
        title_cn: p.title.cn,
        description: p.description,
        style: p.style ?? null,
        camera: p.camera ?? null,
        lighting: p.lighting ?? null,
        setting: p.setting ?? null,
        duration_seconds: p.duration_seconds ?? 8,
        aspect_ratio: p.aspect_ratio ?? '9:16',
        focus: p.focus ?? null,
        cuts: p.cuts ?? 5,
        elements: p.elements ? JSON.stringify(p.elements) : null,
        shot_list: p.shot_list ? JSON.stringify(p.shot_list) : null,
        motion: p.motion ?? null,
        ending: p.ending ?? null,
        text_overlay: p.text ?? 'none',
        audio: p.audio ?? null,
        negative_prompts: p.negative_prompts ? JSON.stringify(p.negative_prompts) : null,
        keywords: p.keywords ? JSON.stringify(p.keywords) : null,
        is_custom: 0,
      });
    }
  });

  insertAll(library.prompts);
  console.log(`[db-seed] Seeded ${library.prompts.length} prompts into database.`);
}
