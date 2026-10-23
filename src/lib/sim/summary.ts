import { countBy, isOpen, meanTimeToAcknowledge, formatMinutes } from "./metrics";
import type { SecurityAlert } from "./types";

/**
 * "AI analyst summary": a deterministic, rule-based narrative of the current
 * alert queue. No LLM and no API key: it applies the same heuristics a tier-1
 * analyst would use (volume, severity, repeat sources, kill-chain spread) and
 * writes them up as a shift hand-off note.
 */
export interface AnalystSummary {
  headline: string;
  riskLevel: "Elevated" | "Guarded" | "Severe";
  findings: string[];
  recommendations: string[];
}

export function buildAnalystSummary(alerts: SecurityAlert[], now: number): AnalystSummary {
  const lastHour = alerts.filter((a) => now - a.timestamp < 3_600_000);
  const open = alerts.filter(isOpen);
  const openCritical = open.filter((a) => a.severity === "critical");
  const openHigh = open.filter((a) => a.severity === "high");
  const unacked = open.filter((a) => a.status === "new");
  const escalated = alerts.filter((a) => a.status === "escalated");
  const topIps = countBy(open, (a) => a.sourceIp).slice(0, 3);
  const tactics = countBy(open, (a) => a.technique.tactic);
  const topTech = countBy(open, (a) => `${a.technique.id} ${a.technique.name}`).slice(0, 3);
  const mtta = meanTimeToAcknowledge(alerts);

  const riskLevel: AnalystSummary["riskLevel"] =
    openCritical.length >= 8 ? "Severe" : openCritical.length >= 3 || openHigh.length >= 15 ? "Elevated" : "Guarded";

  const findings: string[] = [
    `${alerts.length} alerts in the last 24 h (${lastHour.length} in the past hour); ${open.length} remain open and ${unacked.length} have not been acknowledged.`,
    `${openCritical.length} critical and ${openHigh.length} high-severity alerts are open; ${escalated.length} are escalated to tier 2.`,
  ];
  if (topIps.length) {
    findings.push(
      `Most active sources: ${topIps.map((i) => `${i.name} (${i.count})`).join(", ")}. Repeated hits from one address usually indicate an automated campaign rather than noise.`,
    );
  }
  if (topTech.length) findings.push(`Dominant ATT&CK techniques: ${topTech.map((t) => `${t.name} ×${t.count}`).join("; ")}.`);
  const lateStage = tactics.filter((t) =>
    ["Lateral Movement", "Credential Access", "Exfiltration", "Command and Control"].includes(t.name),
  );
  if (lateStage.length) {
    findings.push(
      `Activity spans ${tactics.length} ATT&CK tactics, including later-stage ${lateStage.map((t) => t.name).join(", ")} — treat related hosts as potentially compromised until ruled out.`,
    );
  }
  findings.push(`Mean time to acknowledge is ${formatMinutes(mtta)}.`);

  const rec: string[] = [];
  if (openCritical.length) rec.push(`Triage the ${openCritical.length} open critical alert(s) first; isolate affected hosts if EDR confirms execution.`);
  if (topIps[0] && topIps[0].count >= 10) rec.push(`Block or rate-limit ${topIps[0].name} at the perimeter and check for any successful authentications from it.`);
  if (open.some((a) => a.type === "brute_force" || a.type === "password_spray"))
    rec.push("Review accounts targeted by brute-force / spraying for lockouts and enforce MFA on exposed services.");
  if (open.some((a) => a.type === "c2_beacon" || a.type === "dns_tunneling" || a.type === "data_exfil"))
    rec.push("Pull NetFlow/PCAP for hosts showing beaconing or large outbound transfers and scope for exfiltration.");
  if (open.some((a) => a.type === "phishing" || a.type === "malware_detected"))
    rec.push("Search mailboxes for the same phishing attachment and confirm EDR quarantine succeeded on all endpoints.");
  if (unacked.length > 20) rec.push(`Queue backlog is ${unacked.length}; consider tuning noisy low-severity rules (failed logins, port scans).`);

  return {
    headline: `Risk is ${riskLevel.toUpperCase()}: ${openCritical.length} critical / ${openHigh.length} high alerts open, led by ${tactics[0]?.name ?? "no single tactic"}.`,
    riskLevel,
    findings,
    recommendations: rec.length ? rec : ["No urgent action required; continue monitoring."],
  };
}
