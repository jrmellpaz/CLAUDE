import { formatPeso } from "@/lib/utils";

interface HeaderProps {
  region: string;
  daysToFeed?: number;
  dailyWage?: number;
  monthlyBasket?: number;
  baselineDtf?: number;
}

export function Header({
  region,
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
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
        How many days of minimum wage does it take to feed a household?
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tracking food affordability across Philippine regions
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Days to feed"
          value={daysToFeed !== undefined ? daysToFeed.toFixed(1) : "—"}
          subtitle={region}
        />
        <KpiCard
          label="vs. 2018 baseline"
          value={
            change !== undefined
              ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
              : "—"
          }
          subtitle={change !== undefined && change > 0 ? "Worsening" : change !== undefined && change < 0 ? "Improving" : ""}
          warn={change !== undefined && change > 0}
        />
        <KpiCard
          label="Daily min. wage"
          value={dailyWage !== undefined ? formatPeso(dailyWage) : "—"}
          subtitle={region}
        />
        <KpiCard
          label="Monthly food cost"
          value={monthlyBasket !== undefined ? formatPeso(monthlyBasket) : "—"}
          subtitle="Household basket"
        />
      </div>
    </header>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
  warn,
}: {
  label: string;
  value: string;
  subtitle?: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-left">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          warn ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
