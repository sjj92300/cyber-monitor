"use client";

import { useMemo, useState } from "react";
import { countBy, eventsOverTime, severityBreakdown } from "@/lib/sim/metrics";
import { useAlertStore } from "./alert-store";
import { AlertDrawer } from "./alert-drawer";
import { AlertTable } from "./alert-table";
import { AnalystSummaryPanel } from "./analyst-summary";
import { EventsOverTimeChart, SeverityDonut } from "./charts";
import { BarList, Card, SourceTag } from "./ui";

export function LoadingPanel({ label = "Generating simulated telemetry…" }: { label?: string }) {
  return <div className="grid h-64 place-items-center rounded-xl border border-slate-800 bg-slate-900/40 text-sm text-slate-500">{label}</div>;
}

export function AlertsView() {
  const { ready, alerts, now } = useAlertStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = alerts.find((a) => a.id === selectedId) ?? null;

  const stats = useMemo(() => ({
    timeline: eventsOverTime(alerts, now),
    severity: severityBreakdown(alerts),
    ips: countBy(alerts, (a) => a.sourceIp).slice(0, 8).map((i) => ({ ...i, extra: alerts.find((a) => a.sourceIp === i.name)?.sourceCountry })),
    countries: countBy(alerts, (a) => a.sourceCountry).slice(0, 8),
    tactics: countBy(alerts, (a) => a.technique.tactic),
  }), [alerts, now]);

  if (!ready) return <LoadingPanel />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Events over time (24 h)" subtitle="Hourly alert volume stacked by severity" actions={<SourceTag kind="simulated" />}>
          <EventsOverTimeChart data={stats.timeline} />
        </Card>
        <Card title="Severity breakdown" actions={<SourceTag kind="simulated" />}>
          <SeverityDonut data={stats.severity} />
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Top attacking IPs" subtitle="RFC 5737 documentation addresses — never real hosts">
          <BarList items={stats.ips} color="#f97316" />
        </Card>
        <Card title="Top source countries" subtitle="Simulated geo-attribution">
          <BarList items={stats.countries} color="#a78bfa" />
        </Card>
        <Card title="Alerts by ATT&CK tactic">
          <BarList items={stats.tactics} color="#22d3ee" />
        </Card>
      </div>
      <AnalystSummaryPanel />
      <Card title="Alert queue" subtitle="Click a row to open the triage drawer. Actions are kept in browser memory only." actions={<SourceTag kind="simulated" />}>
        <AlertTable alerts={alerts} onSelect={(a) => setSelectedId(a.id)} />
      </Card>
      <AlertDrawer alert={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
