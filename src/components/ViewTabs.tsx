import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Tabs
      value={active}
      onValueChange={(v) => {
        if (v) onChange(v as View);
      }}
    >
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
