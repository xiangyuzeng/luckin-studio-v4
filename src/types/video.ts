export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SourceType = 'text' | 'image';

export interface VideoTask {
  id: string;
  kie_task_id: string | null;
  model: string;
  model_path: string | null;
  prompt: string;
  prompt_id: string | null;
  source_type: SourceType;
  input_image_url: string | null;
  aspect_ratio: string;
  duration_seconds: number;
  status: VideoStatus;
  progress: number;
  result_url: string | null;
  error_message: string | null;
  account_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface VideoGenerateRequest {
  model: string;
  prompt: string;
  promptId?: string;
  aspectRatio?: string;
  duration?: number;
  quality?: string;
  inputImageUrl?: string;
  secondImageUrl?: string;
  accountId?: string;
}

export interface VideoStatusResponse {
  taskId: string;
  status: VideoStatus;
  progress: number;
  resultUrl: string | null;
  errorMessage: string | null;
  model: string;
  prompt: string;
  createdAt: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  completedToday: number;
}
