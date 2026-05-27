import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegionPickerProps {
  regions: string[];
  selected: string;
  onChange: (region: string) => void;
}

export function RegionPicker({ regions, selected, onChange }: RegionPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={selected}
        onValueChange={(v) => onChange(v as string)}
      >
        <SelectTrigger className="w-auto min-w-[11rem]">
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
  );
}
