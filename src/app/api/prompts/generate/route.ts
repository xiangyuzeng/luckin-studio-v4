import { NextRequest, NextResponse } from 'next/server';
import { getKieConfig, kieChatCompletion } from '@/lib/kie';
import { BRAND_CONSTRAINTS } from '@/lib/brand-constraints';

// ---------------------------------------------------------------------------
// POST /api/prompts/generate – AI-powered prompt generation
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const category: string = body.category || 'coffee';
    const brief: string = body.brief || '';
    const count: number = body.count ?? 5;
    const lang: string = body.lang ?? 'en';

    if (!brief) {
      return NextResponse.json(
        { error: 'Missing required field: brief' },
        { status: 400 },
      );
    }

    const config = getKieConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'KIE API key not configured. Please set KIE_API_KEY in environment variables or configure it in Settings.' },
        { status: 400 },
      );
    }

    // Build the system prompt with brand constraints
    const systemPrompt = `You are an expert video prompt engineer for Luckin Coffee (瑞幸咖啡).
Your job is to generate VEO 3.1-optimized video generation prompts for commercial coffee advertising content.

BRAND CONSTRAINTS:
${JSON.stringify(BRAND_CONSTRAINTS, null, 2)}

RULES:
- Generate exactly ${count} unique video prompts
- Each prompt must be optimized for AI video generation (VEO 3.1)
- Follow ALL brand constraints: no human faces, no people, no hands, no external logos
- Focus on product shots, coffee pouring, steam, textures, ingredients, environments
- Use hyper-realistic style with premium product UGC aesthetic
- Default aspect ratio: 9:16 (vertical/portrait for mobile)
- Default duration: 8 seconds with minimum 4 cuts
- Deep focus F/11+, entire frame sharp, no bokeh
- Constant subtle motion, no static frames
- Language: ${lang === 'cn' ? 'Chinese (中文)' : 'English'}

OUTPUT FORMAT:
Return a JSON array of objects. Each object must have:
- "title": short descriptive title
- "description": the full video generation prompt (detailed, cinematic)
- "category": "${category}"
- "style": visual style description
- "camera": camera movement/angle description
- "lighting": lighting setup description
- "setting": environment/location description
- "duration_seconds": ${BRAND_CONSTRAINTS.required.duration}
- "aspect_ratio": "${BRAND_CONSTRAINTS.required.aspectRatio}"
- "cuts": number of cuts (minimum ${BRAND_CONSTRAINTS.required.minCuts})
- "motion": motion description
- "keywords": array of relevant keywords

Return ONLY the JSON array, no markdown formatting, no code blocks.`;

    const userMessage = `Generate ${count} video prompts for Luckin Coffee.
Category: ${category}
Brief: ${brief}`;

    const response = await kieChatCompletion(
      config,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    );

    // Parse the AI response as JSON
    let prompts: unknown[];
    try {
      // Strip potential markdown code fences
      const cleaned = response.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
      prompts = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON', raw: response },
        { status: 502 },
      );
    }

    if (!Array.isArray(prompts)) {
      return NextResponse.json(
        { error: 'AI response is not an array', raw: response },
        { status: 502 },
      );
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('POST /api/prompts/generate error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate prompts: ${message}` },
      { status: 500 },
    );
  }
}
