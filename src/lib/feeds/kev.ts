import { cacheLife } from "next/cache";
import { fetchJson, type FeedResult } from "./http";

export const KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

interface RawKev {
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: {
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    dateAdded: string;
    shortDescription: string;
    requiredAction: string;
    dueDate: string;
    knownRansomwareCampaignUse: string;
  }[];
}

export interface KevEntry {
  cveID: string;
  vendor: string;
  product: string;
  name: string;
  dateAdded: string;
  dueDate: string;
  description: string;
  ransomware: boolean;
}

export interface KevSummary {
  catalogVersion: string;
  dateReleased: string;
  total: number;
  addedLast7Days: number;
  addedLast30Days: number;
  ransomwareLinked: number;
  topVendors: { vendor: string; count: number }[];
  topVendors90d: { vendor: string; count: number }[];
  additionsByWeek: { week: string; count: number }[];
  recent: KevEntry[];
}

const DAY = 86_400_000;

function topCounts(values: string[], n: number) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([vendor, count]) => ({ vendor, count }));
}

/**
 * CISA Known Exploited Vulnerabilities catalog.
 * The raw feed is ~2 MB, so we fetch it server-side, reduce it to a small
 * summary and cache only that summary (hourly).
 */
export async function getKevSummary(): Promise<FeedResult<KevSummary>> {
  "use cache";
  const fetchedAt = new Date().toISOString();
  try {
    const raw = await fetchJson<RawKev>(KEV_URL);
    cacheLife("hours");
    const now = Date.now();
    const vulns = raw.vulnerabilities;
    const ageDays = (d: string) => (now - Date.parse(`${d}T00:00:00Z`)) / DAY;

    // 12 weekly buckets of additions, oldest first
    const additionsByWeek = Array.from({ length: 12 }, (_, i) => {
      const start = 7 * (11 - i);
      const end = start + 7;
      const weekStart = new Date(now - end * DAY + DAY).toISOString().slice(5, 10);
      return {
        week: weekStart,
        count: vulns.filter((v) => ageDays(v.dateAdded) >= start && ageDays(v.dateAdded) < end).length,
      };
    });

    const recent = [...vulns]
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || b.cveID.localeCompare(a.cveID))
      .slice(0, 25)
      .map<KevEntry>((v) => ({
        cveID: v.cveID,
        vendor: v.vendorProject,
        product: v.product,
        name: v.vulnerabilityName,
        dateAdded: v.dateAdded,
        dueDate: v.dueDate,
        description: v.shortDescription,
        ransomware: v.knownRansomwareCampaignUse === "Known",
      }));

    return {
      ok: true,
      fetchedAt,
      data: {
        catalogVersion: raw.catalogVersion,
        dateReleased: raw.dateReleased,
        total: raw.count ?? vulns.length,
        addedLast7Days: vulns.filter((v) => ageDays(v.dateAdded) < 7).length,
        addedLast30Days: vulns.filter((v) => ageDays(v.dateAdded) < 30).length,
        ransomwareLinked: vulns.filter((v) => v.knownRansomwareCampaignUse === "Known").length,
        topVendors: topCounts(vulns.map((v) => v.vendorProject), 10),
        topVendors90d: topCounts(
          vulns.filter((v) => ageDays(v.dateAdded) < 90).map((v) => v.vendorProject),
          8,
        ),
        additionsByWeek,
        recent,
      },
    };
  } catch (err) {
    cacheLife("minutes"); // retry soon if the feed was unreachable
    return { ok: false, fetchedAt, error: (err as Error).message };
  }
}
