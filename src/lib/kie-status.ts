/**
 * KIE.AI Status Normalisation
 *
 * The KIE gateway wraps many upstream providers (Veo, Sora, Kling, etc.) and
 * each one uses slightly different field names and status strings.  This module
 * normalises every variant into a single, predictable shape that the rest of
 * Luckin Studio v4 can rely on.
 *
 * Modelled after the Kenwei AIGC server.js (lines 396-432).
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The three canonical lifecycle states a generation task can be in. */
export type NormalizedStatus = 'processing' | 'completed' | 'failed';

/** Uniform result returned by {@link normalizeKieStatus}. */
export interface KieTaskResult {
  status: NormalizedStatus;
  progress: number;
  resultUrl: string | null;
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// Status normalisation
// ---------------------------------------------------------------------------

/**
 * Turn the raw JSON returned by any KIE record-info endpoint into a
 * {@link KieTaskResult}.
 *
 * The function checks `successFlag`, then falls back to a battery of status
 * field names (`state`, `status`, `task_status`, `taskStatus`) and maps
 * their string values to the three canonical states.
 */
export function normalizeKieStatus(json: any): KieTaskResult {
  const data  = json?.data ?? json ?? {};
  const successFlag: number | undefined = data?.successFlag ?? json?.successFlag;

  const stateRaw =
    data?.state ??
    data?.status ??
    data?.task_status ??
    data?.taskStatus ??
    json?.status;
  const state = String(stateRaw ?? '').toLowerCase();

  let status: NormalizedStatus;

  if (
    successFlag === 1 ||
    state === 'success' ||
    state === 'succeed' ||
    state === 'completed' ||
    state === 'done'
  ) {
    status = 'completed';
  } else if (
    successFlag === 2 ||
    successFlag === 3 ||
    state === 'failed' ||
    state === 'error' ||
    state === 'fail'
  ) {
    status = 'failed';
  } else {
    status = 'processing';
  }

  const progress: number =
    status === 'completed'
      ? 1
      : (data?.progress ?? json?.data?.response?.progress ?? 0);

  return {
    status,
    progress,
    resultUrl: extractResultUrl(json),
    errorMessage: status === 'failed' ? extractErrorMessage(json) : null,
  };
}

// ---------------------------------------------------------------------------
// Result URL extraction
// ---------------------------------------------------------------------------

/**
 * Walk through the many possible locations where KIE stashes a result URL
 * and return the first truthy string found, or `null`.
 */
export function extractResultUrl(json: any): string | null {
  const data     = json?.data ?? json ?? {};
  const response = data?.response ?? data?.result ?? {};

  const candidates: unknown[] = [
    response?.resultUrls?.[0],
    response?.result_urls?.[0],
    response?.urls?.[0],
    data?.resultUrls?.[0],
    data?.result_urls?.[0],
    data?.urls?.[0],
    data?.videoUrl,
    data?.video_url,
    data?.task_result?.videos?.[0]?.url,
    data?.taskResult?.videos?.[0]?.url,
    data?.url,
    response?.videoUrl,
    response?.video_url,
    response?.videos?.[0]?.url,
  ];

  for (const c of candidates) {
    if (c && typeof c === 'string') return c;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Error message extraction
// ---------------------------------------------------------------------------

/**
 * Try the most common locations for an error description in a KIE response
 * and return the first truthy string, or `null`.
 */
export function extractErrorMessage(json: any): string | null {
  const data = json?.data ?? json ?? {};

  const candidates: unknown[] = [
    data?.errorMessage,
    data?.error_message,
    data?.message,
    data?.response?.errorMessage,
    json?.error?.message,
    json?.msg,
  ];

  for (const c of candidates) {
    if (c && typeof c === 'string') return c;
  }

  return null;
}
