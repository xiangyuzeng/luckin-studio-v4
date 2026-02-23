import { NextResponse } from 'next/server';
import { getDb, getTaskStats } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const taskStats = getTaskStats();

    const totalPrompts = (db.prepare('SELECT COUNT(*) AS cnt FROM prompts').get() as { cnt: number }).cnt;
    const totalAccounts = (db.prepare('SELECT COUNT(*) AS cnt FROM accounts').get() as { cnt: number }).cnt;

    return NextResponse.json({
      totalPrompts,
      activeTasks: taskStats.pending + taskStats.processing,
      completedToday: taskStats.completedToday,
      totalAccounts,
    });
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 },
    );
  }
}
