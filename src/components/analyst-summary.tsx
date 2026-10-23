"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import clsx from "clsx";
import { buildAnalystSummary, type AnalystSummary } from "@/lib/sim/summary";
import { useAlertStore } from "./alert-store";
import { Card } from "./ui";

export function AnalystSummaryPanel() {
  const { alerts, now } = useAlertStore();
  const [summary, setSummary] = useState<(AnalystSummary & { at: number }) | null>(null);
  const riskColor = { Severe: "text-red-300", Elevated: "text-orange-300", Guarded: "text-emerald-300" };

  return (
    <Card
      title="Analyst summary"
      subtitle="Rule-based shift hand-off generated in your browser from the current alert queue — no LLM, no API key."
      actions={
        <button onClick={() => setSummary({ ...buildAnalystSummary(alerts, Date.now()), at: Date.now() })} className="btn bg-cyan-500/15 text-cyan-200 ring-cyan-500/40">
          <Sparkles className="h-4 w-4" /> {summary ? "Regenerate" : "Generate summary"}
        </button>
      }
    >
      {!summary ? (
        <p className="text-sm text-slate-400">Click <span className="text-cyan-300">Generate summary</span> for a plain-English brief of the {alerts.length} alerts currently in the queue.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <p className={clsx("font-medium", riskColor[summary.riskLevel])}>{summary.headline}</p>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Key findings</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-300">{summary.findings.map((f) => <li key={f}>{f}</li>)}</ul>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Recommended actions</p>
            <ol className="list-decimal space-y-1 pl-5 text-slate-300">{summary.recommendations.map((r) => <li key={r}>{r}</li>)}</ol>
          </div>
          <p className="text-[11px] text-slate-500">Generated {new Date(summary.at).toLocaleTimeString()} · based on simulated telemetry{now > summary.at + 30_000 ? " · new events have arrived since, regenerate to refresh" : ""}</p>
        </div>
      )}
    </Card>
  );
}
