import { NextRequest, NextResponse } from 'next/server';
import { getSetting, getAccountById } from '@/lib/db';
import { getKieConfig, kieUploadBuffer, kieImageGenerate, waitForKieImageResult } from '@/lib/kie';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const productImage = formData.get('productImage') as File | null;
    const backgroundImage = formData.get('backgroundImage') as File | null;
    const mainText = (formData.get('mainText') as string) || '';
    const subText = (formData.get('subText') as string) || '';
    const extraText1 = (formData.get('extraText1') as string) || '';
    const extraText2 = (formData.get('extraText2') as string) || '';
    const extraText3 = (formData.get('extraText3') as string) || '';
    const description = (formData.get('description') as string) || '';
    const aspectRatio = (formData.get('aspectRatio') as string) || '1:1';
    const resolution = (formData.get('resolution') as string) || '1024';
    const batchCount = Math.min(parseInt(formData.get('batchCount') as string || '1', 10), 4);
    const accountId = formData.get('accountId') as string | null;

    // Resolve KIE config
    let config = getKieConfig();
    if (accountId) {
      const account = getAccountById(accountId);
      if (account?.api_key) config = { ...config, apiKey: account.api_key };
    }
    if (!config.apiKey) {
      const settingsKey = getSetting('kie_api_key');
      if (settingsKey) config = { ...config, apiKey: settingsKey };
    }
    if (!config.apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 400 });
    }

    // Upload images to KIE
    const imageUrls: string[] = [];

    if (productImage) {
      const buffer = Buffer.from(await productImage.arrayBuffer());
      const url = await kieUploadBuffer(config, buffer, productImage.name);
      imageUrls.push(url);
    }

    if (backgroundImage) {
      const buffer = Buffer.from(await backgroundImage.arrayBuffer());
      const url = await kieUploadBuffer(config, buffer, backgroundImage.name);
      imageUrls.push(url);
    }

    // Handle multi-reference images (referenceImage_0 through referenceImage_9)
    for (let i = 0; i < 10; i++) {
      const refImage = formData.get(`referenceImage_${i}`) as File | null;
      if (refImage) {
        const buffer = Buffer.from(await refImage.arrayBuffer());
        const url = await kieUploadBuffer(config, buffer, refImage.name);
        imageUrls.push(url);
      }
    }

    // Build prompt
    const textParts: string[] = [];
    if (mainText) textParts.push(`Main title: ${mainText}`);
    if (subText) textParts.push(`Subtitle: ${subText}`);
    if (extraText1) textParts.push(`Text line 1: ${extraText1}`);
    if (extraText2) textParts.push(`Text line 2: ${extraText2}`);
    if (extraText3) textParts.push(`Text line 3: ${extraText3}`);

    const prompt = [
      description || 'Generate a professional product poster',
      textParts.length > 0 ? `Text to include:\n${textParts.join('\n')}` : '',
      `Aspect ratio: ${aspectRatio}`,
      'Style: Professional product photography, clean layout, modern design',
      'Brand: Luckin Coffee blue (#0066CC) accent, premium aesthetic',
    ].filter(Boolean).join('\n\n');

    // Map aspect ratio to image size
    const res = parseInt(resolution, 10) || 1024;
    const sizeMap: Record<string, string> = {
      '1:1': `${res}x${res}`,
      '2:3': `${Math.round(res * 2 / 3)}x${res}`,
      '3:4': `${Math.round(res * 3 / 4)}x${res}`,
      '9:16': `${Math.round(res * 9 / 16)}x${res}`,
      '16:9': `${res}x${Math.round(res * 9 / 16)}`,
      '4:3': `${res}x${Math.round(res * 3 / 4)}`,
    };
    const imageSize = sizeMap[aspectRatio] || `${res}x${res}`;

    // Generate images (batch)
    const allResults: string[] = [];

    for (let i = 0; i < batchCount; i++) {
      try {
        const { taskId, recordBase } = await kieImageGenerate(config, {
          prompt,
          image_urls: imageUrls,
          size: imageSize,
          n: 1,
        });
        const urls = await waitForKieImageResult(config, recordBase, taskId, 120_000);
        allResults.push(...urls);
      } catch (err) {
        console.error(`Poster batch ${i} failed:`, err);
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json({ error: 'All generation attempts failed' }, { status: 502 });
    }

    return NextResponse.json({ images: allResults });
  } catch (error) {
    console.error('POST /api/poster/generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Poster generation failed' },
      { status: 500 },
    );
  }
}
