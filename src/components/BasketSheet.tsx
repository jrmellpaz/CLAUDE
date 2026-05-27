import type { BasketItem, PanelRow } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BasketEditor } from "@/components/BasketEditor";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface BasketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basket: BasketItem[];
  onChange: (basket: BasketItem[]) => void;
  onReset: () => void;
  sampleRow?: PanelRow;
  computeDaysToFeed?: (row: PanelRow) => number;
}

export function BasketSheet({
  open,
  onOpenChange,
  basket,
  onChange,
  onReset,
  sampleRow,
  computeDaysToFeed,
}: BasketSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const regionLabel = sampleRow?.region ?? "All Philippines";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
