export interface KieConfig {
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
}

export interface KieTaskInput {
  prompt: string;
  aspect_ratio?: string;
  duration?: number;
  image_urls?: string[];
  [key: string]: unknown;
}

export interface KieTaskResult {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl: string | null;
  errorMessage: string | null;
}

export interface KieCreateTaskResponse {
  taskId: string;
}

export interface KieChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
