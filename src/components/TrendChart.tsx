import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { TooltipProps } from "recharts";
import type { PanelRow } from "@/types";
import { formatMonth } from "@/lib/utils";

interface TrendChartProps {
  data: PanelRow[];
  region: string;
  computeDaysToFeed: (row: PanelRow) => number;
}

// Palette for extra regions (avoids chart-1 / chart-4 used by selected / national)
const EXTRA_COLORS = [
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-5)",
  "oklch(0.60 0.18 60)",
  "oklch(0.55 0.18 290)",
  "oklch(0.55 0.18 200)",
  "oklch(0.60 0.20 320)",
  "oklch(0.60 0.18 170)",
  "oklch(0.55 0.20 15)",
  "oklch(0.55 0.18 240)",
  "oklch(0.62 0.16 100)",
  "oklch(0.55 0.18 340)",
  "oklch(0.60 0.20 0)",
  "oklch(0.55 0.16 135)",
  "oklch(0.58 0.18 220)",
  "oklch(0.62 0.14 75)",
  "oklch(0.55 0.20 260)",
  "oklch(0.60 0.18 185)",
];

function TrendTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  // Sort: national first, then by value descending
  const sorted = [...payload].sort((a, b) => {
    if (a.name === "national") return -1;
    if (b.name === "national") return 1;
    return (b.value ?? 0) - (a.value ?? 0);
  });

  return (
    <div className="rounded-lg border border-border bg-background shadow-lg text-xs min-w-[160px]" style={{ zIndex: 9999 }}>
      <p className="px-3 pt-2.5 pb-1.5 font-semibold text-foreground border-b border-border/60">
        {label}
      </p>
      <div className="px-3 py-2 space-y-1">
        {sorted.map((entry) => {
          const name =
            entry.name === "national"
              ? "National avg."
              : String(entry.name).replace("rgn__", "");
          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: entry.color }}
                />
                <span className="text-muted-foreground truncate">{name}</span>
              </div>
              <span className="font-medium tabular-nums text-foreground shrink-0">
                {Number(entry.value).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendChart({ data, region, computeDaysToFeed }: TrendChartProps) {
  const months = Array.from(new Set(data.map((r) => r.month))).sort();

  // All non-Philippines regions, sorted
  const allRegions = Array.from(new Set(data.map((r) => r.region)))
    .filter((r) => r !== "PHILIPPINES")
    .sort();

  // User-toggled extra regions (beyond the currently selected one)
  const [extraRegions, setExtraRegions] = useState<Set<string>>(new Set());

  const toggleRegion = (r: string) => {
    setExtraRegions((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  // Ordered list of regions to draw lines for (selected first, extras after)
  const extras = Array.from(extraRegions).filter((r) => r !== region);
  const linedRegions = region !== "PHILIPPINES" ? [region, ...extras] : extras;

  // Pre-index rows by region → month for O(1) lookup
  const rowIndex = new Map<string, Map<string, PanelRow>>();
  for (const row of data) {
    if (!rowIndex.has(row.region)) rowIndex.set(row.region, new Map());
    rowIndex.get(row.region)!.set(row.month, row);
  }

  const nationalByMonth = new Map<string, number[]>();
  for (const row of data) {
    const dtf = computeDaysToFeed(row);
    if (!nationalByMonth.has(row.month)) nationalByMonth.set(row.month, []);
    nationalByMonth.get(row.month)!.push(dtf);
  }

  const chartData = months.map((month) => {
    const natValues = nationalByMonth.get(month) ?? [];
    const natAvg =
      natValues.length > 0
        ? natValues.reduce((a, b) => a + b, 0) / natValues.length
        : 0;

    const entry: Record<string, string | number | undefined> = {
      month,
      monthLabel: formatMonth(month),
      national: parseFloat(natAvg.toFixed(2)),
    };

    for (const r of linedRegions) {
      const row = rowIndex.get(r)?.get(month);
      entry[`rgn__${r}`] = row
        ? parseFloat(computeDaysToFeed(row).toFixed(2))
        : undefined;
    }

    return entry;
  });

  // Build dynamic ChartConfig
  const chartConfig: ChartConfig = {
    national: { label: "National avg.", color: "var(--chart-4)" },
  };
  linedRegions.forEach((r, i) => {
    chartConfig[`rgn__${r}`] = {
      label: r === region ? `${r} (selected)` : r,
      color:
        i === 0 && r === region
          ? "var(--chart-1)"
          : EXTRA_COLORS[(i === 0 ? 0 : i - 1) % EXTRA_COLORS.length],
    };
  });

  // Extras that are currently toggled (for the button styling)
  const otherRegions = allRegions.filter((r) => r !== region);

  return (
    <div className="space-y-3">
      {/* Region toggle strip */}
      {otherRegions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground font-medium">
            Compare with other regions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {otherRegions.map((r) => {
              const active = extraRegions.has(r);
              const colorIdx =
                linedRegions.indexOf(r) > 0
                  ? (linedRegions.indexOf(r) - 1) % EXTRA_COLORS.length
                  : linedRegions.indexOf(r) % EXTRA_COLORS.length;
              return (
                <Button
                  key={r}
                  size="xs"
                  variant={active ? "default" : "outline"}
                  onClick={() => toggleRegion(r)}
                  className="rounded-full transition-all"
                  style={
                    active
                      ? {
                          background: EXTRA_COLORS[colorIdx],
                          borderColor: EXTRA_COLORS[colorIdx],
                          color: "white",
                        }
                      : undefined
                  }
                >
                  {r}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <ChartContainer config={chartConfig} className="h-[380px] w-full">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{
              value: "Days to feed",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12 },
            }}
          />
          <ChartTooltip content={<TrendTooltip />} />

          {/* National average — always shown */}
          <Line
            type="monotone"
            dataKey="national"
            stroke="var(--color-national)"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            dot={false}
            name="national"
          />

          {/* One line per region to display */}
          {linedRegions.map((r, i) => (
            <Line
              key={r}
              type="monotone"
              dataKey={`rgn__${r}`}
              stroke={
                i === 0 && r === region
                  ? "var(--chart-1)"
                  : EXTRA_COLORS[(i === 0 ? 0 : i - 1) % EXTRA_COLORS.length]
              }
              strokeWidth={r === region ? 2.5 : 1.5}
              dot={false}
              name={`rgn__${r}`}
            />
          ))}
        </LineChart>
      </ChartContainer>

      {/* Wrapping legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
        {Object.entries(chartConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            {key === "national" ? (
              <svg width="18" height="10" className="shrink-0">
                <line
                  x1="0" y1="5" x2="18" y2="5"
                  stroke={cfg.color as string}
                  strokeWidth="1.5"
                  strokeDasharray="5 2.5"
                />
              </svg>
            ) : (
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ background: cfg.color as string }}
              />
            )}
            <span>{cfg.label as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
