export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "new" | "acknowledged" | "escalated" | "closed";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
export const STATUSES: AlertStatus[] = ["new", "acknowledged", "escalated", "closed"];

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
}

/** One simulated detection. All values are synthetic demo telemetry. */
export interface SecurityAlert {
  id: string;
  timestamp: number; // epoch ms
  type: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  sourceIp: string;
  sourceCountry: string;
  destHost: string;
  destPort: number;
  user: string | null;
  sensor: string;
  technique: MitreTechnique;
  description: string;
  rawLog: string;
  acknowledgedAt: number | null;
  closedAt: number | null;
  notes: { at: number; text: string }[];
}
