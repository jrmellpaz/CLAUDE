import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
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
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent payload={[]} />} />

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
    </div>
  );
}
