import type { Metadata } from "next";
import { Suspense } from "react";
import { FeodoSection, KevSection, NvdSection } from "@/components/intel";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Threat Intel — Sentinel SOC" };

const Loading = ({ label }: { label: string }) => (
  <div className="grid h-48 place-items-center rounded-xl border border-slate-800 bg-slate-900/40 text-sm text-slate-500">Loading {label}…</div>
);

export default function ThreatIntelPage() {
  return (
    <>
      <PageHeader
        title="Threat Intelligence"
        description="Real, public threat data fetched server-side and cached for an hour: vulnerabilities attackers are exploiting right now (CISA KEV), newly published critical/high CVEs (NIST NVD) and active botnet command-and-control servers (abuse.ch)."
      />
      <div className="space-y-4">
        <Suspense fallback={<Loading label="CISA KEV" />}><KevSection /></Suspense>
        <Suspense fallback={<Loading label="NVD CVEs" />}><NvdSection /></Suspense>
        <Suspense fallback={<Loading label="Feodo Tracker" />}><FeodoSection /></Suspense>
      </div>
    </>
  );
}
