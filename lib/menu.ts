// Menu data shared by the client UI and /api/order (server re-prices every order from here).
// Items and prices transcribed from the venue's menu boards (public/images/Malang-Lounge-*.png),
// except entries marked `shortcut: placeholder`.

export type Tag = "Veg" | "Spicy" | "Seafood" | "Signature";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // AED
  tag?: Tag;
};

export type MenuGroup = { title: string; items: MenuItem[] };
export type MenuCategory = { id: string; label: string; groups: MenuGroup[] };
export type MenuSection = { id: "food" | "sheesha"; title: string; categories: MenuCategory[] };

type Row = [name: string, price: number, description: string, tag?: Tag];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function group(key: string, title: string, rows: Row[]): MenuGroup {
  return {
    title,
    items: rows.map(([name, price, description, tag]) => ({
      id: `${key}-${slug(name)}`,
      name,
      price,
      description,
      tag,
    })),
  };
}

const food: MenuSection = {
  id: "food",
  title: "Food & Beverages",
  categories: [
    {
      id: "starters",
      label: "Starters",
      groups: [
        group("st", "Hot Starters", [
          ["Chicken Strips with Fries", 41, "Crisp golden chicken strips with French fries."],
          ["Dynamite Shrimps", 46, "Crispy shrimps tossed in creamy, fiery dynamite sauce.", "Spicy"],
          ["Crispy Fried Fish", 46, "Lightly battered fish, fried until golden.", "Seafood"],
          ["Chicken Nuggets with Fries", 34, "Bite-size chicken nuggets with French fries."],
          ["Honey Wings", 41, "Chicken wings glazed in sticky honey."],
          ["Tandoori BBQ Wings", 39, "Wings marinated in tandoori spices, char-grilled.", "Spicy"],
          ["Finger Fish with Fries", 45, "Crumbed fish fingers with French fries.", "Seafood"],
          ["Dynamite Chicken", 45, "Crispy chicken bites in house dynamite sauce.", "Spicy"],
          ["Honey Fish", 45, "Fried fish finished with a honey glaze.", "Seafood"],
          ["Hara Bhara Kababs", 32, "Spinach, pea and potato patties with green herbs.", "Veg"],
          ["Punjabi Samosas", 26, "Flaky pastry filled with spiced potato and peas.", "Veg"],
          ["Veg Cutlets", 26, "Golden vegetable cutlets, crisp outside.", "Veg"],
          ["Shami Kababs", 27, "Pan-fried minced meat and lentil kababs."],
          ["Hummus", 19, "Creamy chickpea and tahini dip, by the plate.", "Veg"],
        ]),
        group("soup", "Soups", [
          ["Hot & Sour Soup — Veg", 29, "Vinegar, hot sauce and spices.", "Veg"],
          ["Hot & Sour Soup — Chicken", 31, "Vinegar, hot sauce, spices and chicken.", "Spicy"],
          ["Chicken & Corn Soup", 31, "Chicken, sweet corn, chicken stock."],
          ["Lentil Soup", 29, "Mixed lentils, vegetable stock, black pepper.", "Veg"],
          ["19B Soup", 36, "Shrimps, beef, chicken, carrot, egg, green onion."],
          ["Malang Special Soup", 36, "Chicken, prawns, carrot, mushroom, sweet corn, spring onion.", "Signature"],
        ]),
        group("salad", "Salads", [
          ["Mexican Macaroni Salad", 29, "Macaroni, bell pepper, olives, corn, herbs, mayonnaise.", "Veg"],
          ["Greek Salad", 29, "Iceberg, lettuce, bell peppers, cucumber, tomato, olives, feta.", "Veg"],
          ["Fattoush Salad", 32, "Iceberg, lettuce, cucumber, tomato, pita crisps, lemon dressing.", "Veg"],
          ["Caesar Salad", 29, "Iceberg, olives, mushrooms, salad leaves, Caesar dressing."],
          ["Russian Salad", 32, "Carrot, cabbage, potato, peas, apple, mayonnaise dressing.", "Veg"],
          ["Malang Special Salad", 30, "Apple, cabbage, chicken, olives, pineapple, mayonnaise.", "Signature"],
          ["Fresh Green Salad", 22, "Iceberg, lettuce, cucumber, tomato, carrot, corn, lemon.", "Veg"],
          ["Fresh Fruit Salad", 35, "A mix of seasonal fruits.", "Veg"],
          ["Chana Chaat", 26, "Chickpeas, tomato, onion, cucumber, green chutney, lemon.", "Veg"],
        ]),
      ],
    },
    {
      id: "mains",
      label: "Main Course",
      groups: [
        group("bbqc", "BBQ — Chicken", [
          ["Chicken Tikka Leg or Breast", 32, "Classic tikka, charcoal-grilled on the bone.", "Spicy"],
          ["Malai Tikka Boti", 45, "Creamy, mildly spiced boneless chicken."],
          ["Chicken Cheese Boti", 47, "Boneless chicken boti with a cheesy marinade."],
          ["Chicken Tikka Boti", 41, "Boneless chicken tikka off the grill.", "Spicy"],
          ["Chicken Achari Boti", 45, "Tangy pickle-spiced chicken boti.", "Spicy"],
          ["Chicken Shish Tawook", 45, "Garlic-and-lemon marinated chicken skewers."],
          ["Turkish Chicken Kabab", 45, "Turkish-style minced chicken kabab."],
          ["Chicken Shashlik Boti", 45, "Chicken with peppers and onion, grilled on skewers."],
          ["Hariyali Chicken Boti", 43, "Chicken in a fresh mint and coriander marinade."],
          ["Chicken Seekh Kabab", 46, "Spiced minced chicken grilled on skewers."],
          ["Chicken Cheese Kabab", 49, "Minced chicken kabab with a molten cheese centre."],
          ["Chicken Chargha — Half", 37, "Whole-spiced, steamed then fried chicken."],
          ["Chicken Chargha — Full", 67, "Whole-spiced, steamed then fried chicken."],
          ["Charcoal Chicken with Fries — Half", 37, "Charcoal-roasted chicken with French fries."],
          ["Charcoal Chicken with Fries — Full", 67, "Charcoal-roasted chicken with French fries."],
        ]),
        group("bbqm", "BBQ — Mutton, Beef & Seafood", [
          ["Chicken Chapli Kabab", 45, "Flat Peshawari-style chicken kabab."],
          ["Mutton Tikka Boti", 54, "Charcoal-grilled boneless mutton."],
          ["Mutton Seekh Kabab", 54, "Spiced minced mutton on skewers."],
          ["Mutton Leg with Pulao Rice", 129, "Slow-cooked mutton leg served with pulao.", "Signature"],
          ["Mutton Chapli Kabab", 54, "Flat Peshawari-style mutton kabab."],
          ["Mutton Namkeen Tikka (per kg)", 149, "Salt-and-pepper mutton, roasted slowly. Takes about 1 hour.", "Signature"],
          ["Beef Seekh Kabab", 48, "Spiced minced beef on skewers."],
          ["Beef Chapli Kabab", 48, "Flat Peshawari-style beef kabab."],
          ["Grilled Prawns", 56, "Marinated prawns off the grill.", "Seafood"],
          ["Lahori Grilled Fish — Half", 59, "Lahori-spiced fish, grilled.", "Seafood"],
          ["Lahori Grilled Fish — Full", 89, "Lahori-spiced fish, grilled.", "Seafood"],
          ["Fish Seekh Kabab", 52, "Minced fish kabab on skewers.", "Seafood"],
          ["Grilled Fish Tikka", 54, "Boneless fish tikka, charcoal-grilled.", "Seafood"],
          ["Paneer Tikka", 48, "Marinated cottage cheese, grilled.", "Veg"],
          ["Pineapple Tikka", 32, "Caramelised grilled pineapple.", "Veg"],
        ]),
        group("plat", "Platters", [
          ["Platter 1", 124, "Chicken cheese boti, shish tawook, chicken cheese kabab, beef kabab (optional), fish and rice.", "Signature"],
        ]),
        group("burger", "Burgers", [
          ["Malang Zinger Burger", 35, "Boneless chicken, lettuce, chef's special sauce, with fries.", "Signature"],
          ["Grilled Chicken Burger", 35, "Grilled breast, iceberg, cheese, veggies, special sauce, with fries."],
          ["Grilled Steak Mushroom Cheese Burger", 39, "Grilled chicken breast, iceberg, tomato, onion, mushroom, cheese, chef's sauce."],
          ["Grilled Beef Burger", 39, "Beef patty, cheese, onion rings, gherkin, spicy tangy sauce, with fries."],
          ["Chicken Tikka Burger", 36, "Chicken tikka, olives, tomato, onion, cheese, spicy tangy sauce, with fries.", "Spicy"],
        ]),
        group("sand", "Sandwiches", [
          ["Chicken Club Sandwich", 35, "Grilled chicken, fried egg, cheese, lettuce, tomato, mayo, with fries."],
          ["Grilled Chicken Sandwich", 35, "Grilled chicken, lettuce, tomato, onion, cheese, mayo, with fries."],
          ["Mexican Hot Veggie Sandwich", 33, "Olives, mushroom, sweet corn, peppers, hot sauce, with fries.", "Veg"],
          ["Veg Mayo Sandwich", 32, "Olives, mushroom, sweet corn, mixed peppers, mayo, with fries.", "Veg"],
        ]),
        group("roll", "Rolls", [
          ["Chicken Paratha Roll", 29, "Grilled chicken, onion, garlic mayo in homemade paratha, with fries."],
          ["Chicken Garlic Mayo Roll", 31, "Garlic chicken, lettuce, onion, tomato, chilli sauce, with fries."],
          ["Malai Tikka Boti Roll", 31, "Malai tikka boti, mayo, chilli sauce, lettuce, with fries."],
          ["Chicken Tikka Roll", 29, "Chicken tikka, onion, garlic mayo in paratha, with fries.", "Spicy"],
          ["Seekh Kabab Roll", 30, "Chicken or beef seekh, lettuce, garlic mayo, chilli sauce, with fries."],
          ["Egg Paratha Roll", 26, "Omelette, mayo and chilli sauce in paratha, with fries."],
          ["Vegetable Paratha Roll", 26, "Broccoli, mushroom, olives, peppers, corn, hot sauce, with fries.", "Veg"],
          ["Paneer Masala Roll", 29, "Fried paneer, lettuce, red chilli sauce and mayo, with fries.", "Veg"],
        ]),
        group("pasta", "Pasta", [
          ["Spaghetti Pasta", 42, "Red sauce with ground beef."],
          ["Sea Food Pasta", 46, "Red sauce, shrimp, cherry tomatoes and herbs.", "Seafood"],
          ["Penne Arrabbiata", 40, "Red sauce, chilli flakes and cherry tomatoes.", "Spicy"],
          ["Penne Pasta — Veg", 42, "White sauce with vegetables and mushroom.", "Veg"],
          ["Penne Pasta — Chicken", 46, "White sauce with chicken and mushroom."],
          ["Fettuccine Alfredo — Veg", 44, "Capsicum, black olives, jalapeño, creamy sauce.", "Veg"],
          ["Fettuccine Alfredo — Chicken", 48, "Chicken, capsicum, black olives, jalapeño, creamy sauce."],
          ["Vegetarian Pasta", 38, "Red sauce penne, capsicum, mushroom, olives, broccoli.", "Veg"],
        ]),
      ],
    },
    {
      id: "drinks",
      label: "Drinks",
      groups: [
        group("cc", "Cold Coffees", [
          ["Frappe Coffee", 35, "Blended iced coffee, smooth and frothy."],
          ["Mocha Frappe", 35, "Iced coffee blended with chocolate."],
          ["Iced Latte", 32, "Espresso and cold milk over ice."],
          ["Hazelnut Frappe", 35, "Blended iced coffee with hazelnut."],
          ["Choco Frappe", 35, "Rich blended iced chocolate."],
          ["Almond Frappe", 35, "Blended iced coffee with almond."],
          ["Demon's Own", 30, "The house cold-coffee special.", "Signature"],
          ["Special Horlicks", 26, "Chilled malted Horlicks."],
          ["Matcha Iced Latte", 35, "Matcha and milk over ice."],
        ]),
        group("tea", "Iced Tea", [
          ["Apple & Honey Iced Tea", 22, "Iced tea with apple and honey."],
          ["Boston Iced Tea", 22, "Classic Boston-style iced tea."],
          ["Lemon / Peach Iced Tea", 22, "Iced tea with lemon or peach — tell us which in notes."],
          ["Tropical Fruit Iced Tea", 22, "Iced tea with tropical fruit."],
        ]),
        group("mock", "Mocktails", [
          ["Mangoeee!", 35, "House mango mocktail."],
          ["Blue Breeze", 35, "House mocktail, served chilled."],  // TODO: confirm with venue — ingredients not on the board or online
          ["Twista", 35, "House mocktail, served chilled."],  // TODO: confirm with venue — ingredients not on the board or online
          ["Rail Splitter", 35, "House mocktail, served chilled."],  // TODO: confirm with venue — ingredients not on the board or online
          ["Malang Special Mojito", 35, "The house mojito.", "Signature"],
          ["Lemonade Punch", 35, "Zesty lemonade punch."],
          ["Passion Fruit", 35, "Passion fruit mocktail."],
          ["Pomegranate Mojito", 35, "Mint, lime and pomegranate."],
          ["Sunrise Mojito", 35, "House sunrise-style mojito."],
          ["Litchi Rainbow Mojito", 35, "Mint, lime and litchi, layered."],
          ["Night Sea", 35, "House mocktail, served chilled."],  // TODO: confirm with venue — ingredients not on the board or online
          ["Red Passion Mojito", 35, "Mint, lime and red passion fruit."],
          ["Spicy Mango Mocktail", 35, "Mango with a chilli kick.", "Spicy"],
          ["Mixed Fruit Mocktail", 35, "A blend of mixed fruits."],
          ["Strawberry Mojito", 35, "Mint, lime and strawberry."],
        ]),
        group("smooth", "Smoothies", [
          ["Mango Lassi Smoothie", 36, "Mango blended with yoghurt."],
          ["Acai Kick", 34, "Acai berry smoothie."],
          ["Banana-Berry Smoothie", 37, "Banana and mixed berries."],
          ["Spiced Mango Basil Smoothie", 37, "Mango with basil and a hint of spice."],
          ["Chunky Monkey Smoothie", 37, "Banana-based house smoothie."],
          ["Banana Avocado Smoothie Bowl", 41, "Thick banana and avocado bowl."],
          ["Strawberry Banana Smoothie Bowl", 41, "Thick strawberry and banana bowl."],
          ["Caribbean Kiss", 36, "Tropical house smoothie."],
          ["Tropic Colada", 36, "Pineapple and coconut, colada-style."],
          ["Strawberry Love", 36, "Strawberry smoothie."],
          ["Sweet Lassi (Punjabi Style)", 21, "Sweet, chilled Punjabi yoghurt lassi."],
        ]),
      ],
    },
    {
      id: "desserts",
      label: "Desserts",
      groups: [
        // TODO: confirm with venue — placeholder desserts and prices; not on the menu boards or any public listing (checked 2026-11-22).
        group("dessert", "Desserts", [
          ["Gulab Jamun", 18, "Warm milk dumplings in rose-cardamom syrup.", "Veg"],
          ["Kunafa", 32, "Crisp kataifi, melted cheese, sugar syrup.", "Signature"],
          ["Molten Chocolate Cake", 29, "Warm chocolate cake with a soft centre."],
          ["Mango Kulfi", 19, "Traditional frozen mango and milk dessert.", "Veg"],
        ]),
      ],
    },
  ],
};

const sheesha: MenuSection = {
  id: "sheesha",
  title: "Sheesha",
  categories: [
    {
      id: "signature",
      label: "Signature Blends",
      groups: [
        // TODO: confirm with venue — what "s.water" means (kept verbatim; not explained on the board or online).
        group("blend", "Malang Special Blends", [
          ["Cool Kiwi", 69, "Paan, kiwi, vanilla.", "Signature"],
          ["Twister Berry", 69, "Blueberry, berry, mint, touch of paan."],
          ["Yummy Madness", 69, "Orange, apple, s.water, vanilla, mint, touch of paan."],
          ["Creamy Salsa", 69, "Mint, Bombay paan masala, touch of paan."],
          ["Orange Tango", 69, "Orange, vanilla, mint, touch of paan."],
          ["X-Girlfriend", 69, "Guava, peach, passion, paan, s.water."],
          ["X-Boyfriend", 69, "Chocolate, vanilla, coconut, touch of paan."],
          ["Lahori Chaska", 69, "Paan, magai, supari, Bombay paan masala, s.water."],
          ["Waka Waka", 69, "Mango, vanilla, mint, touch of paan."],
          ["Hit Mint", 69, "Mint, kiwi, berry, touch of paan."],
          ["Head Rush", 69, "Paan, grape, strawberry."],
          ["Golden Night", 69, "Grape, paan, s.water."],
          ["Diamond Night", 69, "Rose, paan, s.water."],
          ["Fruitella", 69, "Mixed fruit, paan, s.water, rose."],
          ["Coffee House", 69, "Cappuccino, vanilla, chocolate."],
          ["Formula 69", 69, "Mango, peach, vanilla, mint, touch of paan.", "Signature"],
          ["Brain Freezer", 69, "Rose, paan, s.water."],
          ["Honey Moon", 69, "Mango, peach, s.water, passion, pink mischief."],
          ["Janeman", 69, "Lemon, rose, mint, s.water, touch of paan."],
          ["Insomnia", 69, "Gum, vanilla, paan, grape."], // TODO: confirm with venue — board spells it "Insominia"
          ["Chemical X", 69, "Watermelon, mint, lemon, touch of paan."],
          ["Brain Teaser", 69, "Grape, anar, touch of paan."],
          ["Supari Special", 69, "Vanilla, supari, touch of paan."],
          ["Love Marriage", 69, "Kachi khari, mint, s.water, touch of paan."],
          ["12 Masala 13 Swad", 69, "A hidden flavour — ask your host.", "Signature"],
          ["Customize Shisha", 69, "Any 3 flavours — list them in the notes."],
        ]),
      ],
    },
    {
      id: "classic",
      label: "Classic Flavors",
      groups: [
        // TODO: confirm with venue — placeholder classics priced at the board's 69 AED blend price; not publicly listed (checked 2026-11-22).
        group("classic", "Classic Flavors", [
          ["Double Apple", 69, "The timeless aniseed-apple classic."],
          ["Grape Mint", 69, "Sweet grape with cool mint."],
          ["Lemon Mint", 69, "Bright lemon, fresh mint."],
          ["Blueberry", 69, "Smooth, sweet blueberry."],
          ["Watermelon Mint", 69, "Juicy watermelon with mint."],
          ["Gum Mint", 69, "Chewing-gum sweetness, icy finish."],
        ]),
      ],
    },
    {
      id: "addons",
      label: "Ice / Fruit Heads",
      groups: [
        group("addon", "Heads & Add-ons", [
          ["Malang Pineapple Head", 179, "Flavours of your choice in a fresh pineapple, with a Red Bull base.", "Signature"],
          ["Head Change", 33, "A fresh head on your current sheesha."],
          // TODO: confirm with venue — placeholder ice hose price; not publicly listed (checked 2026-11-22).
          ["Ice Hose", 15, "Chilled hose for a cooler, smoother draw."],
        ]),
      ],
    },
  ],
};

export const MENU: MenuSection[] = [food, sheesha];

/** id -> { item, section } for pricing and validation. */
export const ITEM_INDEX = new Map<string, { item: MenuItem; section: MenuSection["id"] }>(
  MENU.flatMap((s) =>
    s.categories.flatMap((c) => c.groups.flatMap((g) => g.items.map((item) => [item.id, { item, section: s.id }] as const))),
  ),
);

export const TABLES = Array.from({ length: 30 }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`);
export const DEFAULT_TABLE = "T-01";
export const isTable = (v: unknown): v is string => typeof v === "string" && TABLES.includes(v);
export const tableLabel = (t: string) => `Table ${t.slice(2)}`;

export const aed = (n: number) => `AED ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export type OrderLine = { id: string; qty: number };
export type OrderPayload = {
  tableNumber: string;
  foodItems: OrderLine[];
  sheeshaItems: OrderLine[];
  notes: string;
  total: number;
  timestamp: string;
};
export type PricedLine = { id: string; name: string; qty: number; price: number; lineTotal: number };
export type Order = {
  orderId: string;
  tableNumber: string;
  foodItems: PricedLine[];
  sheeshaItems: PricedLine[];
  notes: string;
  total: number;
  status: "unseen" | "seen";
  timestamp: string;
};
