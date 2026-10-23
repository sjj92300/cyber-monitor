/**
 * Small fetch helper used by every threat-intel feed.
 * Adds a timeout, a descriptive User-Agent and one retry with backoff,
 * so a slow upstream never hangs a render.
 */
const USER_AGENT =
  "cyber-monitor/1.0 (portfolio SOC dashboard; server-side cached fetch)";

export async function fetchJson<T>(
  url: string,
  { timeoutMs = 20_000, retries = 1 }: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Result wrapper so the UI can show a friendly error instead of crashing. */
export type FeedResult<T> =
  | { ok: true; data: T; fetchedAt: string }
  | { ok: false; error: string; fetchedAt: string };
