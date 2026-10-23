"use client";

import { useState } from "react";
import { ArrowUpCircle, CheckCircle2, RotateCcw, X, XCircle } from "lucide-react";
import { useAlertStore } from "./alert-store";
import { SeverityBadge, StatusBadge } from "./ui";
import type { SecurityAlert } from "@/lib/sim/types";

const fmt = (t: number) => new Date(t).toLocaleString([], { dateStyle: "short", timeStyle: "medium" });

export function AlertDrawer({ alert, onClose }: { alert: SecurityAlert | null; onClose: () => void }) {
  const { setStatus, addNote, alerts } = useAlertStore();
  const [note, setNote] = useState("");
  if (!alert) return null;
  const related = alerts.filter((a) => a.sourceIp === alert.sourceIp && a.id !== alert.id);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`Alert ${alert.id}`}>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Close drawer" />
      <div className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-950/95 p-5 backdrop-blur">
          <div>
            <p className="font-mono text-xs text-slate-500">{alert.id} · simulated</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{alert.title}</h2>
            <div className="mt-2 flex gap-2"><SeverityBadge severity={alert.severity} /><StatusBadge status={alert.status} /></div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 text-sm">
          <p className="text-slate-300">{alert.description}</p>

          <div className="flex flex-wrap gap-2">
            <button disabled={alert.status !== "new"} onClick={() => setStatus(alert.id, "acknowledged", "Acknowledged by analyst")} className="btn bg-violet-500/15 text-violet-200 ring-violet-500/40">
              <CheckCircle2 className="h-4 w-4" /> Acknowledge
            </button>
            <button disabled={alert.status === "escalated" || alert.status === "closed"} onClick={() => setStatus(alert.id, "escalated", "Escalated to Tier 2 / incident response")} className="btn bg-rose-500/15 text-rose-200 ring-rose-500/40">
              <ArrowUpCircle className="h-4 w-4" /> Escalate
            </button>
            <button disabled={alert.status === "closed"} onClick={() => setStatus(alert.id, "closed", "Closed after triage")} className="btn bg-slate-500/15 text-slate-200 ring-slate-500/40">
              <XCircle className="h-4 w-4" /> Close
            </button>
            {alert.status === "closed" && (
              <button onClick={() => setStatus(alert.id, "acknowledged", "Re-opened")} className="btn bg-cyan-500/15 text-cyan-200 ring-cyan-500/40">
                <RotateCcw className="h-4 w-4" /> Re-open
              </button>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            {[
              ["Detected", fmt(alert.timestamp)],
              ["Sensor", alert.sensor],
              ["Source IP", `${alert.sourceIp} (${alert.sourceCountry}, simulated geo)`],
              ["Target", `${alert.destHost}${alert.destPort ? `:${alert.destPort}` : ""}`],
              ["User", alert.user ?? "—"],
              ["Acknowledged", alert.acknowledgedAt ? fmt(alert.acknowledgedAt) : "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wider text-slate-500">{k}</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">MITRE ATT&CK</p>
            <a href={`https://attack.mitre.org/techniques/${alert.technique.id.replace(".", "/")}/`} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-cyan-300 hover:underline">
              {alert.technique.id} — {alert.technique.name}
            </a>
            <p className="text-xs text-slate-400">Tactic: {alert.technique.tactic}</p>
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-500">Raw event (simulated)</p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-slate-800 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-emerald-200">{alert.rawLog}</pre>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Related activity from {alert.sourceIp} ({related.length})</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {related.slice(0, 12).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded bg-slate-900/60 px-2 py-1 text-xs">
                  <span className="truncate text-slate-300">{r.title}</span>
                  <span className="shrink-0 font-mono text-slate-500">{new Date(r.timestamp).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Case notes</p>
            <ol className="mb-2 space-y-1 border-l border-slate-800 pl-3 text-xs">
              {alert.notes.length === 0 && <li className="text-slate-500">No notes yet.</li>}
              {alert.notes.map((n, i) => (
                <li key={i} className="text-slate-300"><span className="font-mono text-slate-500">{new Date(n.at).toLocaleTimeString()}</span> — {n.text}</li>
              ))}
            </ol>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) addNote(alert.id, note.trim());
                setNote("");
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a triage note…" className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none" />
              <button className="rounded-md bg-cyan-500/20 px-3 text-sm text-cyan-200 ring-1 ring-cyan-500/40 hover:bg-cyan-500/30">Add</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
