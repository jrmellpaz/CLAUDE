import { cn } from "@/lib/utils";

export type View = "map" | "trend" | "drivers";

interface ViewTabsProps {
  active: View;
  onChange: (view: View) => void;
}

const tabs: { value: View; label: string }[] = [
  { value: "map", label: "Map" },
  { value: "trend", label: "Trend" },
  { value: "drivers", label: "Drivers" },
];

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === tab.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
