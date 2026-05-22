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

const chartConfig = {
  region: {
    label: "Selected region",
    color: "var(--chart-1)",
  },
  national: {
    label: "National avg.",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function TrendChart({ data, region, computeDaysToFeed }: TrendChartProps) {
  const months = Array.from(new Set(data.map((r) => r.month))).sort();

  const nationalByMonth = new Map<string, number[]>();
  for (const row of data) {
    const dtf = computeDaysToFeed(row);
    if (!nationalByMonth.has(row.month)) {
      nationalByMonth.set(row.month, []);
    }
    nationalByMonth.get(row.month)!.push(dtf);
  }

  const regionRows = new Map<string, PanelRow>();
  for (const row of data) {
    if (row.region === region) {
      regionRows.set(row.month, row);
    }
  }

  const chartData = months.map((month) => {
    const natValues = nationalByMonth.get(month) || [];
    const natAvg =
      natValues.length > 0
        ? natValues.reduce((a, b) => a + b, 0) / natValues.length
        : 0;

    const regionRow = regionRows.get(month);
    const regionDtf = regionRow ? computeDaysToFeed(regionRow) : undefined;

    return {
      month,
      monthLabel: formatMonth(month),
      region: regionDtf !== undefined ? parseFloat(regionDtf.toFixed(2)) : undefined,
      national: parseFloat(natAvg.toFixed(2)),
    };
  });

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
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
          <Line
            type="monotone"
            dataKey="national"
            stroke="var(--color-national)"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            dot={false}
            name="national"
          />
          {region !== "PHILIPPINES" && (
            <Line
              type="monotone"
              dataKey="region"
              stroke="var(--color-region)"
              strokeWidth={2.5}
              dot={false}
              name="region"
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
