import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getPrompts, createPrompt } from '@/lib/db';

// ---------------------------------------------------------------------------
// Helper – parse JSON string fields into arrays
// ---------------------------------------------------------------------------

function parseJsonFields(prompt: Record<string, unknown>): Record<string, unknown> {
  const jsonFields = ['elements', 'shot_list', 'negative_prompts', 'keywords'];
  const result = { ...prompt };

  for (const field of jsonFields) {
    const value = result[field];
    if (typeof value === 'string') {
      try {
        result[field] = JSON.parse(value);
      } catch {
        // If it's not valid JSON, leave as-is
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// GET /api/prompts – list prompts with filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const customParam = searchParams.get('custom');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const custom = customParam !== null
      ? customParam === 'true'
      : undefined;

    const { prompts, total } = getPrompts({ category, search, custom, page, limit });

    const parsed = prompts.map((p) => parseJsonFields(p as unknown as Record<string, unknown>));

    return NextResponse.json({ prompts: parsed, total, page, limit });
  } catch (error) {
    console.error('GET /api/prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/prompts – create a custom prompt
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = {
      id: body.id || uuidv4(),
      category: body.category || 'custom',
      title_en: body.title_en || '',
      title_cn: body.title_cn || '',
      description: body.description || '',
      style: body.style ?? null,
      camera: body.camera ?? null,
      lighting: body.lighting ?? null,
      setting: body.setting ?? null,
      duration_seconds: body.duration_seconds ?? 8,
      aspect_ratio: body.aspect_ratio ?? '9:16',
      focus: body.focus ?? null,
      cuts: body.cuts ?? 4,
      elements: body.elements ? JSON.stringify(body.elements) : null,
      shot_list: body.shot_list ? JSON.stringify(body.shot_list) : null,
      motion: body.motion ?? null,
      ending: body.ending ?? null,
      text_overlay: body.text_overlay ?? null,
      audio: body.audio ?? null,
      negative_prompts: body.negative_prompts ? JSON.stringify(body.negative_prompts) : null,
      keywords: body.keywords ? JSON.stringify(body.keywords) : null,
    };

    const created = createPrompt(data);
    const parsed = parseJsonFields(created as unknown as Record<string, unknown>);

    return NextResponse.json(parsed, { status: 201 });
  } catch (error) {
    console.error('POST /api/prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 },
    );
  }
}
