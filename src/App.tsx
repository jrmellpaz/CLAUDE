import { useState, Activity } from "react";
import { useData } from "@/hooks/useData";
import { useBasket } from "@/hooks/useBasket";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { getLatestMonth, getUniqueRegions, getEarliestMonth, formatPeso } from "@/lib/utils";
import { Header } from "@/components/Header";
import { ViewTabs, type View } from "@/components/ViewTabs";
import { BasketSheet } from "@/components/BasketSheet";
import { ChoroplethMap } from "@/components/ChoroplethMap";
import { TrendChart } from "@/components/TrendChart";
import { DriversChart } from "@/components/DriversChart";
import { AIAnalysis } from "@/components/AIAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ComputerIcon, Sun03Icon, Moon02Icon, ShoppingBasket01Icon } from "@hugeicons/core-free-icons";

const THEME_OPTIONS: { value: Theme; icon: typeof Sun03Icon; label: string }[] = [
  { value: "light",  icon: Sun03Icon,    label: "Light"  },
  { value: "system", icon: ComputerIcon, label: "System" },
  { value: "dark",   icon: Moon02Icon,   label: "Dark"   },
];

function ThemeToggle({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-1"
      style={{ background: "oklch(0.16 0.05 160 / 60%)" }}
      role="group"
      aria-label="Color theme"
    >
      {THEME_OPTIONS.map(({ value, icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className="relative flex items-center justify-center rounded-full w-7 h-7 transition-colors duration-150"
            style={
              active
                ? {
                    background: "oklch(0.32 0.08 160 / 80%)",
                    color: "var(--nav-fg)",
                    boxShadow: "0 1px 3px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.08)",
                  }
                : { color: "oklch(0.60 0.06 155)" }
            }
          >
            <HugeiconsIcon icon={icon} strokeWidth={active ? 2 : 1.5} className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

function Navbar({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  return (
    <nav className="app-navbar">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="app-brand select-none">
            CLAUDE <span className="app-brand-pip" />
          </span>
          <span
            className="hidden sm:block h-3.5 w-px"
            style={{ background: "oklch(1 0 0 / 18%)" }}
          />
          <span
            className="hidden sm:block text-xs font-medium tracking-wide select-none"
            style={{ color: "oklch(0.72 0.04 155)" }}
          >
            Computing Living Affordability Using Data Exploration
          </span>
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-10 px-4 pb-4">
      <div
        className="rounded-3xl overflow-hidden px-8 py-7"
        style={{ background: "var(--nav-bg)", color: "var(--nav-fg)" }}
      >
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="select-none">
            <p className="app-brand text-[1.05rem]">
              CLAUDE <span className="app-brand-pip" />
            </p>
            <p
              className="mt-1.5 text-xs leading-relaxed max-w-xs"
              style={{ color: "oklch(0.68 0.07 155)" }}
            >
              Computing Living Affordability Using Data Exploration
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1">
            <p
              className="text-[0.625rem] font-bold uppercase tracking-widest mb-1"
              style={{ color: "oklch(0.55 0.06 155)" }}
            >
              Authors
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--nav-fg)" }}>
              Jermel Lapaz
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--nav-fg)" }}>
              Mary Jannin Ramacula
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="my-5 h-px"
          style={{ background: "oklch(1 0 0 / 8%)" }}
        />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p
            className="text-[0.6875rem]"
            style={{ color: "oklch(0.55 0.05 155)" }}
          >
            Data sources: PSA · NWPC · BSP
          </p>
          <p
            className="text-[0.6875rem]"
            style={{ color: "oklch(0.45 0.04 155)" }}
          >
            © {new Date().getFullYear()} CLAUDE Data Analytics Project
          </p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const { panel, regression, geo, loading, error } = useData();
  const { basket, setBasket, resetBasket, computeDaysToFeed } = useBasket();
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<View>("map");
  const [region, setRegion] = useState<string>("PHILIPPINES");
  const [basketOpen, setBasketOpen] = useState(false);

  if (loading) {
    return (
      <>
        <Navbar theme={theme} setTheme={setTheme} />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="text-center space-y-3">
            <div className="loading-spinner mx-auto" />
            <p className="text-sm text-muted-foreground">Loading data…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar theme={theme} setTheme={setTheme} />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive">Failed to load data</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </>
    );
  }

  const latest = getLatestMonth(panel);
  const earliest = getEarliestMonth(panel);
  const current = panel.filter((r) => r.month === latest);
  const isNational = region === "PHILIPPINES";

  function averageRow(rows: typeof panel): typeof panel[0] | undefined {
    if (rows.length === 0) return undefined;
    const numericKeys = Object.keys(rows[0]).filter(
      (k) =>
        k !== "region" &&
        k !== "month" &&
        typeof rows[0][k as keyof typeof rows[0]] === "number",
    ) as (keyof typeof rows[0])[];
    const avg = { ...rows[0], region: "PHILIPPINES" };
    for (const key of numericKeys) {
      const vals = rows.map((r) => r[key] as number).filter((v) => v != null);
      (avg as Record<string, string | number>)[key as string] =
        vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return avg;
  }

  const selected = isNational
    ? averageRow(current)
    : current.find((r) => r.region === region);
  const dtf = selected ? computeDaysToFeed(selected) : undefined;

  const baselineData = panel.filter((r) => r.month === earliest);
  const baselineRow = isNational
    ? averageRow(baselineData)
    : baselineData.find((r) => r.region === region);
  const baselineDtf = baselineRow ? computeDaysToFeed(baselineRow) : undefined;

  const monthlyBasket =
    dtf !== undefined && selected ? dtf * selected.dailyWage : undefined;

  const fabEnabledCount = basket.filter((b) => b.enabled).length;
  const fabMonthlyCost = selected
    ? basket.filter((b) => b.enabled).reduce((sum, item) => {
        const price = Number(selected[item.key as keyof typeof selected]) || 0;
        return sum + item.qty * price;
      }, 0) * selected.householdSize * 30
    : 0;

  return (
    <>
      <Navbar theme={theme} setTheme={setTheme} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Header
          region={region}
          regions={getUniqueRegions(panel)}
          onRegionChange={setRegion}
          daysToFeed={dtf}
          dailyWage={selected?.dailyWage}
          monthlyBasket={monthlyBasket}
          baselineDtf={baselineDtf}
        />

        {/* Controls row */}
        <div className="mb-4">
          <ViewTabs active={view} onChange={setView} />
        </div>

        {/* Main content — full width now that basket is in a sheet */}
        <Card className="min-w-0 gap-0 py-0 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Activity mode={view === "map" ? "visible" : "hidden"}>
              <div className="view-panel">
                <ChoroplethMap
                  geo={geo}
                  data={current}
                  selectedRegion={region}
                  onRegionClick={setRegion}
                  computeDaysToFeed={computeDaysToFeed}
                />
              </div>
            </Activity>
            <Activity mode={view === "trend" ? "visible" : "hidden"}>
              <div className="view-panel">
                <TrendChart
                  data={panel}
                  region={region}
                  computeDaysToFeed={computeDaysToFeed}
                />
              </div>
            </Activity>
            <Activity mode={view === "drivers" ? "visible" : "hidden"}>
              <div className="view-panel">
                <DriversChart regression={regression} />
              </div>
            </Activity>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis — below main chart card */}
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <AIAnalysis
          region={region}
          panel={panel}
          regression={regression}
          daysToFeed={dtf}
          baselineDtf={baselineDtf}
          dailyWage={selected?.dailyWage}
          monthlyBasket={monthlyBasket}
          computeDaysToFeed={computeDaysToFeed}
        />
      </div>

      {/* Sticky FAB — floats above content, lifts away before the footer */}
      <div className="sticky bottom-0 h-0 overflow-visible pointer-events-none">
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <Button
            onClick={() => setBasketOpen(true)}
            className="z-40 size-16 p-0 rounded-full shadow-lg shadow-primary/30 sm:size-auto sm:h-16 sm:pl-5 sm:pr-6 sm:gap-3"
          >
            <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} className="size-6 shrink-0 sm:size-6" />
            <span className="hidden sm:flex flex-col items-start leading-none gap-1">
              <span className="text-sm font-semibold">Food basket</span>
              {selected && (
                <span className="text-xs font-normal opacity-80">
                  {formatPeso(fabMonthlyCost)}/mo · {fabEnabledCount} items
                </span>
              )}
            </span>
          </Button>
        </div>
      </div>

      <Footer />

      {/* Basket sheet — no FAB, controlled externally */}
      <BasketSheet
        open={basketOpen}
        onOpenChange={setBasketOpen}
        basket={basket}
        onChange={setBasket}
        onReset={resetBasket}
        sampleRow={selected}
        computeDaysToFeed={computeDaysToFeed}
      />
    </>
  );
}

export default App;
