import { NextRequest, NextResponse } from 'next/server';
import { getKieConfig, kieUploadBuffer } from '@/lib/kie';
import { getSetting, getAccountById } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const accountId = formData.get('accountId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Resolve KIE config
    let config = getKieConfig();

    if (accountId) {
      const account = getAccountById(accountId);
      if (account) {
        config = { ...config, apiKey: account.api_key };
      }
    } else {
      const savedKey = getSetting('kie_api_key');
      if (savedKey) {
        config = { ...config, apiKey: savedKey };
      }
    }

    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'No API key configured. Add one in Settings or Accounts.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await kieUploadBuffer(config, buffer, file.name);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
