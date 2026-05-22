import { useState } from "react";
import { useData } from "@/hooks/useData";
import { useBasket } from "@/hooks/useBasket";
import { getLatestMonth, getUniqueRegions, getEarliestMonth } from "@/lib/utils";
import { Header } from "@/components/Header";
import { ViewTabs, type View } from "@/components/ViewTabs";
import { RegionPicker } from "@/components/RegionPicker";
import { BasketEditor } from "@/components/BasketEditor";
import { ChoroplethMap } from "@/components/ChoroplethMap";
import { TrendChart } from "@/components/TrendChart";
import { DriversChart } from "@/components/DriversChart";

function App() {
  const { panel, regression, geo, loading, error } = useData();
  const { basket, setBasket, resetBasket, computeDaysToFeed } = useBasket();
  const [view, setView] = useState<View>("map");
  const [region, setRegion] = useState<string>("PHILIPPINES");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load data
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const latest = getLatestMonth(panel);
  const earliest = getEarliestMonth(panel);
  const current = panel.filter((r) => r.month === latest);

  const isNational = region === "PHILIPPINES";

  function averageRow(rows: typeof panel): typeof panel[0] | undefined {
    if (rows.length === 0) return undefined;
    const numericKeys = Object.keys(rows[0]).filter(
      (k) => k !== "region" && k !== "month" && typeof rows[0][k as keyof typeof rows[0]] === "number",
    ) as (keyof typeof rows[0])[];
    const avg = { ...rows[0], region: "PHILIPPINES" };
    for (const key of numericKeys) {
      const vals = rows.map((r) => r[key] as number).filter((v) => v != null);
      (avg as Record<string, string | number>)[key as string] =
        vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return avg;
  }

  const selected = isNational ? averageRow(current) : current.find((r) => r.region === region);
  const dtf = selected ? computeDaysToFeed(selected) : undefined;

  const baselineData = panel.filter((r) => r.month === earliest);
  const baselineRow = isNational ? averageRow(baselineData) : baselineData.find((r) => r.region === region);
  const baselineDtf = baselineRow ? computeDaysToFeed(baselineRow) : undefined;

  const monthlyBasket =
    dtf !== undefined && selected
      ? dtf * selected.dailyWage
      : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Header
        region={region}
        daysToFeed={dtf}
        dailyWage={selected?.dailyWage}
        monthlyBasket={monthlyBasket}
        baselineDtf={baselineDtf}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ViewTabs active={view} onChange={setView} />
        <RegionPicker
          regions={getUniqueRegions(panel)}
          selected={region}
          onChange={setRegion}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0 rounded-lg border bg-card p-4">
          {view === "map" && (
            <ChoroplethMap
              geo={geo}
              data={current}
              selectedRegion={region}
              onRegionClick={setRegion}
              computeDaysToFeed={computeDaysToFeed}
            />
          )}
          {view === "trend" && (
            <TrendChart
              data={panel}
              region={region}
              computeDaysToFeed={computeDaysToFeed}
            />
          )}
          {view === "drivers" && <DriversChart regression={regression} />}
        </main>

        <aside className="space-y-3">
          <BasketEditor
            basket={basket}
            onChange={setBasket}
            onReset={resetBasket}
            sampleRow={selected}
            computeDaysToFeed={computeDaysToFeed}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
