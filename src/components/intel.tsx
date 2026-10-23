import { ExternalLink } from "lucide-react";
import { getFeodoSummary } from "@/lib/feeds/feodo";
import { getKevSummary } from "@/lib/feeds/kev";
import { getRecentCves } from "@/lib/feeds/nvd";
import { SimpleBarChart } from "./charts";
import { BarList, Card, FeedError, SourceTag } from "./ui";
import { CveTable } from "./cve-table";

const fetchedLabel = (iso: string) =>
  `Fetched ${new Date(iso).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC · cached hourly`;

export async function KevRecentList({ limit = 6 }: { limit?: number }) {
  const kev = await getKevSummary();
  if (!kev.ok) return <FeedError name="CISA KEV" error={kev.error} />;
  return (
    <ul className="divide-y divide-slate-800/70">
      {kev.data.recent.slice(0, limit).map((v) => (
        <li key={v.cveID} className="py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <a href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`} target="_blank" rel="noreferrer" className="font-mono text-cyan-300 hover:underline">{v.cveID}</a>
            <span className="text-slate-300">{v.vendor} {v.product}</span>
            {v.ransomware && <span className="rounded bg-red-500/15 px-1.5 text-[10px] font-medium uppercase text-red-300 ring-1 ring-red-500/30">Ransomware</span>}
            <span className="ml-auto font-mono text-xs text-slate-500">added {v.dateAdded}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{v.name}</p>
        </li>
      ))}
    </ul>
  );
}

export async function KevSection() {
  const kev = await getKevSummary();
  if (!kev.ok) return <FeedError name="CISA KEV" error={kev.error} />;
  const d = kev.data;
  const stats = [
    ["Catalog entries", d.total],
    ["Added last 7 days", d.addedLast7Days],
    ["Added last 30 days", d.addedLast30Days],
    ["Known ransomware use", d.ransomwareLinked],
  ] as const;
  return (
    <Card
      title={<span className="flex items-center gap-2">CISA Known Exploited Vulnerabilities <SourceTag kind="live" /></span>}
      subtitle={`Catalog version ${d.catalogVersion} · ${fetchedLabel(kev.fetchedAt)}`}
      actions={<a className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline" href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noreferrer">cisa.gov <ExternalLink className="h-3 w-3" /></a>}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-emerald-300">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <p className="mb-2 text-xs font-medium text-slate-300">KEV additions per week (12 weeks)</p>
          <SimpleBarChart data={d.additionsByWeek} xKey="week" color="#34d399" height={200} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-300">Most-listed vendors (all time)</p>
          <BarList items={d.topVendors.map((v) => ({ name: v.vendor, count: v.count }))} color="#34d399" />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-slate-300">Most-listed vendors (last 90 days)</p>
          <BarList items={d.topVendors90d.map((v) => ({ name: v.vendor, count: v.count }))} color="#22d3ee" />
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr><th className="px-3 py-2 text-left">CVE</th><th className="px-3 py-2 text-left">Vendor / product</th><th className="px-3 py-2 text-left">Vulnerability</th><th className="px-3 py-2 text-left">Added</th><th className="px-3 py-2 text-left">Fed. due date</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {d.recent.slice(0, 15).map((v) => (
              <tr key={v.cveID} className="align-top">
                <td className="whitespace-nowrap px-3 py-2"><a href={`https://nvd.nist.gov/vuln/detail/${v.cveID}`} target="_blank" rel="noreferrer" className="font-mono text-cyan-300 hover:underline">{v.cveID}</a></td>
                <td className="px-3 py-2 text-slate-200">{v.vendor}<div className="text-xs text-slate-500">{v.product}</div></td>
                <td className="px-3 py-2 text-slate-300" title={v.description}>{v.name}{v.ransomware && <span className="ml-2 rounded bg-red-500/15 px-1.5 text-[10px] uppercase text-red-300">Ransomware</span>}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">{v.dateAdded}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">{v.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export async function NvdSection() {
  const nvd = await getRecentCves();
  if (!nvd.ok) return <Card title="NVD — recent critical & high CVEs"><FeedError name="the NVD CVE API" error={nvd.error} /></Card>;
  const d = nvd.data;
  return (
    <Card
      title={<span className="flex items-center gap-2">NVD — critical & high CVEs, last {d.windowDays} days <SourceTag kind="live" /></span>}
      subtitle={`${d.criticalCount} critical and ${d.highCount} high (CVSS v3) published · ${fetchedLabel(nvd.fetchedAt)}`}
      actions={<a className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline" href="https://nvd.nist.gov/developers/vulnerabilities" target="_blank" rel="noreferrer">NVD CVE API 2.0 <ExternalLink className="h-3 w-3" /></a>}
    >
      <CveTable cves={d.cves} />
    </Card>
  );
}

export async function FeodoSection() {
  const f = await getFeodoSummary();
  if (!f.ok) return <Card title="abuse.ch Feodo Tracker"><FeedError name="Feodo Tracker" error={f.error} /></Card>;
  const d = f.data;
  return (
    <Card
      title={<span className="flex items-center gap-2">abuse.ch Feodo Tracker — botnet C2 blocklist <SourceTag kind="live" /></span>}
      subtitle={`${d.total} C2 servers listed, ${d.online} currently online · ${fetchedLabel(f.fetchedAt)}`}
      actions={<a className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline" href="https://feodotracker.abuse.ch/" target="_blank" rel="noreferrer">feodotracker.abuse.ch <ExternalLink className="h-3 w-3" /></a>}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-300">By malware family</p>
          <BarList items={d.byMalware} color="#f43f5e" />
          <p className="mb-2 mt-4 text-xs font-medium text-slate-300">By hosting country</p>
          <BarList items={d.byCountry.map((c) => ({ name: c.country, count: c.count }))} color="#a78bfa" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-800 lg:col-span-2">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="px-3 py-2 text-left">C2 IP:port</th><th className="px-3 py-2 text-left">Malware</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">ASN / country</th><th className="px-3 py-2 text-left">First seen</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {d.recent.map((r) => (
                <tr key={`${r.ip_address}:${r.port}`}>
                  <td className="px-3 py-2 font-mono text-xs text-slate-200">{r.ip_address}:{r.port}</td>
                  <td className="px-3 py-2 text-slate-300">{r.malware}</td>
                  <td className="px-3 py-2"><span className={r.status === "online" ? "text-red-300" : "text-slate-500"}>{r.status}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-400">{r.as_name ?? "—"} · {r.country ?? "??"}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">{r.first_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
