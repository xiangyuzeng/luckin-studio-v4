/**
 * KIE.AI Unified API Client
 *
 * A TypeScript client for the KIE.AI gateway that powers Luckin Studio v4.
 * Supports video generation (Veo, Sora, Kling), file uploads, and
 * OpenAI-compatible chat completions.
 *
 * Design notes (carried over from the Kenwei AIGC server.js):
 *  - Every network call uses multi-candidate endpoint discovery so the client
 *    keeps working even when KIE renames or reorganises routes.
 *  - Timeout is enforced with `AbortSignal.timeout`.
 *  - All functions are pure (no module-level state) and accept an explicit
 *    {@link KieConfig} so the caller controls credentials and base URL.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Connection settings passed to every KIE helper. */
export interface KieConfig {
  /** KIE API key (sent as `Authorization: Bearer …`). */
  apiKey: string;
  /** Base URL of the KIE gateway (no trailing slash). */
  baseUrl: string;
  /** Per-request timeout in milliseconds. Defaults to 120 000 (2 min). */
  timeoutMs?: number;
}

/**
 * Build a {@link KieConfig} from environment variables.
 *
 * | Variable        | Purpose                                      |
 * | --------------- | -------------------------------------------- |
 * | `KIE_API_KEY`   | Bearer token for authentication               |
 * | `KIE_API_BASE`  | Gateway origin, e.g. `https://api.kie.ai`    |
 */
export function getKieConfig(): KieConfig {
  return {
    apiKey: process.env.KIE_API_KEY || '',
    baseUrl: (process.env.KIE_API_BASE || 'https://api.kie.ai').replace(/\/$/, ''),
    timeoutMs: 120_000,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Standard headers used by most KIE endpoints. */
function authHeaders(apiKey: string, json = true): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

/**
 * Fire a fetch request and parse the response as JSON.
 *
 * Returns a discriminated result so callers can branch on `ok` without
 * exceptions.
 */
async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; json: any }> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

/**
 * Try a list of candidate URLs with the same request options, returning the
 * first successful response.  If every candidate fails an error is thrown.
 *
 * This mirrors the Kenwei pattern where KIE endpoint names are not guaranteed
 * stable across versions.
 */
async function tryEndpoints(
  config: KieConfig,
  candidates: string[],
  options: RequestInit,
): Promise<{ ok: boolean; status: number; json: any }> {
  const timeoutMs = config.timeoutMs ?? 120_000;

  for (const url of candidates) {
    try {
      const result = await fetchJson(url, options, timeoutMs);
      if (result.ok) return result;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `All endpoint candidates failed: [${candidates.join(', ')}]`,
  );
}

// ---------------------------------------------------------------------------
// Task creation (generic Market models: Sora, Kling, etc.)
// ---------------------------------------------------------------------------

/**
 * Create a generation task through the KIE Market (createTask) endpoint.
 *
 * @param config  Connection settings.
 * @param modelPath  Slash-delimited model path, e.g. `"sora-2/text-to-video"`.
 * @param input  Freeform input payload forwarded to KIE (prompt, aspect_ratio, etc.).
 * @returns The upstream task ID.
 */
export async function kieCreateTask(
  config: KieConfig,
  modelPath: string,
  input: Record<string, unknown>,
): Promise<string> {
  const url = `${config.baseUrl}/api/v1/jobs/createTask`;
  const { ok, status, json } = await fetchJson(
    url,
    {
      method: 'POST',
      headers: authHeaders(config.apiKey),
      body: JSON.stringify({ model: modelPath, input }),
    },
    config.timeoutMs ?? 120_000,
  );

  if (!ok) {
    throw new Error(
      `KIE createTask failed (${status}): ${JSON.stringify(json)}`,
    );
  }

  const taskId: string | undefined =
    json?.data?.taskId ??
    json?.data?.task_id ??
    json?.taskId ??
    json?.data?.id;

  if (!taskId) {
    throw new Error(`KIE createTask: missing taskId – ${JSON.stringify(json)}`);
  }

  return taskId;
}

// ---------------------------------------------------------------------------
// Veo-specific generation
// ---------------------------------------------------------------------------

/**
 * Submit a Veo generation request.
 *
 * Tries multiple endpoint candidates (`/veo/generate`, `/veo/create`) and
 * prefixes the returned task ID with `"veo_"` for easy routing in status
 * polling.
 *
 * @returns A task ID prefixed with `"veo_"`.
 */
export async function kieVeoGenerate(
  config: KieConfig,
  params: Record<string, unknown>,
): Promise<string> {
  const candidates = [
    `${config.baseUrl}/api/v1/veo/generate`,
    `${config.baseUrl}/api/v1/veo/create`,
  ];

  const result = await tryEndpoints(config, candidates, {
    method: 'POST',
    headers: authHeaders(config.apiKey),
    body: JSON.stringify(params),
  });

  const json = result.json;
  const taskId: string | undefined =
    json?.data?.taskId ??
    json?.data?.task_id ??
    json?.taskId ??
    json?.task_id;

  if (!taskId) {
    throw new Error(`KIE Veo: missing taskId – ${JSON.stringify(json)}`);
  }

  return taskId.startsWith('veo_') ? taskId : `veo_${taskId}`;
}

// ---------------------------------------------------------------------------
// Record info (status polling)
// ---------------------------------------------------------------------------

/**
 * Poll the generic Market record-info endpoint for task status.
 *
 * @returns The raw JSON response from KIE.  Use `normalizeKieStatus` from
 *          `kie-status.ts` to interpret it.
 */
export async function kieRecordInfo(
  config: KieConfig,
  taskId: string,
): Promise<any> {
  const encoded = encodeURIComponent(taskId);
  const candidates = [
    `${config.baseUrl}/api/v1/jobs/recordInfo?taskId=${encoded}`,
    `${config.baseUrl}/api/v1/jobs/record-info?taskId=${encoded}`,
  ];

  const result = await tryEndpoints(config, candidates, {
    method: 'GET',
    headers: authHeaders(config.apiKey, false),
  });

  return result.json;
}

/**
 * Poll the Veo-specific record-info endpoint.
 *
 * Strips the `"veo_"` prefix before calling KIE, and falls back through
 * four candidate URLs (Veo-specific first, then generic).
 *
 * @returns The raw JSON response from KIE.
 */
export async function kieVeoRecordInfo(
  config: KieConfig,
  taskId: string,
): Promise<any> {
  // Strip "veo_" prefix that we added in kieVeoGenerate
  const cleanId = taskId.replace(/^veo_/i, '');
  const encoded = encodeURIComponent(cleanId);

  const candidates = [
    `${config.baseUrl}/api/v1/veo/record-info?taskId=${encoded}`,
    `${config.baseUrl}/api/v1/veo/recordInfo?taskId=${encoded}`,
    `${config.baseUrl}/api/v1/jobs/recordInfo?taskId=${encoded}`,
    `${config.baseUrl}/api/v1/jobs/record-info?taskId=${encoded}`,
  ];

  const result = await tryEndpoints(config, candidates, {
    method: 'GET',
    headers: authHeaders(config.apiKey, false),
  });

  return result.json;
}

// ---------------------------------------------------------------------------
// File upload
// ---------------------------------------------------------------------------

/**
 * Upload a binary buffer (typically an image) to the KIE file-hosting service.
 *
 * Tries three candidate upload endpoints and extracts the resulting public URL
 * from whichever response shape KIE returns.
 *
 * @param config    Connection settings.
 * @param buffer    Raw file bytes.
 * @param filename  Desired filename, e.g. `"reference.png"`.
 * @returns The publicly-accessible URL of the uploaded file.
 */
export async function kieUploadBuffer(
  config: KieConfig,
  buffer: Buffer | Uint8Array,
  filename: string,
): Promise<string> {
  const candidates = [
    `${config.baseUrl}/api/v1/files/upload`,
    `${config.baseUrl}/api/v1/file/upload`,
    `${config.baseUrl}/api/v1/upload`,
  ];

  const blob = new Blob([new Uint8Array(buffer)]);

  for (const url of candidates) {
    try {
      const form = new FormData();
      form.append('file', blob, filename);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/json',
        },
        body: form,
        signal: AbortSignal.timeout(config.timeoutMs ?? 120_000),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const data = json?.data ?? json;

      const fileUrl: string | undefined =
        data?.url ??
        data?.fileUrl ??
        data?.file_url ??
        data?.downloadUrl ??
        data?.result_url;

      if (fileUrl && typeof fileUrl === 'string') return fileUrl;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    'KIE file upload failed – all candidate endpoints returned errors or an unrecognised response shape.',
  );
}

// ---------------------------------------------------------------------------
// Chat completions (OpenAI-compatible)
// ---------------------------------------------------------------------------

/**
 * Send a non-streaming chat-completion request through KIE's OpenAI-compatible
 * endpoint and return the assistant's text reply.
 *
 * @param config    Connection settings.
 * @param messages  Array of `{ role, content }` chat messages.
 * @param model     Model identifier (defaults to `"gemini-2.5-flash"`).
 * @returns The assistant message content string.
 */
type ChatMessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

export async function kieChatCompletion(
  config: KieConfig,
  messages: { role: string; content: ChatMessageContent }[],
  model?: string,
): Promise<string> {
  const url = `${config.baseUrl}/v1/chat/completions`;
  const { ok, status, json } = await fetchJson(
    url,
    {
      method: 'POST',
      headers: authHeaders(config.apiKey),
      body: JSON.stringify({
        model: model ?? 'gemini-2.5-flash',
        messages,
        stream: false,
      }),
    },
    config.timeoutMs ?? 120_000,
  );

  if (!ok) {
    throw new Error(
      `KIE chat/completions failed (${status}): ${JSON.stringify(json)}`,
    );
  }

  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (content === undefined) {
    throw new Error(
      `KIE chat/completions: unexpected response shape – ${JSON.stringify(json)}`,
    );
  }

  return content;
}

// ---------------------------------------------------------------------------
// Image generation (Gemini / GPT-Image via KIE)
// ---------------------------------------------------------------------------

/**
 * Submit an image generation request.
 * Tries multiple endpoint candidates and returns the taskId + recordBase
 * so the caller knows which polling endpoint to use.
 */
export async function kieImageGenerate(
  config: KieConfig,
  body: Record<string, unknown>,
): Promise<{ taskId: string; recordBase: string }> {
  const candidates = [
    { url: `${config.baseUrl}/api/v1/gpt-image/generate`, recordBase: '/api/v1/gpt-image' },
    { url: `${config.baseUrl}/api/v1/images/generate`, recordBase: '/api/v1/images' },
    { url: `${config.baseUrl}/api/v1/image/generate`, recordBase: '/api/v1/image' },
    { url: `${config.baseUrl}/api/v1/jobs/createTask`, recordBase: '/api/v1/jobs' },
  ];

  for (const { url, recordBase } of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders(config.apiKey),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.timeoutMs ?? 120_000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const data = json?.data ?? json;
      const taskId = data?.taskId ?? data?.task_id ?? data?.id ?? json?.taskId;
      if (taskId) return { taskId: String(taskId), recordBase };
    } catch {
      // try next candidate
    }
  }
  throw new Error('KIE image generate: all endpoint candidates failed');
}

/**
 * Poll image generation status using the recordBase returned by kieImageGenerate.
 */
export async function kieImageRecordInfo(
  config: KieConfig,
  recordBase: string,
  taskId: string,
): Promise<any> {
  const candidates = [
    `${config.baseUrl}${recordBase}/recordInfo?taskId=${taskId}`,
    `${config.baseUrl}${recordBase}/record-info?taskId=${taskId}`,
    `${config.baseUrl}/api/v1/jobs/recordInfo?taskId=${taskId}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next candidate
    }
  }
  throw new Error('KIE image recordInfo: all candidates failed');
}

/**
 * Poll image generation until completion or timeout.
 * Returns an array of result image URLs.
 */
export async function waitForKieImageResult(
  config: KieConfig,
  recordBase: string,
  taskId: string,
  maxWaitMs = 120_000,
): Promise<string[]> {
  const start = Date.now();
  const pollInterval = 2000;

  while (Date.now() - start < maxWaitMs) {
    const json = await kieImageRecordInfo(config, recordBase, taskId);

    // Inline status normalization to avoid circular imports
    const data = json?.data ?? json ?? {};
    const successFlag: number | undefined = data?.successFlag ?? json?.successFlag;
    const stateRaw = data?.state ?? data?.status ?? data?.task_status ?? json?.status;
    const state = String(stateRaw ?? '').toLowerCase();

    const isCompleted =
      successFlag === 1 ||
      state === 'success' || state === 'succeed' ||
      state === 'completed' || state === 'done';

    const isFailed =
      successFlag === 2 || successFlag === 3 ||
      state === 'failed' || state === 'error' || state === 'fail';

    if (isCompleted) {
      const response = data?.response ?? data?.result ?? {};
      const urls: string[] =
        response?.resultUrls ?? response?.result_urls ??
        data?.resultUrls ?? data?.result_urls ??
        data?.urls ?? [];
      if (urls.length > 0) return urls;
      // Try single URL fields
      const singleUrl = data?.url ?? response?.url ?? data?.videoUrl ?? data?.video_url;
      if (singleUrl && typeof singleUrl === 'string') return [singleUrl];
      throw new Error('Image completed but no URLs found in response');
    }

    if (isFailed) {
      const errMsg = data?.errorMessage ?? data?.error_message ?? data?.message ?? 'Image generation failed';
      throw new Error(String(errMsg));
    }

    await new Promise(r => setTimeout(r, pollInterval));
  }

  throw new Error(`Image generation timed out after ${maxWaitMs / 1000}s`);
}
