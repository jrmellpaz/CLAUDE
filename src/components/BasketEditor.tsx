import { useState } from "react";
import type { BasketItem, PanelRow } from "@/types";
import { formatPeso } from "@/lib/utils";

interface BasketEditorProps {
  basket: BasketItem[];
  onChange: (basket: BasketItem[]) => void;
  onReset: () => void;
  sampleRow?: PanelRow;
  computeDaysToFeed?: (row: PanelRow) => number;
}

export function BasketEditor({
  basket,
  onChange,
  onReset,
  sampleRow,
  computeDaysToFeed,
}: BasketEditorProps) {
  const [open, setOpen] = useState(false);

  const updateItem = (index: number, patch: Partial<BasketItem>) => {
    const next = basket.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onChange(next);
  };

  const dailyCostPP = sampleRow
    ? basket
        .filter((item) => item.enabled)
        .reduce((sum, item) => {
          const price = Number(sampleRow[item.key]) || 0;
          return sum + item.qty * price;
        }, 0)
    : 0;
  const dailyCostHH = sampleRow ? dailyCostPP * sampleRow.householdSize : 0;
  const monthlyCost = dailyCostHH * 30;
  const dtf =
    sampleRow && computeDaysToFeed ? computeDaysToFeed(sampleRow) : undefined;

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span>Customize basket</span>
        <span className="text-xs text-muted-foreground">
          {open ? "collapse" : "expand"}
        </span>
      </button>

      {open && (
        <div className="border-t px-3 pb-3 pt-2">
          <div className="space-y-2">
            {basket.map((item, i) => {
              const price = sampleRow ? Number(sampleRow[item.key]) || 0 : 0;
              const cost = item.enabled ? item.qty * price : 0;
              const keyStr = String(item.key);
              const step =
                item.unit === "pc" ? 1 : keyStr.includes("rice") ? 0.05 : 0.01;
              const max = item.unit === "pc" ? 10 : keyStr.includes("rice") ? 2 : 1;

              return (
                <div key={String(item.key)} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) =>
                      updateItem(i, { enabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border accent-primary"
                  />
                  <span className="w-36 truncate">{item.label}</span>
                  <input
                    type="number"
                    value={item.qty}
                    min={0}
                    max={max}
                    step={step}
                    disabled={!item.enabled}
                    onChange={(e) =>
                      updateItem(i, {
                        qty: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-16 rounded border bg-background px-1.5 py-0.5 text-right tabular-nums disabled:opacity-40"
                  />
                  <span className="w-8 text-xs text-muted-foreground">
                    {item.unit}
                  </span>
                  <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                    {sampleRow ? formatPeso(cost) : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
            {sampleRow && (
              <div className="space-y-0.5">
                <p>
                  Daily/person: <strong>{formatPeso(dailyCostPP)}</strong> |
                  Daily/household: <strong>{formatPeso(dailyCostHH)}</strong>
                </p>
                <p>
                  Monthly: <strong>{formatPeso(monthlyCost)}</strong>
                  {dtf !== undefined && (
                    <>
                      {" "}
                      | Days to feed:{" "}
                      <strong className="text-foreground">
                        {dtf.toFixed(1)}
                      </strong>
                    </>
                  )}
                </p>
                <p className="mt-1 text-muted-foreground/70">
                  Prices for {sampleRow.region}, latest month
                </p>
              </div>
            )}
            <button
              onClick={onReset}
              className="mt-2 rounded border px-2 py-1 text-xs hover:bg-muted"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
