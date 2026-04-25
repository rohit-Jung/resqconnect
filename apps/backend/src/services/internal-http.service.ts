import axios, { AxiosError } from 'axios';

export async function postJsonWithRetry<TResponse>(
  url: string,
  {
    headers,
    body,
    timeoutMs,
    retries,
    backoffMs,
  }: {
    headers?: Record<string, string>;
    body: unknown;
    timeoutMs: number;
    retries: number;
    backoffMs: number;
  }
): Promise<{ ok: true; data: TResponse } | { ok: false; error: string }> {
  let lastErr = 'request_failed';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await axios.post<TResponse>(url, body, {
        headers,
        timeout: timeoutMs,
        validateStatus: () => true,
      });

      if (resp.status >= 200 && resp.status < 300) {
        return { ok: true, data: resp.data };
      }

      lastErr = `http_${resp.status}`;
    } catch (e) {
      const err = e as AxiosError;
      lastErr =
        err.code === 'ECONNABORTED'
          ? 'timeout'
          : err.message || 'request_failed';
    }

    if (attempt < retries) {
      // Linear backoff is enough here; we only need a small jitter buffer.
      const delay = backoffMs * (attempt + 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return { ok: false, error: lastErr };
}
