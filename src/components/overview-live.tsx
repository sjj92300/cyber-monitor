"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { eventsOverTime, formatMinutes, isOpen, meanTimeToAcknowledge, severityBreakdown } from "@/lib/sim/metrics";
import { useAlertStore } from "./alert-store";
import { AlertDrawer } from "./alert-drawer";
import { LoadingPanel } from "./alerts-view";
import { EventsOverTimeChart, SeverityDonut } from "./charts";
import { Card, KpiCard, SeverityBadge, SourceTag, StatusBadge } from "./ui";

/** KPI row: three simulated metrics plus one real one (KEV additions) passed in from the server. */
export function OverviewKpis({ kevNewThisWeek }: { kevNewThisWeek: number | null }) {
  const { ready, alerts, now } = useAlertStore();
  const k = useMemo(() => {
    const open = alerts.filter(isOpen);
    return {
      open: open.length,
      unacked: open.filter((a) => a.status === "new").length,
      critical: open.filter((a) => a.severity === "critical").length,
      lastHour: alerts.filter((a) => now - a.timestamp < 3_600_000).length,
      mtta: meanTimeToAcknowledge(alerts),
    };
  }, [alerts, now]);
  const dash = (v: number | string) => (ready ? v : "—");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Open alerts" value={dash(k.open)} hint={ready ? `${k.unacked} awaiting acknowledgement · ${k.lastHour} in last hour` : "…"} source="simulated" />
      <KpiCard label="Open criticals" value={dash(k.critical)} accent="red" hint="Critical severity, not closed" source="simulated" />
      <KpiCard label="Mean time to ack" value={ready ? formatMinutes(k.mtta) : "—"} accent="violet" hint="Across acknowledged alerts (24 h)" source="simulated" />
      <KpiCard label="New KEV entries (7 d)" value={kevNewThisWeek ?? "n/a"} accent="emerald" hint="Added to CISA's Known Exploited Vulnerabilities catalog" source="live" />
    </div>
  );
}

export function OverviewCharts() {
  const { ready, alerts, now } = useAlertStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const timeline = useMemo(() => eventsOverTime(alerts, now), [alerts, now]);
  const severity = useMemo(() => severityBreakdown(alerts), [alerts]);
  const urgent = useMemo(
    () => alerts.filter((a) => isOpen(a) && (a.severity === "critical" || a.severity === "high")).slice(0, 8),
    [alerts],
  );
  if (!ready) return <LoadingPanel />;

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Security events — last 24 hours" subtitle="Stacked by severity" actions={<SourceTag kind="simulated" />}>
          <EventsOverTimeChart data={timeline} height={240} />
        </Card>
        <Card title="Severity mix" actions={<SourceTag kind="simulated" />}>
          <SeverityDonut data={severity} />
        </Card>
      </div>
      <Card
        title="Priority queue"
        subtitle="Newest open critical & high alerts"
        actions={<Link href="/alerts" className="text-xs text-cyan-300 hover:underline">Open alert console →</Link>}
      >
        <ul className="divide-y divide-slate-800/70">
          {urgent.map((a) => (
            <li key={a.id}>
              <button onClick={() => setSelectedId(a.id)} className="flex w-full flex-wrap items-center gap-3 px-1 py-2 text-left text-sm hover:bg-cyan-500/5">
                <SeverityBadge severity={a.severity} />
                <span className="min-w-40 flex-1 text-slate-100">{a.title}</span>
                <span className="font-mono text-xs text-slate-400">{a.sourceIp} → {a.destHost}</span>
                <span className="font-mono text-xs text-cyan-300">{a.technique.id}</span>
                <StatusBadge status={a.status} />
                <span className="w-20 text-right font-mono text-xs text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <AlertDrawer alert={alerts.find((a) => a.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
    </>
  );
}
