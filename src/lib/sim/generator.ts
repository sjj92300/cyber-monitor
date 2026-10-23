import { ATTACKERS, DETECTIONS, HOSTS, USERS, type DetectionTemplate } from "./catalog";
import type { SecurityAlert, Severity } from "./types";

/** Deterministic PRNG (mulberry32) so a seed reproduces the same history. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    weighted: <T,>(items: readonly T[], weight: (t: T) => number) => {
      const total = items.reduce((s, i) => s + weight(i), 0);
      let r = next() * total;
      for (const item of items) {
        r -= weight(item);
        if (r <= 0) return item;
      }
      return items[items.length - 1];
    },
  };
}
export type Rng = ReturnType<typeof createRng>;

let counter = 0;
const nextId = (ts: number) => `SIM-${(ts % 1e8).toString(36).toUpperCase()}-${(counter++).toString().padStart(4, "0")}`;

export function makeAlert(rng: Rng, timestamp: number, forced?: Partial<{ template: DetectionTemplate; ip: string }>): SecurityAlert {
  const template = forced?.template ?? rng.weighted(DETECTIONS, (d) => d.weight);
  const attacker = forced?.ip
    ? ATTACKERS.find((a) => a.ip === forced.ip) ?? ATTACKERS[0]
    : rng.weighted(ATTACKERS, (a) => a.weight);
  const severity = rng.weighted(template.severities, ([, w]) => w)[0] as Severity;
  const host = rng.pick(HOSTS);
  const user = template.needsUser ? rng.pick(USERS) : null;
  const port = template.ports[0] === 0 ? 0 : rng.pick(template.ports); // 0 = n/a
  const n = rng.int(12, 480);
  const ctx = { ip: attacker.ip, host, user, port, n };
  return {
    id: nextId(timestamp),
    timestamp,
    type: template.type,
    title: template.title,
    severity,
    status: "new",
    sourceIp: attacker.ip,
    sourceCountry: attacker.country,
    destHost: host,
    destPort: port,
    user,
    sensor: template.sensor,
    technique: template.technique,
    description: template.describe(ctx),
    rawLog: template.log({ ...ctx, ts: new Date(timestamp).toISOString() }),
    acknowledgedAt: null,
    closedAt: null,
    notes: [],
  };
}

const HOUR = 3_600_000;

/**
 * Build ~24 h of history ending at `now`: a diurnal baseline plus one
 * brute-force campaign burst, with older alerts already triaged so KPIs
 * like mean-time-to-acknowledge have something to measure.
 */
export function generateHistory(now: number, seed = 1337): SecurityAlert[] {
  const rng = createRng(seed);
  const alerts: SecurityAlert[] = [];
  const burstHour = 6 + rng.int(0, 10);
  const bruteForce = DETECTIONS.find((d) => d.type === "brute_force")!;

  for (let h = 23; h >= 0; h--) {
    const hourStart = now - (h + 1) * HOUR;
    const localHour = new Date(hourStart).getHours();
    const business = localHour >= 8 && localHour <= 18;
    let count = rng.int(8, 13) + (business ? rng.int(4, 8) : 0);
    if (h === burstHour) count += 20;
    for (let i = 0; i < count; i++) {
      const ts = hourStart + Math.floor(rng.next() * HOUR);
      const burst = h === burstHour && i < 20;
      alerts.push(makeAlert(rng, ts, burst ? { template: bruteForce, ip: "203.0.113.45" } : undefined));
    }
  }

  // Simulate analyst triage on older alerts.
  for (const a of alerts) {
    const age = now - a.timestamp;
    if (age < 45 * 60_000) continue;
    const roll = rng.next();
    const urgency = a.severity === "critical" ? 0.6 : a.severity === "high" ? 1 : 2.2;
    const ackDelay = Math.floor((3 + rng.next() * 40) * urgency * 60_000);
    if (a.timestamp + ackDelay > now) continue;
    if (roll < 0.45) {
      a.status = "closed";
      a.acknowledgedAt = a.timestamp + ackDelay;
      a.closedAt = a.acknowledgedAt + rng.int(5, 90) * 60_000;
      if (a.closedAt > now) a.closedAt = now;
    } else if (roll < 0.6) {
      a.status = "acknowledged";
      a.acknowledgedAt = a.timestamp + ackDelay;
    } else if (roll < 0.66 && (a.severity === "critical" || a.severity === "high")) {
      a.status = "escalated";
      a.acknowledgedAt = a.timestamp + ackDelay;
    }
  }
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}
