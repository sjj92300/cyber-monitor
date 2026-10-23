"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import clsx from "clsx";
import { SEVERITIES, STATUSES, type AlertStatus, type SecurityAlert, type Severity } from "@/lib/sim/types";
import { SeverityBadge, StatusBadge } from "./ui";

type SortKey = "timestamp" | "severity" | "sourceIp" | "title" | "status";
const SEV_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const PAGE_SIZE = 25;

export function AlertTable({ alerts, onSelect }: { alerts: SecurityAlert[]; onSelect: (a: SecurityAlert) => void }) {
  const [query, setQuery] = useState("");
  const [sev, setSev] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<AlertStatus | "open" | "all">("open");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "timestamp", dir: -1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = alerts.filter(
      (a) =>
        (sev === "all" || a.severity === sev) &&
        (status === "all" || (status === "open" ? a.status !== "closed" : a.status === status)) &&
        (!q || [a.id, a.title, a.sourceIp, a.destHost, a.user ?? "", a.technique.id, a.technique.name].some((f) => f.toLowerCase().includes(q))),
    );
    const val = (a: SecurityAlert) => (sort.key === "severity" ? SEV_RANK[a.severity] : a[sort.key]);
    return filtered.sort((a, b) => {
      const x = val(a), y = val(b);
      return (x < y ? -1 : x > y ? 1 : b.timestamp - a.timestamp) * sort.dir;
    });
  }, [alerts, query, sev, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const header = (key: SortKey, label: string) => (
    <th className="px-3 py-2 text-left font-medium">
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : -1 }))} className="inline-flex items-center gap-1 hover:text-slate-200">
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
  const selectCls = "rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search IP, host, user, ATT&CK ID…"
            className="w-full rounded-md border border-slate-700 bg-slate-900 py-1.5 pl-8 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </label>
        <select aria-label="Severity filter" value={sev} onChange={(e) => { setSev(e.target.value as Severity | "all"); setPage(0); }} className={selectCls}>
          <option value="all">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select aria-label="Status filter" value={status} onChange={(e) => { setStatus(e.target.value as AlertStatus | "open" | "all"); setPage(0); }} className={selectCls}>
          <option value="open">Open (not closed)</option>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-400">{rows.length} matching</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              {header("timestamp", "Time")}
              {header("severity", "Severity")}
              {header("title", "Detection")}
              {header("sourceIp", "Source")}
              <th className="px-3 py-2 text-left font-medium">Target</th>
              <th className="px-3 py-2 text-left font-medium">ATT&CK</th>
              {header("status", "Status")}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {visible.map((a) => (
              <tr key={a.id} onClick={() => onSelect(a)} className="cursor-pointer transition hover:bg-cyan-500/5">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">{new Date(a.timestamp).toLocaleTimeString()}</td>
                <td className="px-3 py-2"><SeverityBadge severity={a.severity} /></td>
                <td className="px-3 py-2 text-slate-100">{a.title}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-300">{a.sourceIp} <span className="text-slate-500">{a.sourceCountry}</span></td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">{a.destHost}</td>
                <td className="px-3 py-2 font-mono text-xs text-cyan-300" title={a.technique.name}>{a.technique.id}</td>
                <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-500">No alerts match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-400">
        <span>Page {current + 1} of {pages}</span>
        {[["Prev", current - 1], ["Next", current + 1]].map(([label, target]) => (
          <button key={label} disabled={(target as number) < 0 || (target as number) >= pages} onClick={() => setPage(target as number)} className={clsx("rounded border border-slate-700 px-2 py-1 hover:bg-slate-800 disabled:opacity-40")}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
