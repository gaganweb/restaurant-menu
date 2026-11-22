# Progress — Malang Lounge Table Ordering

_Last updated: 2026-11-22_

## Completed

- **Ordering UI**: `app/order-app.tsx`, a mobile-first single page with:
  - a sticky header showing the mural logo, the venue name and a table badge;
  - a collapsible Food & Beverages section with Starters / Main Course / Drinks / Desserts tabs and sub-groups;
  - a separate collapsible Sheesha section with Signature Blends / Classic Flavors / Ice / Fruit Heads tabs;
  - `- / qty / +` steppers, a Special Instructions field, and a sticky bottom bar with the item count, AED total and **Place Table Order**;
  - a confirmation screen showing the order ID, table, items and a prep note, with **Place Another Order**.
- **Table number**: read from `?table=T-xx` and saved to `localStorage` (defaults to T-01). When staff reassign the table, the URL is updated.
- **Staff drawer**: `app/staff-drawer.tsx`, opened by tapping the logo 5 times. It is protected by a PIN, which the server checks (`STAFF_PIN` environment variable, default `1234`). It has:
  - a table picker for T-01 to T-30;
  - a list of recent orders with a refresh button;
  - instructions for iOS Guided Access and Android App Pinning.
- **API**: `app/api/order/route.ts`.
  - `POST` validates the table, items and quantities, and recalculates the total from server prices.
  - Orders are kept in memory (last 50) and a ticket is printed to the console.
  - `GET` returns recent orders and requires the `x-staff-pin` header.
  - Commented placeholders for Resend / nodemailer email and ntfy.sh / Twilio SMS.
- **Menu data**: `lib/menu.ts`, transcribed from the venue's menu boards in `public/images/`.
- **Kiosk behaviour**: pull-to-refresh is disabled, the whole UI is non-selectable except the text fields, and the layout respects the phone's safe areas.
- **Theme**: espresso / amber / off-white palette taken from the interior photos; fonts are Cormorant Garamond and Manrope.
- **Verification**:
  - `npm run build` succeeds with no TypeScript errors, and ESLint is clean.
  - `npm run test:e2e` passes all 10 tests at 390×844 in Chromium and WebKit.
  - Polish pass: screenshots of each screen reviewed and fixed; the impeccable design detector reports no issues.

## Remaining tasks

1. **Replace placeholder menu entries** in `lib/menu.ts` (each marked `shortcut: placeholder`):
   - Desserts: all 4 items and their prices are invented.
   - Classic Flavors sheesha: invented, priced at AED 69.
   - Ice Hose add-on: AED 15, invented.
2. **Confirm unclear menu wording** with the venue:
   - "s.water" in the sheesha blend descriptions;
   - the spelling of "Insominia";
   - descriptions for mocktails whose ingredients aren't listed (Blue Breeze, Twista, Rail Splitter, Night Sea).
3. **Wire up notifications** by filling in the email / SMS placeholders in `app/api/order/route.ts` and adding the environment variables (`RESEND_API_KEY` / `SMTP_URL`, `NTFY_TOPIC` / Twilio credentials).
4. **Persist orders**: demo uses localStorage (per device). Needs a shared database before going live.
5. **Set a real staff PIN** through the `STAFF_PIN` environment variable on the server.
6. **Test on real table phones** (iOS Safari and Android Chrome) over the venue Wi-Fi:
   - Add to Home Screen, then Guided Access / App Pinning;
   - safe-area insets and readability in dim light.
7. **Optional**:
   - commit the work (nothing is committed yet);
   - run `/impeccable init` to create a PRODUCT.md, and `/impeccable doctor` for its setup warnings.

## 2026-11-22 update

- **Menu (items 1–2)**: no public menu could be verified. eateasy.ae returned a 500 error, malanglounge.ae doesn't resolve in DNS, the Zomato order page timed out, and Restaurant Guru has no items. Everything unverified is marked `// TODO: confirm with venue` in `lib/menu.ts`: the desserts, the Classic Flavors, the Ice Hose price, the 4 mocktails and "s.water" (kept as written). "Insominia" is now spelled "Insomnia", with a TODO noting how the board spells it.
- **Database (item 4)**: tried Postgres via Drizzle, then removed it on 2026-11-23 (see below).

## 2026-11-23 update: demo mode with no database

This is a client demo, so there are no database dependencies.

- **Order store**: `lib/order-store.ts` keeps orders in this browser's `localStorage` (key `malang.orders`, last 50).
  - On first load it seeds 2 sample orders: Table 07 (unseen) and Table 12 (seen).
  - Orders are per device: staff only see orders placed in the same browser. Move to a real database before going live.
- **`/api/order`**:
  - `POST` still validates the order and re-prices it from the server menu, then returns it. The browser saves it.
  - `GET` checks the staff PIN only.
- **Status bar**: "Unseen Orders (X)" and "Seen Orders (Y)" pills at the top of the header.
  - Either pill opens the Staff Drawer filtered to that status, after the PIN is entered once per page load.
  - Each order card shows the table, time, items, notes and total, plus a **Mark as Seen** button.
- **Email**: on submit, the browser posts the order to `NEXT_PUBLIC_FORMSPREE_URL` with these fields: Table, Order, Time, Items, Notes, Total. If the variable is empty, the email is skipped. A failure never blocks the order.
- **Phone ping**: if `WHATSAPP_WEBHOOK_URL` is set (CallMeBot or Telegram), the server sends a GET with the order as `?text=` after responding. Failures are only logged.
- **Environment**: see `.env.example`. `.env.local` contains `STAFF_PIN=1234` and empty Formspree and webhook values. After changing `NEXT_PUBLIC_*` values, restart the dev server or rebuild.
- **Tests**: `npm run test:e2e` runs 12 tests (6 in Chromium, 6 in WebKit), all passing, and no longer needs a database.
