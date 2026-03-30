/**
 * Fetch with exponential backoff retry on 429 and 5xx responses.
 * Shared between Vercel serverless functions and the local dev server.
 */
export async function fetchWithRetry(
  url: string,
  opts: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, opts);
      // Don't retry on client errors (except 429 rate limit)
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 8000)));
    }
  }
  throw lastError;
}
