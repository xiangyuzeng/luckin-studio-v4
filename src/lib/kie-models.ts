/**
 * KIE.AI Model Path Mappings & Helpers
 *
 * Centralises every model identifier that Luckin Studio v4 supports through
 * the KIE.AI unified gateway.  Each entry carries both text-to-video and
 * image-to-video path slugs (null when the mode is unsupported).
 */

// ---------------------------------------------------------------------------
// Model path registry
// ---------------------------------------------------------------------------

export const KIE_MODELS = {
  veo3:      { text2video: 'veo3/text-to-video',        image2video: null },
  veo3_fast: { text2video: 'veo3_fast/text-to-video',   image2video: null },
  sora2:     { text2video: 'sora-2/text-to-video',      image2video: 'sora-2/image-to-video' },
  sora2_pro: { text2video: 'sora-2-pro/text-to-video',  image2video: 'sora-2-pro/image-to-video' },
  kling26:   { text2video: 'kling-2.6/text-to-video',   image2video: 'kling-2.6/image-to-video' },
} as const;

export type ModelKey = keyof typeof KIE_MODELS;

// ---------------------------------------------------------------------------
// Engine detection helpers
// ---------------------------------------------------------------------------

/** Returns `true` when the model string refers to a Google Veo variant. */
export function isVeoModel(model: string): boolean {
  return model.toLowerCase().startsWith('veo');
}

/** Returns `true` when the model string refers to an OpenAI Sora variant. */
export function isSoraModel(model: string): boolean {
  return model.toLowerCase().startsWith('sora');
}

/** Returns `true` when the model string refers to a Kuaishou Kling variant. */
export function isKlingModel(model: string): boolean {
  return model.toLowerCase().startsWith('kling');
}

// ---------------------------------------------------------------------------
// Path resolver
// ---------------------------------------------------------------------------

/**
 * Look up the KIE gateway path for a given model key and generation mode.
 *
 * @returns The path slug (e.g. `"sora-2/text-to-video"`) or `null` when the
 *          requested mode is not available for that model.
 */
export function getModelPath(model: ModelKey, isImageToVideo: boolean): string | null {
  const entry = KIE_MODELS[model];
  if (!entry) return null;
  return isImageToVideo ? entry.image2video : entry.text2video;
}

// ---------------------------------------------------------------------------
// Aspect-ratio mapping
// ---------------------------------------------------------------------------

/** Map pixel-dimension strings (e.g. `"720x1280"`) to ratio strings expected
 *  by KIE, or pass through values that are already formatted as ratios. */
export function mapAspectRatio(input: string): string {
  const v = (input ?? '').trim();
  if (!v) return '16:9';

  // Pixel-dimension shorthand
  if (v === '720x1280')  return '9:16';
  if (v === '1280x720')  return '16:9';
  if (v === '1024x1024') return '1:1';

  // Already a valid ratio or special keyword
  if (/^\d+:\d+$/.test(v)) return v;
  if (v.toLowerCase() === 'auto') return 'Auto';

  return '16:9';
}

// ---------------------------------------------------------------------------
// Flat model list for UI dropdowns
// ---------------------------------------------------------------------------

export const ALL_MODELS: { label: string; value: ModelKey; engine: string }[] = [
  { label: 'Veo 3',          value: 'veo3',      engine: 'google' },
  { label: 'Veo 3 Fast',     value: 'veo3_fast', engine: 'google' },
  { label: 'Sora 2',         value: 'sora2',     engine: 'openai' },
  { label: 'Sora 2 Pro',     value: 'sora2_pro', engine: 'openai' },
  { label: 'Kling 2.6',      value: 'kling26',   engine: 'kuaishou' },
];
