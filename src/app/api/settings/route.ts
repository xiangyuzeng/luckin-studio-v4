import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSetting } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/settings – return all settings
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    const settings = getAllSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/settings – update one or many settings
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Support two input shapes:
    // 1. { key: "some_key", value: "some_value" }  – single setting
    // 2. { settings: { key1: "val1", key2: "val2" } }  – batch update
    if (body.settings && typeof body.settings === 'object') {
      const entries = Object.entries(body.settings) as [string, string][];

      if (entries.length === 0) {
        return NextResponse.json(
          { error: 'No settings provided' },
          { status: 400 },
        );
      }

      for (const [key, value] of entries) {
        setSetting(key, String(value));
      }

      return NextResponse.json({
        success: true,
        updated: entries.length,
      });
    }

    if (body.key && body.value !== undefined) {
      setSetting(body.key, String(body.value));

      return NextResponse.json({
        success: true,
        key: body.key,
      });
    }

    return NextResponse.json(
      { error: 'Invalid body. Provide { key, value } or { settings: { ... } }' },
      { status: 400 },
    );
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 },
    );
  }
}
