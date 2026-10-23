"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEVERITY_STYLES } from "./ui";
import type { Severity } from "@/lib/sim/types";

const tooltipStyle = {
  contentStyle: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#e2e8f0" },
};
const axis = { stroke: "#64748b", fontSize: 11, tickLine: false, axisLine: false } as const;
const ORDER: Severity[] = ["low", "medium", "high", "critical"];

export function EventsOverTimeChart({ data, height = 260 }: { data: (Record<Severity, number> & { label: string })[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {ORDER.map((s) => (
            <linearGradient key={s} id={`g-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SEVERITY_STYLES[s].hex} stopOpacity={0.55} />
              <stop offset="100%" stopColor={SEVERITY_STYLES[s].hex} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#1e293b" vertical={false} />
        <XAxis dataKey="label" {...axis} interval={3} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        {ORDER.map((s) => (
          <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={SEVERITY_STYLES[s].hex} fill={`url(#g-${s})`} strokeWidth={1.5} isAnimationActive={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SeverityDonut({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((d) => <Cell key={d.name} fill={SEVERITY_STYLES[d.name as Severity].hex} />)}
            </Pie>
            <Tooltip {...tooltipStyle} itemStyle={{ color: "#e2e8f0" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-mono text-2xl font-semibold text-white">{total}</p>
            <p className="text-[11px] text-slate-400">alerts</p>
          </div>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SEVERITY_STYLES[d.name as Severity].hex }} />
            <span className="w-16 capitalize text-slate-300">{d.name}</span>
            <span className="font-mono tabular-nums text-slate-400">{d.count}</span>
            <span className="text-xs text-slate-500">{total ? Math.round((d.count / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SimpleBarChart({ data, color = "#22d3ee", height = 220, xKey = "name", yKey = "count" }: {
  data: Record<string, string | number>[];
  color?: string;
  height?: number;
  xKey?: string;
  yKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#1e293b" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "#1e293b" }} />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
