import { SEVERITIES, type SecurityAlert, type Severity } from "./types";

export const isOpen = (a: SecurityAlert) => a.status !== "closed";

export function countBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

/** Mean time to acknowledge, in minutes, across alerts that were acknowledged. */
export function meanTimeToAcknowledge(alerts: SecurityAlert[]) {
  const acked = alerts.filter((a) => a.acknowledgedAt !== null);
  if (!acked.length) return null;
  const total = acked.reduce((s, a) => s + (a.acknowledgedAt! - a.timestamp), 0);
  return total / acked.length / 60_000;
}

export function severityBreakdown(alerts: SecurityAlert[]) {
  return SEVERITIES.map((s) => ({ name: s, count: alerts.filter((a) => a.severity === s).length }));
}

/** Hourly buckets for the last `hours` hours, stacked by severity. */
export function eventsOverTime(alerts: SecurityAlert[], now: number, hours = 24) {
  const HOUR = 3_600_000;
  const start = now - hours * HOUR;
  const buckets = Array.from({ length: hours }, (_, i) => {
    const t = start + i * HOUR;
    const label = new Date(t + HOUR).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { label, critical: 0, high: 0, medium: 0, low: 0 } as Record<Severity, number> & { label: string };
  });
  for (const a of alerts) {
    const idx = Math.floor((a.timestamp - start) / HOUR);
    if (idx >= 0 && idx < hours) buckets[idx][a.severity]++;
  }
  return buckets;
}

export function formatMinutes(min: number | null) {
  if (min === null) return "—";
  if (min < 60) return `${min.toFixed(1)} min`;
  return `${(min / 60).toFixed(1)} h`;
}
