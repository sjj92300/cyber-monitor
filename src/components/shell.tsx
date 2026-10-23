"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Activity, Info, LayoutDashboard, Pause, Play, RotateCcw, ShieldAlert, ShieldHalf } from "lucide-react";
import { useEffect, useState } from "react";
import { useAlertStore } from "./alert-store";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/threat-intel", label: "Threat Intel", icon: Activity },
  { href: "/about", label: "About", icon: Info },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80 p-4 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/40">
          <ShieldHalf className="h-5 w-5 text-cyan-300" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">Sentinel SOC</span>
          <span className="block text-[11px] text-slate-400">Cyber Monitoring Platform</span>
        </span>
      </Link>
      <nav className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[11px] leading-relaxed text-slate-400">
        <p className="font-medium text-slate-300">Data sources</p>
        <p className="mt-1"><span className="text-emerald-300">Live:</span> CISA KEV, NVD CVE API, abuse.ch Feodo Tracker</p>
        <p className="mt-1"><span className="text-amber-300">Simulated:</span> alert stream, IPs, hosts & users</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-800 bg-slate-950 px-3 py-2 lg:hidden">
      {NAV.map(({ href, label }) => (
        <Link key={href} href={href} className={clsx("rounded-md px-3 py-1.5 text-sm", (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "bg-cyan-500/15 text-cyan-200" : "text-slate-400")}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function TopBar() {
  const { live, setLive, resetDemo, alerts, ready } = useAlertStore();
  const [clock, setClock] = useState<string>("");
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "medium" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const openCritical = alerts.filter((a) => a.severity === "critical" && a.status !== "closed").length;

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/85 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-300 ring-1 ring-emerald-500/30">
          <span className={clsx("h-2 w-2 rounded-full bg-emerald-400", live && "animate-pulse")} />
          {live ? "Monitoring" : "Paused"}
        </span>
        {ready && (
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-medium text-red-300 ring-1 ring-red-500/30">
            {openCritical} open critical
          </span>
        )}
        <span className="hidden font-mono text-slate-400 sm:inline" suppressHydrationWarning>{clock}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-300 ring-1 ring-amber-500/30">
          Alert stream = simulated demo telemetry
        </span>
        <button onClick={() => setLive(!live)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800">
          {live ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {live ? "Pause stream" : "Resume stream"}
        </button>
        <button onClick={resetDemo} className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800" title="Regenerate simulated data">
          <RotateCcw className="h-3.5 w-3.5" /> Reset demo
        </button>
      </div>
    </header>
  );
}
