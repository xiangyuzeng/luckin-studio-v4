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
    // Gracefully degrade — return zeros instead of 500
    return NextResponse.json({
      totalPrompts: 0,
      activeTasks: 0,
      completedToday: 0,
      totalAccounts: 0,
    });
  }
}
