"use client";

import { useEffect, useRef, useState } from "react";
import { TABLES, aed, tableLabel, type Order } from "@/lib/menu";

export type OrderFilter = Order["status"];

type Props = {
  table: string;
  onAssign: (t: string) => void;
  onClose: () => void;
  orders: Order[];
  initialFilter: OrderFilter;
  onMarkSeen: (orderId: string) => void;
  unlocked: boolean;
  onUnlock: () => void;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function StaffDrawer({ table, onAssign, onClose, orders, initialFilter, onMarkSeen, unlocked, onUnlock }: Props) {
  const [pin, setPin] = useState("");
  const [filter, setFilter] = useState<OrderFilter>(initialFilter);
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState("");
  const pinRef = useRef<HTMLInputElement>(null);

  const shown = orders.filter((o) => o.status === filter);
  const count = (f: OrderFilter) => orders.filter((o) => o.status === f).length;

  useEffect(() => {
    pinRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The PIN is checked by the server (GET /api/order), so it never ships in the client bundle.
  const check = async (candidate: string) => {
    setStatus("checking");
    try {
      const res = await fetch("/api/order", { headers: { "x-staff-pin": candidate }, cache: "no-store" });
      if (res.status === 401) {
        setStatus("error");
        setMessage("Incorrect PIN. Try again.");
        setPin("");
        pinRef.current?.focus();
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("idle");
      onUnlock();
    } catch {
      setStatus("error");
      setMessage("Couldn't reach the server. Check the Wi-Fi.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="staff-title">
      <button type="button" aria-label="Close staff settings" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div
        className="relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl border border-b-0 border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,.5)] [animation:rise_.5s_var(--ease-out-expo)]"
        data-testid="staff-drawer"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 id="staff-title" className="font-display text-[1.75rem] font-semibold leading-none">Staff settings</h2>
          <button type="button" onClick={onClose} className="min-h-12 rounded-full border border-line px-5 text-sm font-semibold text-muted active:bg-surface-2">
            Done
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-6">
          {!unlocked ? (
            <form
              className="pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (pin.length === 4) check(pin);
              }}
            >
              <label htmlFor="staff-pin" className="block text-[0.9375rem] text-muted">Enter the 4-digit staff PIN</label>
              <input
                id="staff-pin"
                ref={pinRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(v);
                  if (status === "error") setStatus("idle");
                  if (v.length === 4) check(v);
                }}
                aria-invalid={status === "error"}
                aria-describedby="pin-msg"
                className="mt-3 h-16 w-full rounded-2xl border border-line bg-bg/60 text-center text-3xl tracking-[0.6em] text-text focus:border-gold/70 focus:outline-none"
              />
              <p id="pin-msg" role="status" className={`mt-2.5 min-h-5 text-sm ${status === "error" ? "text-danger" : "text-faint"}`}>
                {status === "error" ? message : status === "checking" ? "Checking…" : ""}
              </p>
            </form>
          ) : (
            <div className="flex flex-col gap-7 pt-1">
              <section>
                <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-gold">Orders</h3>
                <div role="tablist" aria-label="Order status" className="mt-3 grid grid-cols-2 gap-2">
                  {(["unseen", "seen"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f)}
                      className={`min-h-12 rounded-xl text-[0.9375rem] font-semibold tabular-nums transition-colors ${
                        filter === f ? "bg-gold text-on-gold" : "border border-line text-muted active:bg-surface-2"
                      }`}
                    >
                      {f === "unseen" ? "Unseen" : "Seen"} ({count(f)})
                    </button>
                  ))}
                </div>
                {shown.length === 0 ? (
                  <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-faint">
                    {filter === "unseen" ? "All caught up — no unseen orders." : "No seen orders yet."}
                  </p>
                ) : (
                  <ul role="tabpanel" className="mt-3 flex flex-col gap-2.5" data-testid="recent-orders">
                    {shown.map((o) => (
                      <li key={o.orderId} className="rounded-xl border border-line bg-bg/40 px-4 py-3.5" data-testid="staff-order">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-lg font-semibold">{tableLabel(o.tableNumber)}</span>
                          <time dateTime={o.timestamp} className="text-sm tabular-nums text-muted">{when(o.timestamp)}</time>
                        </div>
                        <p className="text-xs tabular-nums text-faint">{o.orderId}</p>
                        <ul className="mt-2.5 flex flex-col gap-1 text-[0.9375rem]">
                          {[...o.foodItems, ...o.sheeshaItems].map((l) => (
                            <li key={l.id} className="flex gap-2.5">
                              <span className="tabular-nums text-gold">{l.qty}×</span>
                              <span className="flex-1">{l.name}</span>
                              <span className="tabular-nums text-muted">{aed(l.lineTotal)}</span>
                            </li>
                          ))}
                        </ul>
                        {o.notes && <p className="mt-2 rounded-lg bg-gold/10 px-3 py-2 text-sm text-gold-hi">Note: {o.notes}</p>}
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/60 pt-3">
                          <span className="font-semibold tabular-nums">Total {aed(o.total)}</span>
                          {o.status === "unseen" && (
                            <button
                              type="button"
                              onClick={() => onMarkSeen(o.orderId)}
                              className="min-h-12 rounded-full bg-gold px-5 text-sm font-bold text-on-gold active:bg-gold-hi"
                            >
                              Mark as Seen
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-gold">This device&apos;s table</h3>
                <div className="mt-3 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Table number">
                  {TABLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={t === table}
                      onClick={() => onAssign(t)}
                      className={`min-h-12 rounded-xl text-[0.9375rem] font-semibold tabular-nums transition-colors ${
                        t === table ? "bg-gold text-on-gold" : "border border-line text-muted active:bg-surface-2"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-sm text-faint">Currently {tableLabel(table)}. Saved on this device.</p>
              </section>

              <section className="text-[0.9375rem] leading-relaxed text-muted">
                <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-gold">Lock this device to the menu</h3>
                <h4 className="mt-3 font-semibold text-text">iPhone — Guided Access</h4>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Settings → Accessibility → Guided Access → turn on, and set a passcode.</li>
                  <li>Open this page in Safari, Share → Add to Home Screen, and launch it from there.</li>
                  <li>Triple-click the side button → Start. Triple-click and enter the passcode to exit.</li>
                </ol>
                <h4 className="mt-4 font-semibold text-text">Android — App Pinning</h4>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Settings → Security → App pinning (Pin app) → turn on, with “Ask for PIN before unpinning”.</li>
                  <li>Open this page in Chrome → ⋮ → Add to Home screen, and launch it.</li>
                  <li>Open Recents, tap the app icon → Pin. To unpin, hold Back and Overview.</li>
                </ol>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
