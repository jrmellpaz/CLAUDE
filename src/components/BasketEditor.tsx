import type { BasketItem, PanelRow } from "@/types";
import { formatPeso } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

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
  const updateItem = (index: number, patch: Partial<BasketItem>) => {
    const next = basket.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
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
    <div className="flex flex-col gap-0 min-h-0">

      {/* ── Item list ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pb-2">
        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_5rem_1.5rem_4rem] gap-x-2 mb-1 px-0.5 sticky top-0 bg-popover pt-4 pb-2 border-b border-border/40">
          <span />
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60">Item</span>
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Qty</span>
          <span />
          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Cost</span>
        </div>

        <div className="space-y-0 mt-1">
          {basket.map((item, i) => {
            const price = sampleRow ? Number(sampleRow[item.key]) || 0 : 0;
            const cost = item.enabled ? item.qty * price : 0;
            const keyStr = String(item.key);
            const step =
              item.unit === "pc" ? 1 : keyStr.includes("rice") ? 0.05 : 0.01;
            const max =
              item.unit === "pc" ? 10 : keyStr.includes("rice") ? 2 : 1;

            return (
              <div
                key={String(item.key)}
                className="grid grid-cols-[auto_1fr_5rem_1.5rem_4rem] gap-x-2 items-center py-2.5 rounded-lg px-0.5 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  checked={item.enabled}
                  onCheckedChange={(checked) =>
                    updateItem(i, { enabled: checked as boolean })
                  }
                />
                <span
                  className={`text-xs truncate transition-opacity ${
                    item.enabled ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {item.label}
                </span>
                <Input
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
                  className="h-6 w-full rounded-md text-right text-xs tabular-nums px-1.5 py-0"
                />
                <span className="text-[0.625rem] text-muted-foreground text-center">
                  {item.unit}
                </span>
                <span
                  className={`text-right text-[0.6875rem] tabular-nums transition-opacity ${
                    item.enabled ? "text-muted-foreground" : "text-muted-foreground/40"
                  }`}
                >
                  {sampleRow ? formatPeso(cost) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Totals ─────────────────────────────────────────────── */}
      {sampleRow && (
        <div className="border-t border-border/60 px-6 pt-4 pb-2 space-y-1.5 shrink-0">
          <SummaryRow label="Daily / person"    value={formatPeso(dailyCostPP)} />
          <SummaryRow label="Daily / household" value={formatPeso(dailyCostHH)} />
          <div className="h-px bg-border/60 my-1" />
          <SummaryRow label="Monthly total" value={formatPeso(monthlyCost)} bold />
          {dtf !== undefined && (
            <SummaryRow label="Days to feed" value={`${dtf.toFixed(1)} days`} accent />
          )}
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="px-6 pt-3 pb-6 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full rounded-xl text-xs text-muted-foreground"
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
  accent = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span
        className={`tabular-nums text-right truncate text-xs ${bold ? "font-bold text-sm" : "font-medium"}`}
        style={accent ? { color: "var(--primary)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
