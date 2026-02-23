import { NextRequest, NextResponse } from 'next/server';
import { getKieConfig, kieChatCompletion } from '@/lib/kie';
import { getSetting } from '@/lib/db';
import { BRAND_CONSTRAINTS } from '@/lib/brand-constraints';

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelHint, imageUrl } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // Resolve config
    let config = getKieConfig();
    const settingsKey = getSetting('kie_api_key');
    if (settingsKey) config = { ...config, apiKey: settingsKey };

    if (!config.apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
    }

    const brandContext = `Brand: Luckin Coffee. Primary color: ${BRAND_CONSTRAINTS.brandElements.primaryColor}. Theme: ${BRAND_CONSTRAINTS.brandElements.theme}. Forbidden: ${BRAND_CONSTRAINTS.forbidden.join('; ')}. Style: ${BRAND_CONSTRAINTS.required.style}.`;

    const systemPrompts: Record<string, string> = {
      veo: `You are a video prompt engineer for Google VEO. Enhance the user's prompt to be more cinematic and detailed. Include camera movements, lighting descriptions, and temporal progression. ${brandContext} Output ONLY the enhanced prompt, nothing else.`,
      sora: `You are a video prompt engineer for OpenAI Sora. Enhance the user's prompt with rich visual detail, camera angles, lighting, and scene composition. Focus on cinematic storytelling. ${brandContext} Output ONLY the enhanced prompt, nothing else.`,
      kling: `You are a video prompt engineer for Kling AI. Enhance the user's prompt with detailed visual descriptions, motion guidance, and atmosphere. ${brandContext} Output ONLY the enhanced prompt, nothing else.`,
      image: `You are an image prompt engineer. Enhance the user's prompt for professional product photography. Include composition, lighting, color palette, and mood details. ${brandContext} Output ONLY the enhanced prompt, nothing else.`,
    };

    const systemMessage = systemPrompts[modelHint || 'veo'] || systemPrompts.veo;

    // Build messages - use vision if imageUrl provided
    const messages: { role: string; content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> }[] = [
      { role: 'system', content: systemMessage },
    ];

    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `Analyze this image and enhance the following prompt based on what you see:\n\n${prompt}` },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const polished = await kieChatCompletion(config, messages);

    return NextResponse.json({ polished: polished.trim() });
  } catch (error) {
    console.error('POST /api/prompts/polish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Polish failed' },
      { status: 500 },
    );
  }
}
