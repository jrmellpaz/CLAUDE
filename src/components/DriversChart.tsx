import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import type { RegressionResult } from "@/types";
import { FEATURE_LABELS } from "@/lib/constants";

interface DriversChartProps {
  regression: RegressionResult | null;
}

const chartConfig = {
  positive: {
    label: "Increases days to feed",
    color: "oklch(0.637 0.237 25.465)",
  },
  negative: {
    label: "Decreases days to feed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function DriversChart({ regression }: DriversChartProps) {
  const chartData = regression
    ? regression.feature_importance
        .slice()
        .sort((a, b) => Math.abs(b.std_coef) - Math.abs(a.std_coef))
        .map((fi) => ({
          feature: FEATURE_LABELS[fi.feature] || fi.feature,
          featureKey: fi.feature,
          value: parseFloat(fi.std_coef.toFixed(3)),
          absValue: parseFloat(Math.abs(fi.std_coef).toFixed(3)),
          pValue: regression.coefficients[fi.feature]?.p_value,
          significant:
            regression.coefficients[fi.feature]?.p_value !== undefined &&
            regression.coefficients[fi.feature].p_value < 0.05,
        }))
    : [];

  if (!regression) {
    return (
      <p className="text-center text-muted-foreground">
        No regression data available.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">
        Standardized coefficients from OLS regression. Analysis uses default
        basket quantities.
      </p>
      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <BarChart data={chartData} layout="vertical">
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            label={{
              value: "Standardized coefficient",
              position: "insideBottom",
              offset: -5,
              style: { fontSize: 12 },
            }}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={120}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => {
                  const payload = item.payload as {
                    feature: string;
                    value: number;
                    pValue?: number;
                  };
                  return (
                    <span>
                      {payload.feature}: {value}
                      {payload.pValue !== undefined && (
                        <> (p = {payload.pValue.toFixed(4)})</>
                      )}
                    </span>
                  );
                }}
              />
            }
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.featureKey}
                fill={
                  entry.value >= 0
                    ? "var(--color-positive)"
                    : "var(--color-negative)"
                }
                fillOpacity={entry.significant ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-4 flex flex-wrap gap-3">
        <StatCard label="R²" value={regression.r_squared.toFixed(3)} />
        <StatCard
          label="Adj. R²"
          value={regression.adj_r_squared.toFixed(3)}
        />
        <StatCard label="RMSE" value={regression.rmse.toFixed(3)} />
      </div>

      {regression.summary_text && (
        <p className="mt-3 text-sm text-muted-foreground">
          {regression.summary_text}
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
