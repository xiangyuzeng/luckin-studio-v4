import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTask, getAccountById, getSetting } from '@/lib/db';
import { getKieConfig, kieVeoGenerate, kieCreateTask, KieConfig } from '@/lib/kie';
import { injectBrandConstraints } from '@/lib/brand-constraints';
import { isVeoModel, getModelPath, ModelKey } from '@/lib/kie-models';

// ---------------------------------------------------------------------------
// POST /api/video/generate – start video generation
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      model,
      prompt,
      promptId,
      aspectRatio = '9:16',
      duration = 8,
      quality,
      inputImageUrl,
      secondImageUrl,
      accountId,
    } = body;

    // --- Validate required fields ------------------------------------------
    if (!model) {
      return NextResponse.json(
        { error: 'Missing required field: model' },
        { status: 400 },
      );
    }
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 },
      );
    }

    // --- Resolve KIE config ------------------------------------------------
    // Prefer the account's API key if an accountId is provided, otherwise
    // fall back to the default setting or environment variable.
    let config: KieConfig;

    if (accountId) {
      const account = getAccountById(accountId);
      if (account && account.api_key) {
        const base = getKieConfig();
        config = { ...base, apiKey: account.api_key };
      } else {
        config = getKieConfig();
      }
    } else {
      const settingsKey = getSetting('kie_api_key');
      if (settingsKey) {
        const base = getKieConfig();
        config = { ...base, apiKey: settingsKey };
      } else {
        config = getKieConfig();
      }
    }

    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'KIE API key not configured. Please set KIE_API_KEY or configure an account.' },
        { status: 400 },
      );
    }

    // --- Inject brand constraints ------------------------------------------
    const enhancedPrompt = injectBrandConstraints(prompt);

    // --- Determine model path & source type --------------------------------
    const isImage = !!inputImageUrl;
    const modelPath = getModelPath(model as ModelKey, isImage);
    const sourceType = isImage ? 'image' : 'text';

    // --- Generate task ID ---------------------------------------------------
    const taskId = uuidv4();

    let kieTaskId: string;

    try {
      if (isVeoModel(model)) {
        // --- Veo-specific generation -----------------------------------------
        kieTaskId = await kieVeoGenerate(config, {
          prompt: enhancedPrompt,
          model: model as string,
          aspectRatio,
          duration,
          imageUrls: [
            ...(inputImageUrl ? [inputImageUrl] : []),
            ...(secondImageUrl ? [secondImageUrl] : []),
          ],
        });
      } else {
        // --- Generic Market model (Sora, Kling, etc.) -----------------------
        if (!modelPath) {
          return NextResponse.json(
            { error: `Unsupported model or mode: ${model} (image=${isImage})` },
            { status: 400 },
          );
        }

        kieTaskId = await kieCreateTask(config, modelPath, {
          prompt: enhancedPrompt,
          aspect_ratio: aspectRatio,
          duration,
          ...(inputImageUrl ? { input_image_url: inputImageUrl } : {}),
          ...(quality ? { quality } : {}),
        });
      }

      // --- Store task in DB ------------------------------------------------
      const task = createTask({
        id: taskId,
        kie_task_id: kieTaskId,
        model,
        model_path: modelPath ?? null,
        prompt,
        prompt_id: promptId ?? null,
        source_type: sourceType,
        input_image_url: inputImageUrl ?? null,
        aspect_ratio: aspectRatio,
        duration_seconds: duration,
        status: 'processing',
        progress: 0,
        account_id: accountId ?? null,
      });

      return NextResponse.json({
        taskId: task.id,
        kieTaskId,
        status: 'processing',
      });
    } catch (genError) {
      // --- Store failed task so the UI can show the error -------------------
      const errorMessage = genError instanceof Error ? genError.message : 'Unknown generation error';

      createTask({
        id: taskId,
        kie_task_id: null,
        model,
        model_path: modelPath ?? null,
        prompt,
        prompt_id: promptId ?? null,
        source_type: sourceType,
        input_image_url: inputImageUrl ?? null,
        aspect_ratio: aspectRatio,
        duration_seconds: duration,
        status: 'failed',
        progress: 0,
        error_message: errorMessage,
        account_id: accountId ?? null,
      });

      return NextResponse.json(
        { error: `Video generation failed: ${errorMessage}`, taskId },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error('POST /api/video/generate error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to start video generation: ${message}` },
      { status: 500 },
    );
  }
}
