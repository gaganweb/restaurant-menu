// Demo order store: orders live in this browser's localStorage (no database).
// shortcut: orders are per-device, so staff only see orders placed on the same browser; move to a real DB before going live.
import { ITEM_INDEX, aed, tableLabel, type Order, type PricedLine } from "./menu";

const KEY = "malang.orders";
const MAX = 50;

// Display ID: ML-<MMDD>-<HHMMSS>, Dubai time.
const dubai = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dubai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
export function orderCode(at: Date) {
  const p = Object.fromEntries(dubai.formatToParts(at).map((x) => [x.type, x.value]));
  return `ML-${p.month}${p.day}-${p.hour}${p.minute}${p.second}`;
}

export function priced(id: string, qty: number): PricedLine {
  const { item } = ITEM_INDEX.get(id)!;
  return { id, name: item.name, qty, price: item.price, lineTotal: qty * item.price };
}

const byName = (name: string, qty: number) => priced([...ITEM_INDEX.values()].find((e) => e.item.name === name)!.item.id, qty);

function sample(minsAgo: number, tableNumber: string, food: PricedLine[], sheesha: PricedLine[], notes: string, status: Order["status"]): Order {
  const at = new Date(Date.now() - minsAgo * 60_000);
  const total = [...food, ...sheesha].reduce((s, l) => s + l.lineTotal, 0);
  return { orderId: orderCode(at), tableNumber, foodItems: food, sheeshaItems: sheesha, notes, total, status, timestamp: at.toISOString() };
}

// Two sample orders so the demo isn't empty on first open (newest first).
export const seedOrders = (): Order[] => [
  sample(4, "T-07", [byName("Chicken Tikka Boti", 2), byName("Hummus", 1), byName("Iced Latte", 2)], [byName("Formula 69", 1)], "Medium spice, extra coal for the sheesha", "unseen"),
  sample(26, "T-12", [byName("Malai Tikka Boti", 1), byName("Blue Breeze", 2)], [], "", "seen"),
];

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Order[];
    const seeded = seedOrders();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    return seedOrders(); // private mode / blocked storage: still show the demo
  }
}

export function saveOrders(orders: Order[]): Order[] {
  const next = orders.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export const ORDERS_KEY = KEY;

/** Plain-text ticket for the server console, the Formspree email and the webhook ping. */
export function orderTicket(o: Order) {
  const rows = (title: string, lines: PricedLine[]) =>
    lines.length ? [title, ...lines.map((l) => `  ${l.qty} x ${l.name} — ${aed(l.lineTotal)}`)] : [];
  return [
    `MALANG LOUNGE — ${tableLabel(o.tableNumber).toUpperCase()}`,
    `Order ${o.orderId} · ${new Date(o.timestamp).toLocaleString("en-AE", { timeZone: "Asia/Dubai" })}`,
    "",
    ...rows("FOOD & BEVERAGES", o.foodItems),
    ...rows("SHEESHA", o.sheeshaItems),
    ...(o.notes ? ["", `NOTES: ${o.notes}`] : []),
    "",
    `TOTAL: ${aed(o.total)}`,
  ].join("\n");
}
