import Link from "next/link";
import { Suspense } from "react";
import { getKevSummary } from "@/lib/feeds/kev";
import { KevRecentList } from "@/components/intel";
import { OverviewCharts, OverviewKpis } from "@/components/overview-live";
import { Card, PageHeader, SourceTag } from "@/components/ui";

async function Kpis() {
  const kev = await getKevSummary();
  return <OverviewKpis kevNewThisWeek={kev.ok ? kev.data.addedLast7Days : null} />;
}

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Security Operations Overview"
        description="Real-time posture at a glance: alert workload from the simulated detection pipeline alongside live, real-world vulnerability intelligence from CISA and NIST."
      />
      <div className="space-y-4">
        <Suspense fallback={<OverviewKpis kevNewThisWeek={null} />}>
          <Kpis />
        </Suspense>
        <OverviewCharts />
        <Card
          title={<span className="flex items-center gap-2">Latest actively exploited vulnerabilities <SourceTag kind="live" /></span>}
          subtitle="Newest additions to the CISA KEV catalog"
          actions={<Link href="/threat-intel" className="text-xs text-cyan-300 hover:underline">All threat intel →</Link>}
        >
          <Suspense fallback={<p className="text-sm text-slate-500">Loading CISA KEV…</p>}>
            <KevRecentList />
          </Suspense>
        </Card>
      </div>
    </>
  );
}
