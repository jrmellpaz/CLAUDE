import type { BasketItem } from "@/types";

export const DEFAULT_BASKET: BasketItem[] = [
  {
    key: "ricePrice",
    label: "Rice (regular milled)",
    unit: "kg",
    defaultQty: 0.35,
    qty: 0.35,
    enabled: true,
  },
  {
    key: "riceWmPrice",
    label: "Rice (well-milled)",
    unit: "kg",
    defaultQty: 0,
    qty: 0,
    enabled: false,
  },
  {
    key: "eggPrice",
    label: "Eggs",
    unit: "pc",
    defaultQty: 1,
    qty: 1,
    enabled: true,
  },
  {
    key: "fishPrice",
    label: "Galunggong",
    unit: "kg",
    defaultQty: 0.08,
    qty: 0.08,
    enabled: true,
  },
  {
    key: "porkPrice",
    label: "Pork kasim",
    unit: "kg",
    defaultQty: 0.05,
    qty: 0.05,
    enabled: true,
  },
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
