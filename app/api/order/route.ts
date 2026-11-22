import { after } from "next/server";
import { ITEM_INDEX, isTable, type Order, type OrderLine, type PricedLine } from "@/lib/menu";
import { orderCode, orderTicket, priced } from "@/lib/order-store";

// No database in the demo: this validates and prices the order, pings the optional webhook,
// and returns the order for the browser to keep in localStorage.

const STAFF_PIN = process.env.STAFF_PIN ?? "1234";

class BadRequest extends Error {}

function priceLines(raw: unknown, section: "food" | "sheesha"): PricedLine[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new BadRequest(`${section}Items must be an array`);
  return raw.map((line: Partial<OrderLine>) => {
    const entry = typeof line?.id === "string" ? ITEM_INDEX.get(line.id) : undefined;
    if (!entry || entry.section !== section) throw new BadRequest(`Unknown ${section} item: ${String(line?.id)}`);
    const qty = line.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 50) {
      throw new BadRequest(`Invalid quantity for ${entry.item.name}`);
    }
    return priced(entry.item.id, qty);
  });
}

// CallMeBot and Telegram both take the message as a `text` query param on a GET.
async function pingWebhook(text: string) {
  const hook = process.env.WHATSAPP_WEBHOOK_URL;
  if (!hook) return;
  try {
    const url = new URL(hook);
    url.searchParams.set("text", text);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) console.warn(`[order] webhook responded ${res.status}`);
  } catch (err) {
    console.warn("[order] webhook failed:", (err as Error).message);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (!isTable(body.tableNumber)) throw new BadRequest("Invalid table number");
    const foodItems = priceLines(body.foodItems, "food");
    const sheeshaItems = priceLines(body.sheeshaItems, "sheesha");
    if (!foodItems.length && !sheeshaItems.length) throw new BadRequest("Order is empty");
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

    // Prices come from the server menu, never from the client.
    const total = [...foodItems, ...sheeshaItems].reduce((s, l) => s + l.lineTotal, 0);
    if (typeof body.total === "number" && body.total !== total) {
      console.warn(`[order] client total ${body.total} != server total ${total}; using server total`);
    }

    const now = new Date();
    const order: Order = {
      orderId: orderCode(now),
      tableNumber: body.tableNumber,
      foodItems,
      sheeshaItems,
      notes,
      total,
      status: "unseen",
      timestamp: now.toISOString(),
    };
    const text = orderTicket(order);
    console.log(`\n${text}\n`);
    after(() => pingWebhook(text)); // runs after the response, so it never delays or blocks the order

    return Response.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof BadRequest) return Response.json({ error: err.message }, { status: 400 });
    throw err;
  }
}

// Staff drawer PIN check: the PIN stays on the server, never in the client bundle.
export async function GET(request: Request) {
  const ok = request.headers.get("x-staff-pin") === STAFF_PIN;
  return Response.json(ok ? { ok } : { error: "Incorrect PIN" }, { status: ok ? 200 : 401 });
}
