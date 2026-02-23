export interface ShotListItem {
  tStart: string;
  tEnd: string;
  desc: string;
}

export interface Prompt {
  id: string;
  category: PromptCategory;
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
  elements: string[];       // stored as JSON string in DB
  shot_list: ShotListItem[]; // stored as JSON string in DB
  motion: string | null;
  ending: string | null;
  text_overlay: string | null;
  audio: string | null;
  negative_prompts: string[]; // stored as JSON string in DB
  keywords: string[];         // stored as JSON string in DB
  is_custom: boolean;
  created_at: number;
  updated_at: number;
}

export type PromptCategory = 'coffee' | 'specialty' | 'food' | 'pairing' | 'store' | 'seasonal' | 'lifestyle' | 'advanced';

export const PROMPT_CATEGORIES: { value: PromptCategory; label_en: string; label_cn: string }[] = [
  { value: 'coffee', label_en: 'Coffee', label_cn: '咖啡' },
  { value: 'specialty', label_en: 'Specialty', label_cn: '特调' },
  { value: 'food', label_en: 'Food', label_cn: '美食' },
  { value: 'pairing', label_en: 'Pairing', label_cn: '搭配' },
  { value: 'store', label_en: 'Store', label_cn: '门店' },
  { value: 'seasonal', label_en: 'Seasonal', label_cn: '季节' },
  { value: 'lifestyle', label_en: 'Lifestyle', label_cn: '生活方式' },
  { value: 'advanced', label_en: 'Advanced', label_cn: '高级' },
];

export interface GeneratedPrompt {
  title_en: string;
  title_cn: string;
  description: string;
  style: string;
  camera: string;
  lighting: string;
  shot_list: ShotListItem[];
  negative_prompts: string[];
  audio: string;
}

export interface PromptFilters {
  category?: PromptCategory;
  search?: string;
  custom?: boolean;
  page?: number;
  limit?: number;
}
