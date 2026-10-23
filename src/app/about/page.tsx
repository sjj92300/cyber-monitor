import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "About — Sentinel SOC" };

const SKILLS = [
  ["Alert triage workflow", "Acknowledge → escalate → close lifecycle, case notes, related-activity pivot by source IP, MTTA tracking."],
  ["MITRE ATT&CK mapping", "Every detection is tagged with a real technique ID and tactic (e.g. T1110 Brute Force, T1046 Network Service Discovery)."],
  ["Vulnerability management", "Tracks CISA KEV additions and federal remediation due dates, plus newly published critical/high CVEs with CVSS and CWE."],
  ["Threat intelligence", "Consumes public feeds (CISA, NIST NVD, abuse.ch) and turns raw JSON into analyst-friendly views."],
  ["Log analysis", "Simulated raw events modeled on Windows Security (4625, 4624, 4698), Sysmon, Suricata, Zeek, WAF and firewall formats."],
  ["Secure, responsible engineering", "Server-side fetching with timeouts, retries and caching that respects NVD rate limits; simulated IPs use RFC 5737 ranges so no real host is accused."],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="About this project" description="A portfolio project by Stephanie Jones — U.S. military veteran and Google Launchpad for Veterans (Generative AI Leader) participant, seeking SOC / security analyst roles in the Harrisburg, PA area." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="What it is">
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>Sentinel SOC is a security operations dashboard that combines <strong className="text-emerald-300">live, real-world threat intelligence</strong> with a <strong className="text-amber-300">simulated alert stream</strong> to demonstrate how a SOC analyst monitors, prioritizes and triages security events.</p>
            <p>The threat-intel pages show real data from CISA, NIST and abuse.ch. The alert console uses synthetic telemetry because real enterprise logs are confidential; it is clearly labeled as simulated throughout the UI.</p>
            <p>The &ldquo;Analyst summary&rdquo; is a transparent rule-based generator (no paid AI API), producing a shift hand-off note from the current queue.</p>
          </div>
        </Card>
        <Card title="Architecture">
          <ul className="space-y-2 text-sm text-slate-300">
            <li><span className="text-cyan-300">Next.js App Router + TypeScript</span> — React Server Components fetch threat feeds on the server; nothing sensitive runs in the browser.</li>
            <li><span className="text-cyan-300">Cache Components (<code>&quot;use cache&quot;</code> + <code>cacheLife</code>)</span> — each feed is reduced to a small summary and cached for an hour (minutes on error), keeping well under NVD&apos;s 5-requests-per-30-seconds public limit.</li>
            <li><span className="text-cyan-300">Client-side simulation engine</span> — a seeded PRNG generates 24 h of history and new events every 5 s; triage state lives in a React context.</li>
            <li><span className="text-cyan-300">Tailwind CSS + Recharts</span> — dark SOC theme, stacked-area timeline, severity donut, tactic and source charts.</li>
            <li><span className="text-cyan-300">Vercel</span> — deployed serverlessly; feeds refresh via incremental revalidation.</li>
          </ul>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-slate-400">{`CISA KEV ─┐
NIST NVD ─┼─▶ Server Components ("use cache", 1 h) ─▶ Threat Intel / KPIs
abuse.ch ─┘
Seeded simulator ─▶ AlertStore (React context) ─▶ Charts · Alert table · Drawer · Summary`}</pre>
        </Card>
        <Card title="Skills demonstrated" className="lg:col-span-2">
          <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SKILLS.map(([k, v]) => (
              <div key={k} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <dt className="text-sm font-medium text-white">{k}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-slate-400">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="Data sources" className="lg:col-span-2">
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li><span className="text-emerald-300">Live:</span> <a className="text-cyan-300 hover:underline" href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog">CISA Known Exploited Vulnerabilities catalog</a> (JSON feed)</li>
            <li><span className="text-emerald-300">Live:</span> <a className="text-cyan-300 hover:underline" href="https://nvd.nist.gov/developers/vulnerabilities">NIST NVD CVE API 2.0</a> (no key; rate-limited and cached). This product uses data from the NVD API but is not endorsed or certified by the NVD.</li>
            <li><span className="text-emerald-300">Live:</span> <a className="text-cyan-300 hover:underline" href="https://feodotracker.abuse.ch/">abuse.ch Feodo Tracker</a> botnet C2 IP blocklist</li>
            <li><span className="text-amber-300">Simulated:</span> all alerts, source IPs (RFC 5737 documentation ranges), countries, hostnames, usernames, raw log lines and triage history</li>
            <li><span className="text-slate-400">Reference:</span> <a className="text-cyan-300 hover:underline" href="https://attack.mitre.org/">MITRE ATT&CK®</a> technique IDs and names</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
