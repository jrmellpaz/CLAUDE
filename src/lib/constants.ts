import type { BasketItem, BasketCategory } from "@/types";

function item(
  key: BasketItem["key"],
  label: string,
  category: BasketCategory,
  unit: string = "kg",
  defaultQty: number = 0,
  enabled: boolean = false,
): BasketItem {
  return { key, label, unit, defaultQty, qty: defaultQty, enabled, category };
}

export const DEFAULT_BASKET: BasketItem[] = [
  // ── Grains & staples ──────────────────────────────────────
  item("ricePrice", "Rice (regular milled)", "Grains & staples", "kg", 0.35, true),
  item("riceWmPrice", "Rice (well-milled)", "Grains & staples"),
  item("cornWhitePrice", "Corn grits (white)", "Grains & staples"),
  item("cornYellowPrice", "Corn grits (yellow)", "Grains & staples"),
  item("monggoPrice", "Monggo (green)", "Grains & staples", "kg", 0.03, true),

  // ── Root crops ─────────────────────────────────────────────
  item("camotePrice", "Camote", "Root crops", "kg", 0.05, true),
  item("cassavaPrice", "Cassava", "Root crops"),
  item("gabiPrice", "Gabi", "Root crops"),
  item("potatoPrice", "Potato", "Root crops"),
  item("singkamasPrice", "Singkamas", "Root crops"),

  // ── Leafy vegetables ──────────────────────────────────────
  item("kangkongPrice", "Kangkong", "Leafy vegetables", "kg", 0.05, true),
  item("pechayNativePrice", "Pechay (native)", "Leafy vegetables"),
  item("pechayChinesePrice", "Pechay (Chinese)", "Leafy vegetables"),
  item("alugbatiPrice", "Alugbati", "Leafy vegetables"),
  item("gabiLeavesPrice", "Gabi leaves", "Leafy vegetables"),
  item("malunggayPrice", "Malunggay", "Leafy vegetables", "kg", 0.03, true),
  item("onionLeavesPrice", "Onion leaves", "Leafy vegetables"),
  item("cabbagePrice", "Cabbage", "Leafy vegetables"),

  // ── Fruit vegetables ──────────────────────────────────────
  item("tomatoPrice", "Tomato", "Fruit vegetables"),
  item("talongPrice", "Talong", "Fruit vegetables"),
  item("ampalayaPrice", "Ampalaya", "Fruit vegetables"),
  item("sayotePrice", "Sayote", "Fruit vegetables"),
  item("upoPrice", "Upo", "Fruit vegetables"),
  item("squashPrice", "Squash", "Fruit vegetables"),
  item("okraPrice", "Okra", "Fruit vegetables"),
  item("pipinoPrice", "Pipino", "Fruit vegetables"),
  item("patolaPrice", "Patola", "Fruit vegetables"),
  item("stringBeansPrice", "String beans", "Fruit vegetables"),
  item("baguioBeansPrice", "Baguio beans", "Fruit vegetables"),

  // ── Other vegetables ──────────────────────────────────────
  item("carrotPrice", "Carrot", "Other vegetables"),
  item("labanosPrice", "Labanos", "Other vegetables"),
  item("onionRedPrice", "Onion (red)", "Other vegetables"),
  item("onionWhitePrice", "Onion (white)", "Other vegetables"),
  item("garlicPrice", "Garlic (imported)", "Other vegetables"),
  item("gingerPrice", "Ginger", "Other vegetables"),

  // ── Fish & seafood ────────────────────────────────────────
  item("fishPrice", "Galunggong", "Fish & seafood", "kg", 0.08, true),
  item("tilapiaPrice", "Tilapia", "Fish & seafood"),
  item("bangusPrice", "Bangus", "Fish & seafood"),
  item("dilisPrice", "Dilis", "Fish & seafood", "kg", 0.02, true),
  item("tulinganPrice", "Tulingan", "Fish & seafood"),
  item("budburonPrice", "Budburon", "Fish & seafood"),
  item("barilisPrice", "Barilis", "Fish & seafood"),
  item("tahongPrice", "Tahong", "Fish & seafood"),
  item("gulamanDagatPrice", "Gulaman dagat", "Fish & seafood"),
  item("latoPrice", "Lato", "Fish & seafood"),

  // ── Meat & poultry ────────────────────────────────────────
  item("eggPrice", "Eggs", "Meat & poultry", "pc", 1, true),
  item("porkPrice", "Pork kasim", "Meat & poultry", "kg", 0.05, true),
  item("chickenNativePrice", "Chicken (native)", "Meat & poultry"),
  item("edibleOffalPrice", "Edible offal", "Meat & poultry"),
];

export const FEATURE_LABELS: Record<string, string> = {
  ricePrice: "Rice price",
  eggPrice: "Egg price",
  fishPrice: "Fish price",
  porkPrice: "Pork price",
  dailyWage: "Minimum wage",
  householdSize: "Household size",
  cpiB30: "CPI (bottom 30%)",
};

export const REGIONS = [
  "PHILIPPINES",
  "NCR",
  "CAR",
  "Region I",
  "Region II",
  "Region III",
  "Region IV-A",
  "Region IV-B",
  "Region V",
  "Region VI",
  "Region VII",
  "Region VIII",
  "Region IX",
  "Region X",
  "Region XI",
  "Region XII",
  "Region XIII",
  "BARMM",
] as const;
