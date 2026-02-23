import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, getSetting, getAccountById } from '@/lib/db';
import { getKieConfig, kieRecordInfo, kieVeoRecordInfo } from '@/lib/kie';
import { normalizeKieStatus } from '@/lib/kie-status';
import { isVeoModel } from '@/lib/kie-models';

// ---------------------------------------------------------------------------
// GET /api/video/status/[taskId] – check video task status
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId parameter' },
        { status: 400 },
      );
    }

    // --- Look up task in DB ------------------------------------------------
    const task = getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 },
      );
    }

    // --- If already terminal, return cached result -------------------------
    if (task.status === 'completed' || task.status === 'failed') {
      return NextResponse.json({
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        resultUrl: task.result_url,
        errorMessage: task.error_message,
        model: task.model,
        prompt: task.prompt,
        createdAt: task.created_at,
      });
    }

    // --- Poll KIE for current status ---------------------------------------
    if (!task.kie_task_id) {
      return NextResponse.json({
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        resultUrl: task.result_url,
        errorMessage: task.error_message,
        model: task.model,
        prompt: task.prompt,
        createdAt: task.created_at,
      });
    }

    // --- Resolve KIE config (same logic as generate endpoint) ---------------
    let config = getKieConfig();

    if (task.account_id) {
      const account = getAccountById(task.account_id);
      if (account?.api_key) {
        config = { ...config, apiKey: account.api_key };
      }
    }

    if (!config.apiKey) {
      const settingsKey = getSetting('kie_api_key');
      if (settingsKey) {
        config = { ...config, apiKey: settingsKey };
      }
    }

    if (!config.apiKey) {
      return NextResponse.json({
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        resultUrl: task.result_url,
        errorMessage: 'No API key configured. Please set one in Settings.',
        model: task.model,
        prompt: task.prompt,
        createdAt: task.created_at,
      });
    }

    let kieResponse: any;

    try {
      if (isVeoModel(task.model)) {
        kieResponse = await kieVeoRecordInfo(config, task.kie_task_id);
      } else {
        kieResponse = await kieRecordInfo(config, task.kie_task_id);
      }
    } catch (pollError) {
      console.error(`Failed to poll KIE for task ${taskId}:`, pollError);
      return NextResponse.json({
        taskId: task.id,
        status: task.status,
        progress: task.progress,
        resultUrl: task.result_url,
        errorMessage: pollError instanceof Error ? `Poll error: ${pollError.message}` : 'Poll failed',
        model: task.model,
        prompt: task.prompt,
        createdAt: task.created_at,
      });
    }

    // --- Normalize KIE status and update DB --------------------------------
    const normalized = normalizeKieStatus(kieResponse);

    const updated = updateTask(task.id, {
      status: normalized.status,
      progress: normalized.progress,
      result_url: normalized.resultUrl,
      error_message: normalized.errorMessage,
    });

    const finalTask = updated ?? task;

    return NextResponse.json({
      taskId: finalTask.id,
      status: finalTask.status,
      progress: finalTask.progress,
      resultUrl: finalTask.result_url,
      errorMessage: finalTask.error_message,
      model: finalTask.model,
      prompt: finalTask.prompt,
      createdAt: finalTask.created_at,
    });
  } catch (error) {
    console.error('GET /api/video/status/[taskId] error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to check task status: ${message}` },
      { status: 500 },
    );
  }
}
