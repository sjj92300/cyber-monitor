import { cacheLife } from "next/cache";
import { fetchJson, sleep, type FeedResult } from "./http";

const NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const WINDOW_DAYS = 7;

type Severity = "CRITICAL" | "HIGH";

interface RawNvd {
  totalResults: number;
  vulnerabilities: {
    cve: {
      id: string;
      published: string;
      lastModified: string;
      vulnStatus: string;
      descriptions: { lang: string; value: string }[];
      metrics?: Record<
        string,
        { type: string; cvssData: { baseScore: number; baseSeverity?: string; vectorString: string } }[]
      >;
      weaknesses?: { description: { lang: string; value: string }[] }[];
    };
  }[];
}

export interface NvdCve {
  id: string;
  published: string;
  severity: Severity;
  score: number | null;
  vector: string | null;
  cwe: string | null;
  status: string;
  description: string;
}

export interface NvdSummary {
  windowDays: number;
  criticalCount: number;
  highCount: number;
  cves: NvdCve[];
}

/** NVD wants timestamps like 2026-10-23T00:00:00.000 (no Z). */
const nvdDate = (d: Date) => d.toISOString().replace("Z", "");

function pickScore(metrics: RawNvd["vulnerabilities"][number]["cve"]["metrics"]) {
  for (const key of ["cvssMetricV31", "cvssMetricV30", "cvssMetricV40"]) {
    const list = metrics?.[key];
    if (list?.length) {
      const m = list.find((x) => x.type === "Primary") ?? list[0];
      return { score: m.cvssData.baseScore, vector: m.cvssData.vectorString };
    }
  }
  return { score: null, vector: null };
}

async function fetchSeverity(severity: Severity, start: Date, end: Date) {
  const params = new URLSearchParams({
    cvssV3Severity: severity,
    pubStartDate: nvdDate(start),
    pubEndDate: nvdDate(end),
    resultsPerPage: "2000",
  });
  const raw = await fetchJson<RawNvd>(`${NVD_API}?${params}`, { timeoutMs: 30_000, retries: 2 });
  return {
    total: raw.totalResults,
    cves: raw.vulnerabilities.map<NvdCve>(({ cve }) => {
      const { score, vector } = pickScore(cve.metrics);
      const cwe = cve.weaknesses?.[0]?.description.find((d) => d.lang === "en")?.value ?? null;
      return {
        id: cve.id,
        published: cve.published,
        severity,
        score,
        vector,
        cwe: cwe && cwe.startsWith("CWE-") ? cwe : null,
        status: cve.vulnStatus,
        description: cve.descriptions.find((d) => d.lang === "en")?.value ?? "",
      };
    }),
  };
}

/**
 * Critical + High CVEs published in the last 7 days from the NVD CVE API 2.0.
 * No API key: the public limit is 5 requests / 30 s, so the two requests are
 * made sequentially with a pause and the reduced result is cached for hours.
 */
export async function getRecentCves(): Promise<FeedResult<NvdSummary>> {
  "use cache";
  const fetchedAt = new Date().toISOString();
  try {
    const end = new Date();
    const start = new Date(end.getTime() - WINDOW_DAYS * 86_400_000);
    const critical = await fetchSeverity("CRITICAL", start, end);
    await sleep(1200);
    const high = await fetchSeverity("HIGH", start, end);
    cacheLife("hours");
    const cves = [...critical.cves, ...high.cves]
      .sort((a, b) => b.published.localeCompare(a.published))
      .slice(0, 150)
      .map((c) => ({ ...c, description: c.description.slice(0, 400) }));
    return {
      ok: true,
      fetchedAt,
      data: {
        windowDays: WINDOW_DAYS,
        criticalCount: critical.total,
        highCount: high.total,
        cves,
      },
    };
  } catch (err) {
    cacheLife("minutes");
    return { ok: false, fetchedAt, error: (err as Error).message };
  }
}
