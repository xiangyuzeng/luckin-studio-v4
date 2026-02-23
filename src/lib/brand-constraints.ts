export const BRAND_CONSTRAINTS = {
  forbidden: [
    'NO human faces visible',
    'NO people (full body or partial)',
    'NO hands or fingers clearly shown',
    'NO external brand logos',
    'NO price tags or text overlays on screen',
  ],
  required: {
    aspectRatio: '9:16',
    duration: 8,
    minCuts: 4,
    focus: 'Deep focus F/11+, entire frame sharp, no bokeh',
    motion: 'Constant subtle motion, no static frames',
    style: 'Hyper-realistic textures, premium product UGC aesthetic',
  },
  brandElements: {
    primaryColor: '#0066CC',
    darkColor: '#004C99',
    accentColor: '#00A0E9',
    theme: 'blue-white minimalist',
  },
  negativePrompts: [
    'faces', 'people', 'hands', 'fingers', 'text overlays',
    'subtitles', 'price tags', 'watermarks', 'blur', 'bokeh',
    'cartoon', 'low-res', 'extra logos',
  ],
} as const;

/**
 * Appends brand constraint block to a user prompt.
 * Injects forbidden items, required style/focus/motion, and negative prompts
 * so every generated video adheres to Luckin brand guidelines.
 */
export function injectBrandConstraints(userPrompt: string): string {
  const constraintBlock = [
    '',
    '--- BRAND CONSTRAINTS ---',
    '',
    'FORBIDDEN:',
    ...BRAND_CONSTRAINTS.forbidden.map((f) => `  - ${f}`),
    '',
    'REQUIRED STYLE:',
    `  - Focus: ${BRAND_CONSTRAINTS.required.focus}`,
    `  - Motion: ${BRAND_CONSTRAINTS.required.motion}`,
    `  - Style: ${BRAND_CONSTRAINTS.required.style}`,
    `  - Minimum cuts: ${BRAND_CONSTRAINTS.required.minCuts}`,
    '',
    'NEGATIVE PROMPTS:',
    `  ${BRAND_CONSTRAINTS.negativePrompts.join(', ')}`,
    '',
    '--- END CONSTRAINTS ---',
  ].join('\n');

  return `${userPrompt.trim()}\n${constraintBlock}`;
}

/**
 * Merges user-supplied negative prompts with brand-mandated negatives.
 * Returns a deduplicated array (case-insensitive comparison).
 */
export function buildNegativePrompt(userNegatives?: string[]): string[] {
  const brandNegatives: string[] = [...BRAND_CONSTRAINTS.negativePrompts];

  if (!userNegatives || userNegatives.length === 0) {
    return brandNegatives;
  }

  const seen = new Set<string>(brandNegatives.map((n) => n.toLowerCase()));
  const merged: string[] = [...brandNegatives];

  for (const neg of userNegatives) {
    const lower = neg.toLowerCase().trim();
    if (lower && !seen.has(lower)) {
      seen.add(lower);
      merged.push(neg.trim());
    }
  }

  return merged;
}
