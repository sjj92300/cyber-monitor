"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createRng, generateHistory, makeAlert } from "@/lib/sim/generator";
import type { AlertStatus, SecurityAlert } from "@/lib/sim/types";

/**
 * Client-side store for the simulated telemetry stream.
 * History is generated in the browser after mount (avoids hydration
 * mismatches) and new events "arrive" every few seconds. Triage actions only
 * mutate this in-memory state – nothing is persisted or sent anywhere.
 */
interface AlertStore {
  ready: boolean;
  alerts: SecurityAlert[];
  now: number;
  live: boolean;
  setLive: (v: boolean) => void;
  setStatus: (id: string, status: AlertStatus, note?: string) => void;
  addNote: (id: string, text: string) => void;
  resetDemo: () => void;
}

const Ctx = createContext<AlertStore | null>(null);
const TICK_MS = 5_000;
const MAX_ALERTS = 800;

export function AlertStoreProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(true);
  const rng = useRef(createRng(42));

  const init = useCallback(() => {
    const t = Date.now();
    rng.current = createRng(t & 0xffff);
    setAlerts(generateHistory(t, Math.floor(t / 86_400_000)));
    setNow(t);
    setReady(true);
  }, []);

  useEffect(() => {
    // Generating on mount (not during render) keeps SSR and the client in sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [init]);

  useEffect(() => {
    if (!ready || !live) return;
    const id = setInterval(() => {
      const t = Date.now();
      const r = rng.current;
      const n = r.next() < 0.55 ? 1 : r.next() < 0.7 ? 0 : 2;
      const fresh = Array.from({ length: n }, () => makeAlert(r, t - r.int(0, TICK_MS)));
      setNow(t);
      if (fresh.length) setAlerts((prev) => [...fresh, ...prev].slice(0, MAX_ALERTS));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ready, live]);

  const setStatus = useCallback((id: string, status: AlertStatus, note?: string) => {
    const t = Date.now();
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const notes = [...a.notes, { at: t, text: note ?? `Status changed to ${status}` }];
        return {
          ...a,
          status,
          acknowledgedAt: status === "new" ? null : a.acknowledgedAt ?? t,
          closedAt: status === "closed" ? t : null,
          notes,
        };
      }),
    );
  }, []);

  const addNote = useCallback((id: string, text: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, notes: [...a.notes, { at: Date.now(), text }] } : a)));
  }, []);

  const value = useMemo(
    () => ({ ready, alerts, now, live, setLive, setStatus, addNote, resetDemo: init }),
    [ready, alerts, now, live, setStatus, addNote, init],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAlertStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAlertStore must be used inside <AlertStoreProvider>");
  return ctx;
}
