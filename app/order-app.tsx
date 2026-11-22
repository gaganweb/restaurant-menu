"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DEFAULT_TABLE,
  ITEM_INDEX,
  MENU,
  aed,
  isTable,
  tableLabel,
  type MenuItem,
  type MenuSection,
  type Order,
  type OrderPayload,
} from "@/lib/menu";
import { ORDERS_KEY, loadOrders, saveOrders } from "@/lib/order-store";
import { StaffDrawer, type OrderFilter } from "./staff-drawer";

const TABLE_KEY = "malang.table";

// Instant email via Formspree. Fire-and-forget: a failed email never blocks the order.
function emailOrder(o: Order) {
  const url = process.env.NEXT_PUBLIC_FORMSPREE_URL;
  if (!url) return;
  fetch(url, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `New order · ${tableLabel(o.tableNumber)} · ${aed(o.total)}`,
      Table: tableLabel(o.tableNumber),
      Order: o.orderId,
      Time: new Date(o.timestamp).toLocaleString("en-AE", { timeZone: "Asia/Dubai" }),
      Items: [...o.foodItems, ...o.sheeshaItems].map((l) => `${l.qty} x ${l.name} — ${aed(l.lineTotal)}`).join("\n"),
      Notes: o.notes || "—",
      Total: aed(o.total),
    }),
  })
    .then((r) => r.ok || console.warn(`[order] Formspree responded ${r.status}`))
    .catch((e) => console.warn("[order] Formspree failed:", e));
}

function StatusBar({ unseen, seen, onOpen }: { unseen: number; seen: number; onOpen: (f: OrderFilter) => void }) {
  return (
    <nav aria-label="Order status" className="border-b border-line/70 bg-surface">
      <div className="mx-auto flex max-w-md gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => onOpen("unseen")}
          aria-haspopup="dialog"
          data-testid="pill-unseen"
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition-colors ${
            unseen ? "bg-gold text-on-gold active:bg-gold-hi" : "border border-line text-muted active:bg-surface-2"
          }`}
        >
          {unseen > 0 && <span className="size-2 rounded-full bg-on-gold motion-safe:animate-pulse" aria-hidden="true" />}
          Unseen Orders ({unseen})
        </button>
        <button
          type="button"
          onClick={() => onOpen("seen")}
          aria-haspopup="dialog"
          data-testid="pill-seen"
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-3 text-sm font-semibold text-text active:bg-surface-2"
        >
          Seen Orders ({seen})
        </button>
      </div>
    </nav>
  );
}

/* ── Icons: one 1.75 stroke family ─────────────────────────────────────── */
const Icon = ({ d, className = "size-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);
const PLUS = "M12 5v14M5 12h14";
const MINUS = "M5 12h14";
const CHEVRON = "m6 9 6 6 6-6";
const CHECK = "m5 12.5 4.5 4.5L19 7";

export function Logo({ size = 44 }: { size?: number }) {
  // Crop of the "Malang" mural (turbaned face) from the venue's back wall.
  return (
    <span
      role="img"
      aria-label="Malang Lounge logo"
      className="block shrink-0 rounded-full ring-1 ring-gold/60 shadow-[0_4px_14px_rgba(0,0,0,.45)]"
      style={{
        width: size,
        height: size,
        background: "url(/images/malang-mural.jpg) 44.8% 34% / 253% auto no-repeat",
      }}
    />
  );
}

function Collapsible({ open, children, id }: { open: boolean; children: ReactNode; id: string }) {
  return (
    <div
      id={id}
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function Stepper({ item, qty, onChange }: { item: MenuItem; qty: number; onChange: (q: number) => void }) {
  return (
    <div className="flex items-center rounded-full border border-line bg-bg/60" role="group" aria-label={`Quantity for ${item.name}`}>
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={qty === 0}
        aria-label={`Remove one ${item.name}`}
        className="grid size-12 place-items-center rounded-full text-text transition-colors active:bg-surface-2 disabled:text-faint/50"
      >
        <Icon d={MINUS} />
      </button>
      <output aria-live="polite" className={`w-7 text-center text-base font-semibold tabular-nums ${qty ? "text-gold-hi" : "text-faint"}`}>
        {qty}
      </output>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={qty >= 50}
        aria-label={`Add one ${item.name}`}
        className="grid size-12 place-items-center rounded-full text-gold-hi transition-colors active:bg-surface-2 disabled:text-faint/50"
      >
        <Icon d={PLUS} />
      </button>
    </div>
  );
}

function ItemRow({ item, qty, onChange }: { item: MenuItem; qty: number; onChange: (q: number) => void }) {
  return (
    <li
      className={`rounded-xl px-4 py-3.5 transition-colors duration-300 ${qty ? "bg-gold/[.09] ring-1 ring-gold/30" : ""}`}
      data-testid="menu-item"
    >
      <div className="flex items-baseline gap-2">
        <h4 className="text-[1.0625rem] font-semibold leading-snug text-text">{item.name}</h4>
        {item.tag && (
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
            {item.tag}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-base font-semibold tabular-nums text-gold">{aed(item.price)}</span>
        <Stepper item={item} qty={qty} onChange={onChange} />
      </div>
    </li>
  );
}

function MenuSectionPanel({
  section,
  qty,
  setQty,
}: {
  section: MenuSection;
  qty: Record<string, number>;
  setQty: (id: string, q: number) => void;
}) {
  const [open, setOpen] = useState(section.id === "food");
  const [cat, setCat] = useState(section.categories[0].id);
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());

  const count = (items: MenuItem[]) => items.reduce((s, i) => s + (qty[i.id] ?? 0), 0);
  const allItems = section.categories.flatMap((c) => c.groups.flatMap((g) => g.items));
  const selected = count(allItems);
  const category = section.categories.find((c) => c.id === cat)!;
  const panelId = `section-${section.id}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface" data-testid={`section-${section.id}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[72px] w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="flex-1">
          <span className="block font-display text-[1.75rem] font-semibold leading-none tracking-[-0.01em] text-text">{section.title}</span>
          <span className="mt-1.5 block text-sm text-faint">
            {allItems.length} items
            {selected > 0 && <span className="text-gold-hi"> · {selected} selected</span>}
          </span>
        </span>
        <span className={`grid size-10 place-items-center rounded-full border border-line text-gold transition-transform duration-500 ease-out-expo ${open ? "rotate-180" : ""}`}>
          <Icon d={CHEVRON} />
        </span>
      </button>

      <Collapsible open={open} id={panelId}>
        <div className="border-t border-line">
          <div role="tablist" aria-label={`${section.title} categories`} className="flex gap-2 overflow-x-auto px-4 py-3.5 [scrollbar-width:none]">
            {section.categories.map((c) => {
              const n = count(c.groups.flatMap((g) => g.items));
              const active = c.id === cat;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCat(c.id)}
                  className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold transition-colors duration-300 ${
                    active ? "bg-gold text-on-gold" : "border border-line text-muted active:bg-surface-2"
                  }`}
                >
                  {c.label}
                  {n > 0 && (
                    <span className={`min-w-5 rounded-full px-1.5 text-xs leading-5 tabular-nums ${active ? "bg-on-gold/15" : "bg-gold/20 text-gold-hi"}`}>{n}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" aria-label={category.label} className="px-2 pb-3">
            {category.groups.map((g) => {
              const key = `${category.id}:${g.title}`;
              const gOpen = !closedGroups.has(key);
              const n = count(g.items);
              const list = (
                <ul className="flex flex-col gap-1">
                  {g.items.map((item) => (
                    <ItemRow key={item.id} item={item} qty={qty[item.id] ?? 0} onChange={(q) => setQty(item.id, q)} />
                  ))}
                </ul>
              );
              if (category.groups.length === 1) return <div key={key}>{list}</div>;
              const gid = `group-${section.id}-${category.id}-${g.title.replace(/\W+/g, "-")}`;
              return (
                <div key={key} className="border-b border-line/60 last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={gOpen}
                    aria-controls={gid}
                    onClick={() =>
                      setClosedGroups((s) => {
                        const next = new Set(s);
                        if (gOpen) next.add(key);
                        else next.delete(key);
                        return next;
                      })
                    }
                    className="flex min-h-14 w-full items-center gap-3 px-3 pt-3 pb-2 text-left"
                  >
                    <span className="flex-1 text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-gold">{g.title}</span>
                    <span className="text-sm tabular-nums text-faint">
                      {n > 0 ? <span className="text-gold-hi">{n} selected</span> : g.items.length}
                    </span>
                    <span className={`text-faint transition-transform duration-500 ease-out-expo ${gOpen ? "rotate-180" : ""}`}>
                      <Icon d={CHEVRON} className="size-4" />
                    </span>
                  </button>
                  <Collapsible open={gOpen} id={gid}>
                    <div className="pb-2">{list}</div>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </div>
      </Collapsible>
    </section>
  );
}

function prepNote(o: Order) {
  const kitchen = o.foodItems.some((l) => !/^(cc|tea|mock|smooth)-/.test(l.id));
  const drinks = o.foodItems.some((l) => /^(cc|tea|mock|smooth)-/.test(l.id));
  const parts = [
    kitchen && "Kitchen dishes usually arrive in 15–20 minutes",
    drinks && "drinks in 5–10 minutes",
    o.sheeshaItems.length > 0 && "sheesha in about 10 minutes",
  ].filter(Boolean) as string[];
  const s = parts.join(", ").replace(/, ([^,]*)$/, " and $1");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function Confirmation({ order, onReset }: { order: Order; onReset: () => void }) {
  const lines = [...order.foodItems, ...order.sheeshaItems];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center text-center [animation:rise_.8s_var(--ease-out-expo)]" data-testid="confirmation">
        <Logo size={88} />
        <div className="mt-7 grid size-12 place-items-center rounded-full bg-gold text-on-gold">
          <Icon d={CHECK} className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.02em] text-balance">Your order is with us</h1>
        <p className="mt-3 max-w-[30ch] text-base leading-relaxed text-muted">
          Thank you for dining at Malang Lounge Restaurant &amp; Cafe. {prepNote(order)}
        </p>

        <dl className="mt-8 grid w-full grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-left">
          <div className="bg-surface px-4 py-3.5">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-faint">Order</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums" data-testid="order-id">{order.orderId}</dd>
          </div>
          <div className="bg-surface px-4 py-3.5">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-faint">Table</dt>
            <dd className="mt-1 text-lg font-semibold">{tableLabel(order.tableNumber)}</dd>
          </div>
        </dl>

        <ul className="mt-4 w-full divide-y divide-line/60 rounded-2xl border border-line bg-surface px-4 text-left">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3 py-3 text-[0.9375rem]">
              <span className="tabular-nums text-gold">{l.qty}×</span>
              <span className="flex-1">{l.name}</span>
              <span className="tabular-nums text-muted">{aed(l.lineTotal)}</span>
            </li>
          ))}
          <li className="flex justify-between py-3.5 font-semibold">
            <span>Total</span>
            <span className="tabular-nums text-gold-hi">{aed(order.total)}</span>
          </li>
        </ul>
        {order.notes && <p className="mt-3 w-full text-left text-sm text-muted">Notes: {order.notes}</p>}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-8 min-h-14 w-full rounded-full bg-gold text-base font-bold text-on-gold transition-colors active:bg-gold-hi"
      >
        Place Another Order
      </button>
    </main>
  );
}

export default function OrderApp() {
  const [table, setTable] = useState(DEFAULT_TABLE);
  const [qty, setQtyMap] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [staffOpen, setStaffOpen] = useState<OrderFilter | null>(null);
  const [staffUnlocked, setStaffUnlocked] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    setOrders(loadOrders());
    // Keep other tabs on this browser (e.g. a staff tab) in sync.
    const onStorage = (e: StorageEvent) => e.key === ORDERS_KEY && setOrders(loadOrders());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const unseen = orders.filter((o) => o.status === "unseen").length;
  const markSeen = (id: string) =>
    setOrders((list) => saveOrders(list.map((o) => (o.orderId === id ? { ...o, status: "seen" } : o))));

  // URL ?table=T-07 wins (and is remembered); otherwise the device's saved table.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("table")?.toUpperCase();
    let saved: string | null = null;
    try {
      if (isTable(fromUrl)) localStorage.setItem(TABLE_KEY, fromUrl);
      saved = localStorage.getItem(TABLE_KEY);
    } catch {}
    const next = isTable(fromUrl) ? fromUrl : isTable(saved) ? saved : DEFAULT_TABLE;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    setTable(next);
  }, []);

  const assignTable = (t: string) => {
    setTable(t);
    try {
      localStorage.setItem(TABLE_KEY, t);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("table", t);
    window.history.replaceState(null, "", url);
  };

  const setQty = (id: string, q: number) =>
    setQtyMap((m) => {
      const next = { ...m };
      if (q <= 0) delete next[id];
      else next[id] = Math.min(q, 50);
      return next;
    });

  const { count, total } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const [id, q] of Object.entries(qty)) {
      count += q;
      total += q * (ITEM_INDEX.get(id)?.item.price ?? 0);
    }
    return { count, total };
  }, [qty]);

  const onLogoTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      setStaffOpen("unseen");
    }
  };

  const submit = async () => {
    if (!count || submitting) return;
    setSubmitting(true);
    setError(null);
    const lines = (section: "food" | "sheesha") =>
      Object.entries(qty)
        .filter(([id]) => ITEM_INDEX.get(id)?.section === section)
        .map(([id, q]) => ({ id, qty: q }));
    const payload: OrderPayload = {
      tableNumber: table,
      foodItems: lines("food"),
      sheeshaItems: lines("sheesha"),
      notes: notes.trim(),
      total,
      timestamp: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      const placed = data as Order;
      setOrders((list) => saveOrders([placed, ...list]));
      emailOrder(placed);
      setOrder(placed);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "We couldn't reach the order desk. Check the Wi-Fi and try again, or call a host."
          : `Your order wasn't sent: ${(e as Error).message}. Please try again or call a host.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setQtyMap({});
    setNotes("");
    setOrder(null);
    setError(null);
    window.scrollTo({ top: 0 });
  };

  const drawer = staffOpen && (
    <StaffDrawer
      table={table}
      onAssign={assignTable}
      onClose={() => setStaffOpen(null)}
      orders={orders}
      initialFilter={staffOpen}
      onMarkSeen={markSeen}
      unlocked={staffUnlocked}
      onUnlock={() => setStaffUnlocked(true)}
    />
  );

  if (order)
    return (
      <>
        <Confirmation order={order} onReset={reset} />
        {drawer}
      </>
    );

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <StatusBar unseen={unseen} seen={orders.length - unseen} onOpen={setStaffOpen} />
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button type="button" onClick={onLogoTap} aria-label="Malang Lounge" className="rounded-full" data-testid="logo">
            <Logo />
          </button>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-display text-[1.375rem] font-semibold tracking-[-0.01em]">Malang Lounge</p>
            <p className="truncate text-xs font-medium tracking-[0.06em] text-muted">Restaurant &amp; Cafe</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold-hi tabular-nums" data-testid="table-badge">
            {tableLabel(table)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6 pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
        <h1 className="font-display text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.02em] text-balance">
          Order from your table
        </h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          Choose below and we&apos;ll bring it straight to {tableLabel(table)}.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {MENU.map((s) => (
            <MenuSectionPanel key={s.id} section={s} qty={qty} setQty={setQty} />
          ))}

          <div className="rounded-2xl border border-line bg-surface px-5 py-4">
            <label htmlFor="notes" className="block font-display text-[1.375rem] font-semibold">
              Special instructions
            </label>
            <p className="mt-1 text-sm text-faint">Optional</p>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Spice level, ice preference, coal change, allergies…"
              className="mt-3 w-full resize-none rounded-xl border border-line bg-bg/60 px-4 py-3 text-base text-text placeholder:text-faint focus:border-gold/70 focus:outline-none"
            />
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto max-w-md px-4 pt-3 pb-3">
          {error && (
            <p role="alert" className="mb-2.5 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm leading-snug text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="min-w-0 leading-tight" aria-live="polite">
              <p className="text-sm text-muted" data-testid="summary-count">
                {count === 0 ? "No items yet" : `${count} item${count === 1 ? "" : "s"}`}
              </p>
              <p className="text-xl font-bold tabular-nums text-text" data-testid="summary-total">{aed(total)}</p>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!count || submitting}
              className="min-h-14 flex-1 rounded-full bg-gold px-5 text-base font-bold text-on-gold shadow-[0_6px_20px_rgba(220,170,82,.25)] transition-[background-color,opacity,box-shadow] active:bg-gold-hi disabled:bg-surface-2 disabled:text-faint disabled:shadow-none"
            >
              {submitting ? "Sending…" : "Place Table Order"}
            </button>
          </div>
        </div>
      </div>
      {drawer}
    </>
  );
}
