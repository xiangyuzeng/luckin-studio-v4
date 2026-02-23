import { NextRequest, NextResponse } from 'next/server';
import { getTasks } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/video/tasks – list video tasks with optional filters
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || undefined;
    const model = searchParams.get('model') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = getTasks({
      status,
      model,
      page,
      limit: Math.min(limit, 100), // Cap at 100
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/video/tasks error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch tasks: ${message}` },
      { status: 500 },
    );
  }
}
