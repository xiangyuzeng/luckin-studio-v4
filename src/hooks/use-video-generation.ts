'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVideoStore } from '@/stores/video-store';
import type { VideoGenerateRequest, VideoStatusResponse, VideoTask } from '@/types/video';

interface GenerateResponse {
  taskId: string;
  kieTaskId: string;
  status: string;
}

async function generateVideo(data: VideoGenerateRequest): Promise<GenerateResponse> {
  const res = await fetch('/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to generate video' }));
    throw new Error(error.error || error.message || 'Failed to generate video');
  }
  return res.json();
}

async function fetchVideoStatus(taskId: string): Promise<VideoStatusResponse> {
  const res = await fetch(`/api/video/status/${taskId}`);
  if (!res.ok) throw new Error('Failed to fetch video status');
  return res.json();
}

async function fetchActiveTasks(): Promise<{ tasks: VideoTask[] }> {
  const res = await fetch('/api/video/tasks?status=processing');
  if (!res.ok) throw new Error('Failed to fetch active tasks');
  return res.json();
}

export function useVideoGenerate() {
  const addTask = useVideoStore((s) => s.addTask);

  return useMutation({
    mutationFn: generateVideo,
    onSuccess: (data, variables) => {
      addTask({
        id: data.taskId,
        kieTaskId: data.kieTaskId || '',
        model: variables.model,
        prompt: variables.prompt,
        status: 'processing',
        progress: 0,
        resultUrl: null,
      });
    },
  });
}

export function useVideoStatus(taskId: string | null) {
  const queryClient = useQueryClient();
  const updateTask = useVideoStore((s) => s.updateTask);
  const lastStatusRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ['videoStatus', taskId],
    queryFn: () => fetchVideoStatus(taskId!),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'completed' || data.status === 'failed')) {
        return false;
      }
      return 5000;
    },
    // NO select callback — side effects in select cause infinite re-render loops
  });

  // Sync query data to Zustand store via useEffect (NOT in select)
  // Only update when status/progress/resultUrl actually change
  const data = query.data;
  useEffect(() => {
    if (!taskId || !data) return;

    // Deduplicate: skip if status hasn't changed
    const statusKey = `${data.status}:${data.progress}:${data.resultUrl ?? ''}`;
    if (lastStatusRef.current === statusKey) return;
    lastStatusRef.current = statusKey;

    updateTask(taskId, {
      status: data.status as 'pending' | 'processing' | 'completed' | 'failed',
      progress: data.progress,
      resultUrl: data.resultUrl ?? null,
    });

    if (data.status === 'completed' || data.status === 'failed') {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  }, [taskId, data?.status, data?.progress, data?.resultUrl, updateTask, queryClient]);

  return query;
}

export function useActiveTasks() {
  return useQuery({
    queryKey: ['tasks', { status: 'processing' }],
    queryFn: fetchActiveTasks,
    refetchInterval: 10000,
  });
}
