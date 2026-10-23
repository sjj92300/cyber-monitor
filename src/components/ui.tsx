import clsx from "clsx";
import type { AlertStatus, Severity } from "@/lib/sim/types";

export const SEVERITY_STYLES: Record<Severity, { text: string; bg: string; dot: string; hex: string }> = {
  critical: { text: "text-red-300", bg: "bg-red-500/15 ring-red-500/40", dot: "bg-red-500", hex: "#ef4444" },
  high: { text: "text-orange-300", bg: "bg-orange-500/15 ring-orange-500/40", dot: "bg-orange-500", hex: "#f97316" },
  medium: { text: "text-amber-200", bg: "bg-amber-400/15 ring-amber-400/40", dot: "bg-amber-400", hex: "#fbbf24" },
  low: { text: "text-sky-300", bg: "bg-sky-400/15 ring-sky-400/40", dot: "bg-sky-400", hex: "#38bdf8" },
};

const STATUS_STYLES: Record<AlertStatus, string> = {
  new: "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40",
  acknowledged: "bg-violet-400/15 text-violet-200 ring-violet-400/40",
  escalated: "bg-rose-500/20 text-rose-200 ring-rose-500/50",
  closed: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide ring-1", s.bg, s.text)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: AlertStatus }) {
  return (
    <span className={clsx("inline-flex rounded px-2 py-0.5 text-xs font-medium capitalize ring-1", STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

export function Card({ title, subtitle, actions, children, className }: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/20", className)}>
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function SourceTag({ kind }: { kind: "live" | "simulated" }) {
  return kind === "live" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live public feed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-500/30">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Simulated demo telemetry
    </span>
  );
}

export function KpiCard({ label, value, hint, accent = "cyan", source }: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: "cyan" | "red" | "violet" | "emerald" | "amber";
  source: "live" | "simulated";
}) {
  const accents = {
    cyan: "from-cyan-500/20 text-cyan-300",
    red: "from-red-500/20 text-red-300",
    violet: "from-violet-500/20 text-violet-300",
    emerald: "from-emerald-500/20 text-emerald-300",
    amber: "from-amber-500/20 text-amber-300",
  };
  return (
    <div className={clsx("relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-br to-slate-900/60 p-4", accents[accent].split(" ")[0])}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={clsx("mt-3 font-mono text-3xl font-semibold tabular-nums", accents[accent].split(" ")[1])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      <div className="mt-3"><SourceTag kind={source} /></div>
    </div>
  );
}

export function FeedError({ name, error }: { name: string; error: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
      Could not load {name} right now ({error}). The page will retry automatically within a few minutes.
    </div>
  );
}

export function BarList({ items, color = "#22d3ee", format }: {
  items: { name: string; count: number; extra?: string }[];
  color?: string;
  format?: (name: string) => React.ReactNode;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i.name} className="relative flex items-center justify-between gap-3 rounded px-2 py-1 text-sm">
          <span className="absolute inset-y-0 left-0 rounded opacity-20" style={{ width: `${(i.count / max) * 100}%`, background: color }} />
          <span className="relative truncate font-mono text-slate-200">{format ? format(i.name) : i.name}</span>
          <span className="relative shrink-0 font-mono text-xs tabular-nums text-slate-300">
            {i.extra && <span className="mr-2 text-slate-500">{i.extra}</span>}
            {i.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PageHeader({ title, description, children }: { title: string; description: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}
