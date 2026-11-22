import { expect, test } from "@playwright/test";

// Run `npm run build` first; the config serves the production build.

test("header shows logo, venue and table from ?table, remembered across reloads", async ({ page }) => {
  await page.goto("/?table=T-07");
  await expect(page.getByTestId("logo")).toBeVisible();
  await expect(page.getByText("Malang Lounge", { exact: true })).toBeVisible();
  await expect(page.getByTestId("table-badge")).toHaveText("Table 07");
  await page.goto("/");
  await expect(page.getByTestId("table-badge")).toHaveText("Table 07");
});

test("food dropdown categories, separate sheesha dropdown, steppers and order flow", async ({ page }) => {
  await page.goto("/?table=T-03");
  const food = page.getByTestId("section-food");
  const sheesha = page.getByTestId("section-sheesha");

  for (const c of ["Starters", "Main Course", "Drinks", "Desserts"]) {
    await expect(food.getByRole("tab", { name: c })).toBeVisible();
  }
  // Sheesha starts collapsed and opens independently of food.
  const sheeshaToggle = sheesha.getByRole("button", { name: /Sheesha/ });
  await expect(sheeshaToggle).toHaveAttribute("aria-expanded", "false");
  await sheeshaToggle.click();
  await expect(sheeshaToggle).toHaveAttribute("aria-expanded", "true");
  for (const c of ["Signature Blends", "Classic Flavors", "Ice / Fruit Heads"]) {
    await expect(sheesha.getByRole("tab", { name: c })).toBeVisible();
  }

  // Steppers: add 2 Punjabi Samosas (26), remove 1 -> 1; add Formula 69 (69).
  await food.getByRole("button", { name: "Add one Punjabi Samosas" }).click();
  await food.getByRole("button", { name: "Add one Punjabi Samosas" }).click();
  await expect(page.getByTestId("summary-total")).toHaveText("AED 52");
  await food.getByRole("button", { name: "Remove one Punjabi Samosas" }).click();
  await food.getByRole("tab", { name: "Drinks" }).click();
  await food.getByRole("button", { name: "Add one Iced Latte" }).click();
  await sheesha.getByRole("button", { name: "Add one Formula 69" }).click();
  await expect(page.getByTestId("summary-count")).toHaveText("3 items");
  await expect(page.getByTestId("summary-total")).toHaveText("AED 127");

  await page.getByLabel("Special instructions").fill("Medium spice, extra coal");
  await page.getByRole("button", { name: "Place Table Order" }).click();

  const done = page.getByTestId("confirmation");
  await expect(done).toBeVisible();
  await expect(page.getByTestId("order-id")).toHaveText(/^ML-\d{4}-\d{3,}$/);
  await expect(done.getByText("Table 03")).toBeVisible();
  await expect(done.getByText("AED 127")).toBeVisible();

  await page.getByRole("button", { name: "Place Another Order" }).click();
  await expect(page.getByTestId("summary-total")).toHaveText("AED 0");
});

test("place button is disabled with an empty order", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Place Table Order" })).toBeDisabled();
});

test("API re-prices on the server and rejects bad input", async ({ request }) => {
  const ok = await request.post("/api/order", {
    data: { tableNumber: "T-12", foodItems: [{ id: "st-hummus", qty: 2 }], sheeshaItems: [], notes: "", total: 1, timestamp: "" },
  });
  expect(ok.status()).toBe(201);
  expect((await ok.json()).total).toBe(38);

  const bad = await request.post("/api/order", { data: { tableNumber: "T-99", foodItems: [{ id: "st-hummus", qty: 1 }] } });
  expect(bad.status()).toBe(400);
  const wrongSection = await request.post("/api/order", { data: { tableNumber: "T-01", foodItems: [{ id: "blend-cool-kiwi", qty: 1 }] } });
  expect(wrongSection.status()).toBe(400);
  expect((await request.get("/api/order")).status()).toBe(401);
  expect((await request.get("/api/order", { headers: { "x-staff-pin": "1234" } })).status()).toBe(200);
});

test("staff drawer: 5 logo taps, PIN gate, reassign table, recent orders", async ({ page }) => {
  await page.goto("/?table=T-01");
  const logo = page.getByTestId("logo");
  for (let i = 0; i < 4; i++) await logo.click();
  await expect(page.getByTestId("staff-drawer")).toHaveCount(0);
  await logo.click();

  const drawer = page.getByTestId("staff-drawer");
  await expect(drawer).toBeVisible();
  await drawer.getByLabel("Enter the 4-digit staff PIN").fill("0000");
  await expect(drawer.getByText("Incorrect PIN. Try again.")).toBeVisible();
  await drawer.getByLabel("Enter the 4-digit staff PIN").fill("1234");

  await drawer.getByRole("radio", { name: "T-22" }).click();
  await expect(page.getByTestId("table-badge")).toHaveText("Table 22");
  await expect(drawer.getByTestId("recent-orders")).toContainText("Table 07"); // seeded unseen order
  await expect(drawer.getByText("iPhone — Guided Access")).toBeVisible();
  await drawer.getByRole("button", { name: "Done" }).click();
  await expect(drawer).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("table-badge")).toHaveText("Table 22");
});

test("status pills: seeded counts, new order counts as unseen, Mark as Seen updates both", async ({ page }) => {
  await page.goto("/?table=T-05");
  const unseen = page.getByTestId("pill-unseen");
  const seen = page.getByTestId("pill-seen");
  await expect(unseen).toHaveText("Unseen Orders (1)");
  await expect(seen).toHaveText("Seen Orders (1)");

  await page.getByTestId("section-food").getByRole("button", { name: "Add one Hummus" }).click();
  await page.getByRole("button", { name: "Place Table Order" }).click();
  await expect(page.getByTestId("confirmation")).toBeVisible();
  await page.getByRole("button", { name: "Place Another Order" }).click();
  await expect(unseen).toHaveText("Unseen Orders (2)");

  await unseen.click();
  const drawer = page.getByTestId("staff-drawer");
  await drawer.getByLabel("Enter the 4-digit staff PIN").fill("1234");
  const cards = drawer.getByTestId("staff-order");
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Table 05");
  await expect(cards.first()).toContainText("1×HummusAED 19");
  await cards.first().getByRole("button", { name: "Mark as Seen" }).click();
  await expect(cards).toHaveCount(1);
  await expect(drawer.getByRole("tab", { name: "Seen (2)" })).toBeVisible();
  await drawer.getByRole("button", { name: "Done" }).click();
  await expect(unseen).toHaveText("Unseen Orders (1)");
  await expect(seen).toHaveText("Seen Orders (2)");

  // Survives a reload (localStorage), and the drawer stays unlocked only for the session.
  await page.reload();
  await expect(seen).toHaveText("Seen Orders (2)");
  await seen.click();
  await expect(drawer.getByLabel("Enter the 4-digit staff PIN")).toBeVisible();
});
