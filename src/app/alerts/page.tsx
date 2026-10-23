import type { Metadata } from "next";
import { AlertsView } from "@/components/alerts-view";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Alerts — Sentinel SOC" };

export default function AlertsPage() {
  return (
    <>
      <PageHeader
        title="Alert Monitoring"
        description="Simulated SIEM/EDR/IDS telemetry streaming in every few seconds. Each detection carries a severity, source, target and MITRE ATT&CK technique. Filter, sort and triage (acknowledge, escalate, close) like a tier-1 SOC analyst."
      />
      <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
        Demo data: every alert, IP address, host and user on this page is <strong>simulated</strong>. Source IPs come from RFC 5737
        documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) and countries are fictional attribution. MITRE ATT&CK technique IDs are real.
      </div>
      <AlertsView />
    </>
  );
}
