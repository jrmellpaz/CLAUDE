interface RegionPickerProps {
  regions: string[];
  selected: string;
  onChange: (region: string) => void;
}

export function RegionPicker({ regions, selected, onChange }: RegionPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="region-select" className="text-sm font-medium text-muted-foreground">
        Region
      </label>
      <select
        id="region-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="PHILIPPINES">All Philippines</option>
        {regions
          .filter((r) => r !== "PHILIPPINES")
          .map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
      </select>
    </div>
  );
}
