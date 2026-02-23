import { NextResponse } from 'next/server';
import { getKieConfig } from '@/lib/kie';
import { getSetting } from '@/lib/db';

export async function GET() {
  try {
    let config = getKieConfig();
    const settingsKey = getSetting('kie_api_key');
    if (settingsKey) config = { ...config, apiKey: settingsKey };

    if (!config.apiKey) {
      return NextResponse.json({ balance: null, error: 'No API key configured' });
    }

    // Try multiple balance endpoint candidates
    const candidates = [
      `${config.baseUrl}/api/v1/balance`,
      `${config.baseUrl}/api/v1/account/balance`,
      `${config.baseUrl}/api/v1/user/balance`,
    ];

    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          // Try common response shapes
          const balance = data.balance ?? data.credits ?? data.data?.balance ?? data.data?.credits ?? null;
          if (balance !== null && balance !== undefined) {
            return NextResponse.json({ balance: Number(balance) });
          }
        }
      } catch {
        // Try next candidate
      }
    }

    return NextResponse.json({ balance: null });
  } catch (error) {
    console.error('GET /api/usage error:', error);
    return NextResponse.json({ balance: null, error: 'Failed to fetch usage' });
  }
}
