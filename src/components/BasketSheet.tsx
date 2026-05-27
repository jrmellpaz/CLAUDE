import { useState } from "react";
import type { BasketItem, PanelRow } from "@/types";
import { formatPeso } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BasketEditor } from "@/components/BasketEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBasket01Icon } from "@hugeicons/core-free-icons";

interface BasketSheetProps {
  basket: BasketItem[];
  onChange: (basket: BasketItem[]) => void;
  onReset: () => void;
  sampleRow?: PanelRow;
  computeDaysToFeed?: (row: PanelRow) => number;
}

export function BasketSheet({
  basket,
  onChange,
  onReset,
  sampleRow,
  computeDaysToFeed,
}: BasketSheetProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const enabledCount = basket.filter((b) => b.enabled).length;
  const dailyCostPP = sampleRow
    ? basket.filter((b) => b.enabled).reduce((sum, item) => {
        const price = Number(sampleRow[item.key]) || 0;
        return sum + item.qty * price;
      }, 0)
    : 0;
  const monthlyCost = sampleRow
    ? dailyCostPP * sampleRow.householdSize * 30
    : 0;

  const regionLabel = sampleRow?.region ?? "All Philippines";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* ── FAB ──────────────────────────────────────────────────── */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 size-14 p-0 rounded-full shadow-lg shadow-primary/30 sm:size-auto sm:h-14 sm:pl-4 sm:pr-5 sm:gap-2.5"
      >
        <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} className="size-5 shrink-0" />
        <span className="hidden sm:flex flex-col items-start leading-none gap-0.5">
          <span className="text-xs font-semibold">Food basket</span>
          {sampleRow && (
            <span className="text-[0.65rem] font-normal opacity-80">
              {formatPeso(monthlyCost)}/mo · {enabledCount} items
            </span>
          )}
        </span>
      </Button>

      {/* ── Sheet ────────────────────────────────────────────────── */}
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton
        className={
          isDesktop
            ? "flex flex-col p-0 sm:max-w-[360px]"
            : "flex flex-col p-0 max-h-[88vh] rounded-t-4xl"
        }
      >
        {/* Bottom sheet drag handle */}
        {!isDesktop && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>
        )}

        <SheetHeader className={`border-b border-border/60 shrink-0 ${isDesktop ? "px-6 pt-6 pb-5" : "px-6 pt-3 pb-5"}`}>
          <SheetTitle className="text-lg">Food basket</SheetTitle>

          {/* Region — prominently displayed */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-semibold text-foreground">
              {regionLabel}
            </span>
            <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0.5 rounded-full">
              latest month
            </Badge>
          </div>

          <SheetDescription className="mt-0.5">
            Adjust quantities to recalculate food costs.
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable editor content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <BasketEditor
            basket={basket}
            onChange={onChange}
            onReset={onReset}
            sampleRow={sampleRow}
            computeDaysToFeed={computeDaysToFeed}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
