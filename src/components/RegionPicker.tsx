import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { CustomParams } from "@/types";

interface RegionPickerProps {
  regions: string[];
  selected: string;
  onChange: (region: string) => void;
  customParams: CustomParams | null;
  onCustomParamsChange: (params: CustomParams | null) => void;
}

export function RegionPicker({
  regions,
  selected,
  onChange,
  customParams,
  onCustomParamsChange,
}: RegionPickerProps) {
  const isCustom = selected === "CUSTOM";

  const [baseRegion, setBaseRegion] = useState(
    customParams?.baseRegion ?? "PHILIPPINES",
  );
  const [wageInput, setWageInput] = useState(
    customParams?.dailyWage?.toString() ?? "",
  );
  const [householdInput, setHouseholdInput] = useState(
    customParams?.householdSize?.toString() ?? "",
  );

  const handleRegionChange = (v: string) => {
    if (v === "CUSTOM") {
      onChange(v);
      const wage = parseFloat(wageInput);
      const hh = parseFloat(householdInput);
      if (wage > 0 && hh > 0) {
        onCustomParamsChange({ baseRegion, dailyWage: wage, householdSize: hh });
      }
    } else {
      onChange(v);
      onCustomParamsChange(null);
    }
  };

  const syncCustomParams = (
    nextBase: string,
    nextWage: string,
    nextHH: string,
  ) => {
    const wage = parseFloat(nextWage);
    const hh = parseFloat(nextHH);
    if (wage > 0 && hh > 0) {
      onCustomParamsChange({
        baseRegion: nextBase,
        dailyWage: wage,
        householdSize: hh,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={selected} onValueChange={(v) => handleRegionChange(v as string)}>
          <SelectTrigger className="w-auto min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PHILIPPINES">All Philippines</SelectItem>
            {regions
              .filter((r) => r !== "PHILIPPINES")
              .map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl bg-muted/40 px-4 py-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Base region (prices)
            </label>
            <Select
              value={baseRegion}
              onValueChange={(v) => {
                const val = v as string;
                setBaseRegion(val);
                syncCustomParams(val, wageInput, householdInput);
              }}
            >
              <SelectTrigger className="w-auto min-w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHILIPPINES">All Philippines</SelectItem>
                {regions
                  .filter((r) => r !== "PHILIPPINES")
                  .map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Daily min. wage (₱)
            </label>
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 610"
              value={wageInput}
              onChange={(e) => {
                setWageInput(e.target.value);
                syncCustomParams(baseRegion, e.target.value, householdInput);
              }}
              className="h-8 w-32 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Household size
            </label>
            <Input
              type="number"
              min={0}
              step={0.1}
              placeholder="e.g. 4"
              value={householdInput}
              onChange={(e) => {
                setHouseholdInput(e.target.value);
                syncCustomParams(baseRegion, wageInput, e.target.value);
              }}
              className="h-8 w-28 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
