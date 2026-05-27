import { formatPeso } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RegionPicker } from "@/components/RegionPicker";

interface HeaderProps {
  region: string;
  regions: string[];
  onRegionChange: (region: string) => void;
  daysToFeed?: number;
  dailyWage?: number;
  monthlyBasket?: number;
  baselineDtf?: number;
}

export function Header({
  region,
  regions,
  onRegionChange,
  daysToFeed,
  dailyWage,
  monthlyBasket,
  baselineDtf,
}: HeaderProps) {
  const change =
    daysToFeed !== undefined && baselineDtf !== undefined && baselineDtf > 0
      ? ((daysToFeed - baselineDtf) / baselineDtf) * 100
      : undefined;

  return (
    <header className="mb-6">
      {/* Question heading */}
      <div className="mb-4">
        <h1 className="question-heading text-2xl sm:text-[1.75rem] lg:text-3xl">
          How many days of minimum wage does it take
          <br className="hidden sm:block" /> to feed a household?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--primary)" }}
          />
          Tracking food affordability across Philippine regions · 2018–present
        </p>
      </div>

      {/* Region picker — above the cards it affects */}
      <div className="mb-3">
        <RegionPicker
          regions={regions}
          selected={region}
          onChange={onRegionChange}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Days to feed"
          value={daysToFeed !== undefined ? daysToFeed.toFixed(1) : "—"}
          subtitle={region}
          accent="primary"
        />
        <KpiCard
          label="vs. 2018 baseline"
          value={
            change !== undefined
              ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
              : "—"
          }
          subtitle={
            change !== undefined
              ? change > 0
                ? "↑ Worsening"
                : "↓ Improving"
              : undefined
          }
          accent={
            change !== undefined && change > 0
              ? "warn"
              : change !== undefined && change < 0
                ? "improve"
                : "none"
          }
        />
        <KpiCard
          label="Daily min. wage"
          value={dailyWage !== undefined ? formatPeso(dailyWage) : "—"}
          subtitle={region}
          accent="none"
        />
        <KpiCard
          label="Monthly food cost"
          value={monthlyBasket !== undefined ? formatPeso(monthlyBasket) : "—"}
          subtitle="Household basket"
          accent="none"
        />
      </div>
    </header>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  accent = "none",
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: "primary" | "warn" | "improve" | "none";
}) {
  const valueStyle: React.CSSProperties =
    accent === "warn"
      ? { color: "var(--destructive)" }
      : accent === "improve"
        ? { color: "var(--chart-2)" }
        : {};

  return (
    <Card size="sm" className="gap-0 py-0">
      <CardContent className="px-4 pt-3.5 pb-3">
        <p className="kpi-label">{label}</p>
        <p className="kpi-value" style={valueStyle}>
          {value}
        </p>
        {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
