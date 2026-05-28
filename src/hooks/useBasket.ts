import { useState } from "react";
import type { BasketItem, PanelRow } from "@/types";
import { DEFAULT_BASKET } from "@/lib/constants";

export function useBasket() {
  const [basket, setBasket] = useState<BasketItem[]>(
    DEFAULT_BASKET.map((item) => ({ ...item }))
  );

  const resetBasket = () => {
    setBasket(DEFAULT_BASKET.map((item) => ({ ...item })));
  };

  const computeDaysToFeed = (row: PanelRow): number => {
    const dailyCostPP = basket
      .filter((item) => item.enabled)
      .reduce((sum, item) => {
        const raw = row[item.key];
        if (raw == null) return sum;
        return sum + item.qty * (Number(raw) || 0);
      }, 0);

    const dailyCostHH = dailyCostPP * row.householdSize;
    const monthlyCost = dailyCostHH * 30;
    return row.dailyWage > 0 ? monthlyCost / row.dailyWage : 0;
  };

  return { basket, setBasket, resetBasket, computeDaysToFeed };
}
