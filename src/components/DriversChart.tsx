import React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import type { RegressionResult } from "@/types";
import { FEATURE_LABELS } from "@/lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

interface DriversChartProps {
  regression: RegressionResult | null;
}

const chartConfig = {
  positive: {
    label: "Increases days to feed",
    color: "oklch(0.58 0.16 24)",   /* muted terracotta-red */
  },
  negative: {
    label: "Decreases days to feed",
    color: "oklch(0.56 0.13 163)",  /* sage forest-green, matches app primary family */
  },
} satisfies ChartConfig;

// ── Stat explanations ────────────────────────────────────────────────────────

const STAT_EXPLANATIONS: {
  term: string;
  short: string;
  detail: string;
}[] = [
  {
    term: "R²",
    short: "Coefficient of determination",
    detail:
      "Measures how much of the variance in 'days to feed' is explained by the model. A value of 0.98 means 98% of the variation is captured. Closer to 1 is better.",
  },
  {
    term: "Adj. R²",
    short: "Adjusted R²",
    detail:
      "Like R² but penalises for adding extra predictors that don't genuinely improve the fit. Use this to compare models with different numbers of variables.",
  },
  {
    term: "RMSE",
    short: "Root Mean Squared Error",
    detail:
      "The average prediction error in the same units as the outcome (days). Lower is better — an RMSE of 0.86 means predictions are off by roughly ±0.86 days on average.",
  },
  {
    term: "F-statistic",
    short: "Overall model significance",
    detail:
      "Tests whether the model as a whole explains significantly more variance than a flat baseline. A large F-statistic (and its tiny p-value) means the predictors jointly matter.",
  },
  {
    term: "AIC",
    short: "Akaike Information Criterion",
    detail:
      "A model-comparison score that balances goodness-of-fit against complexity. Lower AIC is better, but the absolute value has no meaning — only differences between models do.",
  },
  {
    term: "BIC",
    short: "Bayesian Information Criterion",
    detail:
      "Similar to AIC but applies a stronger penalty for extra parameters. Prefer BIC when you expect the true model to be sparse; prefer AIC when predictive accuracy matters most.",
  },
];

const P_VALUE_EXPLANATION = {
  title: "p-values & significance stars",
  rows: [
    {
      stars: "***",
      threshold: "p < 0.001",
      meaning: "Extremely strong evidence against the null hypothesis (the coefficient is almost certainly non-zero).",
    },
    {
      stars: "**",
      threshold: "p < 0.01",
      meaning: "Very strong evidence. Less than a 1-in-100 chance of observing this result if the true coefficient were zero.",
    },
    {
      stars: "*",
      threshold: "p < 0.05",
      meaning: "Conventional significance threshold. Less than 5% probability of a false positive.",
    },
    {
      stars: "(none)",
      threshold: "p ≥ 0.05",
      meaning: "Not statistically significant at the 5% level. Treat this coefficient with caution.",
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseModelStats(text: string) {
  const get = (pattern: RegExp) => {
    const val = text.match(pattern)?.[1] ?? null;
    return val ? val.replace(/\.$/, "") : null; // strip trailing "4311." → "4311"
  };
  return {
    nObs: get(/No\.\s*Observations:\s*([\d,]+)/),
    fStat: get(/F-statistic:\s*([\d.e+\-]+)/),
    aic: get(/AIC:\s*([\d.e+\-]+)/),
    bic: get(/BIC:\s*([\d.e+\-]+)/),
    logLik: get(/Log-Likelihood:\s*([\-\d.e+]+)/),
  };
}

function sigStars(pValue: number) {
  if (pValue < 0.001) return "***";
  if (pValue < 0.01) return "**";
  if (pValue < 0.05) return "*";
  return "";
}

function featureLabel(key: string) {
  if (key === "const") return "Intercept";
  if (FEATURE_LABELS[key]) return FEATURE_LABELS[key];
  const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (FEATURE_LABELS[camelKey]) return FEATURE_LABELS[camelKey];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Info dialogs ─────────────────────────────────────────────────────────────

function InfoButton({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-muted-foreground hover:text-foreground"
      {...props}
    >
      <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.5} className="size-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function ModelFitInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<InfoButton label="What do these model fit metrics mean?" />} />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Model Fit Metrics</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {STAT_EXPLANATIONS.map((s) => (
            <div key={s.term} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-primary w-16">
                {s.term}
              </span>
              <div>
                <p className="text-sm font-medium leading-snug">{s.short}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {s.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function CoefficientsInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<InfoButton label="What do the regression coefficients mean?" />} />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Regression Coefficients</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Each row shows how a one-unit change in that variable relates to the
          number of days a household needs to afford the food basket, holding all
          other variables constant.
        </p>

        <div className="space-y-2.5 border-t border-border pt-4">
          {[
            { col: "Coef.", desc: "Raw regression coefficient — the change in days to feed for a one-unit increase in the predictor." },
            { col: "Std. Err.", desc: "Standard error of the coefficient. Smaller values indicate a more precise estimate." },
            { col: "t-stat", desc: "The coefficient divided by its standard error. Larger absolute values suggest the predictor is more distinguishable from zero." },
            { col: "p-value", desc: "Probability of observing this coefficient by chance if the true effect were zero. Smaller is stronger evidence of a real effect." },
          ].map(({ col, desc }) => (
            <div key={col} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-mono text-xs font-bold text-primary w-16">{col}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3 border-t border-border pt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {P_VALUE_EXPLANATION.title}
          </h3>
          <div className="space-y-2">
            {P_VALUE_EXPLANATION.rows.map((row) => (
              <div key={row.stars} className="flex gap-3 items-start">
                <span className="shrink-0 w-10 font-bold text-xs text-amber-600 dark:text-amber-400 font-mono">
                  {row.stars}
                </span>
                <span className="shrink-0 w-16 text-xs font-medium tabular-nums text-muted-foreground">
                  {row.threshold}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {row.meaning}
                </span>
              </div>
            ))}
          </div>
        </section>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function DriversChart({ regression }: DriversChartProps) {
  const chartData = regression
    ? regression.feature_importance
        .slice()
        .sort((a, b) => Math.abs(b.std_coef) - Math.abs(a.std_coef))
        .map((fi) => ({
          feature: featureLabel(fi.feature),
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

  const modelStats = regression.summary_text
    ? parseModelStats(regression.summary_text)
    : null;

  const rankedKeys = regression.feature_importance
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((fi) => fi.feature);

  const orderedKeys = [
    ...("const" in regression.coefficients ? ["const"] : []),
    ...rankedKeys.filter((k) => k !== "const" && k in regression.coefficients),
    ...Object.keys(regression.coefficients).filter(
      (k) => k !== "const" && !rankedKeys.includes(k)
    ),
  ];

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div>
        <p className="mb-3 text-xs text-muted-foreground">
          Standardized coefficients from OLS regression. Analysis uses default
          basket quantities.
        </p>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, bottom: 28, left: 5 }}
          >
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
      </div>

      {/* Model Fit Stats */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <h4 className="text-sm font-semibold">Model Fit</h4>
          <ModelFitInfoDialog />
        </div>
        <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/70">
          <StatRow label="R²"          value={regression.r_squared.toFixed(3)} />
          <StatRow label="Adj. R²"     value={regression.adj_r_squared.toFixed(3)} />
          <StatRow label="RMSE"        value={regression.rmse.toFixed(3)} />
          {modelStats?.nObs  && <StatRow label="Observations" value={modelStats.nObs} />}
          {modelStats?.fStat && <StatRow label="F-statistic"  value={modelStats.fStat} />}
          {modelStats?.aic   && <StatRow label="AIC"          value={modelStats.aic} />}
          {modelStats?.bic   && <StatRow label="BIC"          value={modelStats.bic} />}
        </div>
      </div>

      {/* Coefficient Table */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <h4 className="text-sm font-semibold">Regression Coefficients</h4>
          <CoefficientsInfoDialog />
        </div>
        <Card className="gap-0 py-0 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs hover:bg-muted/50">
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Variable
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground text-right">
                  Coef.
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground text-right">
                  Std. Err.
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground text-right">
                  t-stat
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground text-right">
                  p-value
                </TableHead>
                <TableHead className="h-9 text-xs font-medium text-muted-foreground">
                  Sig.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedKeys.map((key, i) => {
                const coef = regression.coefficients[key];
                if (!coef) return null;
                const tStat =
                  coef.std_err !== 0 ? coef.value / coef.std_err : NaN;
                const stars = sigStars(coef.p_value);
                const isSignificant = coef.p_value < 0.05;
                return (
                  <TableRow
                    key={key}
                    className={
                      i % 2 === 1 ? "bg-muted/20 hover:bg-muted/30" : ""
                    }
                  >
                    <TableCell className="font-medium text-xs">
                      {featureLabel(key)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums text-xs ${
                        coef.value >= 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {coef.value.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                      {coef.std_err.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      {isNaN(tStat) ? "—" : tStat.toFixed(3)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums text-xs ${
                        isSignificant
                          ? "font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {coef.p_value < 0.001
                        ? "<0.001"
                        : coef.p_value.toFixed(3)}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-amber-600 dark:text-amber-400">
                      {stars}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <p className="mt-1.5 text-xs text-muted-foreground">
          *** p&lt;0.001 &nbsp;&nbsp; ** p&lt;0.01 &nbsp;&nbsp; * p&lt;0.05
        </p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}
