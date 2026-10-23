import { cacheLife } from "next/cache";
import { fetchJson, type FeedResult } from "./http";

const FEODO_URL = "https://feodotracker.abuse.ch/downloads/ipblocklist.json";

interface RawFeodo {
  ip_address: string;
  port: number;
  status: string;
  as_name: string | null;
  country: string | null;
  first_seen: string;
  last_online: string | null;
  malware: string;
}

export interface FeodoSummary {
  total: number;
  online: number;
  byMalware: { name: string; count: number }[];
  byCountry: { country: string; count: number }[];
  recent: RawFeodo[];
}

/** abuse.ch Feodo Tracker botnet C2 blocklist (no key required). */
export async function getFeodoSummary(): Promise<FeedResult<FeodoSummary>> {
  "use cache";
  const fetchedAt = new Date().toISOString();
  try {
    const rows = await fetchJson<RawFeodo[]>(FEODO_URL);
    cacheLife("hours");
    const count = (keys: string[]) => {
      const m = new Map<string, number>();
      keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      ok: true,
      fetchedAt,
      data: {
        total: rows.length,
        online: rows.filter((r) => r.status === "online").length,
        byMalware: count(rows.map((r) => r.malware)).slice(0, 8).map(([name, c]) => ({ name, count: c })),
        byCountry: count(rows.map((r) => r.country ?? "??")).slice(0, 8).map(([country, c]) => ({ country, count: c })),
        recent: [...rows].sort((a, b) => b.first_seen.localeCompare(a.first_seen)).slice(0, 15),
      },
    };
  } catch (err) {
    cacheLife("minutes");
    return { ok: false, fetchedAt, error: (err as Error).message };
  }
}
