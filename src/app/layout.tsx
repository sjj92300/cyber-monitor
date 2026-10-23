import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AlertStoreProvider } from "@/components/alert-store";
import { MobileNav, Sidebar, TopBar } from "@/components/shell";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sentinel SOC — Cybersecurity Monitoring Platform",
  description:
    "Portfolio SOC dashboard: live CISA KEV, NVD CVE and abuse.ch threat intel plus a simulated alert triage workflow mapped to MITRE ATT&CK.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-slate-200">
        <AlertStoreProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNav />
              <TopBar />
              <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 py-6">{children}</main>
              <footer className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
                Built by Stephanie Jones · Threat intel from CISA, NIST NVD and abuse.ch (live, cached server-side) ·
                Alerts, IPs, hosts and users are simulated demo telemetry.
              </footer>
            </div>
          </div>
        </AlertStoreProvider>
      </body>
    </html>
  );
}
