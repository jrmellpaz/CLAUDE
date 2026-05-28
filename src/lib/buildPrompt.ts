import type { PanelRow, RegressionResult, CustomParams } from "@/types";
import { FEATURE_LABELS } from "@/lib/constants";
import { formatMonth } from "@/lib/utils";

interface PromptParams {
  region: string;
  daysToFeed: number;
  baselineDtf: number;
  dailyWage: number;
  monthlyBasket: number;
  latestMonth: string;
  earliestMonth: string;
  trendData: Array<{ month: string; dtf: number }>;
  regression: RegressionResult | null;
  customParams?: CustomParams | null;
}

function featureLabel(key: string): string {
  const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  return FEATURE_LABELS[key] ?? FEATURE_LABELS[camelKey] ?? key.replace(/_/g, " ");
}

export function buildAnalysisPrompt(params: PromptParams): string {
  const {
    region,
    daysToFeed,
    baselineDtf,
    dailyWage,
    monthlyBasket,
    latestMonth,
    earliestMonth,
    trendData,
    regression,
  } = params;

  const changePercent = baselineDtf > 0
    ? (((daysToFeed - baselineDtf) / baselineDtf) * 100).toFixed(1)
    : null;

  const direction = changePercent !== null
    ? parseFloat(changePercent) > 0 ? "worsened" : "improved"
    : "unclear";

  // Find highest and lowest DTF months for this region
  const sortedTrend = [...trendData].sort((a, b) => a.dtf - b.dtf);
  const bestMonth = sortedTrend[0];
  const worstMonth = sortedTrend[sortedTrend.length - 1];

  // Top 3 regression drivers (positive = increases cost burden)
  const topDrivers = regression
    ? regression.feature_importance
        .slice()
        .sort((a, b) => Math.abs(b.std_coef) - Math.abs(a.std_coef))
        .slice(0, 4)
        .map((fi) => ({
          label: featureLabel(fi.feature),
          direction: fi.std_coef > 0 ? "increases" : "decreases",
          magnitude: Math.abs(fi.std_coef).toFixed(3),
          significant: regression.coefficients[fi.feature]?.p_value !== undefined
            ? regression.coefficients[fi.feature].p_value < 0.05
            : false,
        }))
    : [];

  const modelFit = regression
    ? `The statistical model fits well (R² = ${regression.r_squared.toFixed(2)}), meaning it explains ${(regression.r_squared * 100).toFixed(0)}% of the variation in food affordability.`
    : "";

  return `You are a data analyst helping Filipino citizens understand food affordability data.
Write a clear, friendly, and insightful analysis in **Markdown format**. Use headers, bold text, and bullet points to make it easy to read.
Avoid jargon. Write as if explaining to someone who has never seen a data dashboard before.
Do not say "As an AI" or mention this prompt. Be concise — aim for 4–5 short sections.

---

**DATA SUMMARY FOR ${region === "CUSTOM" && params.customParams ? `a custom scenario (prices from ${params.customParams.baseRegion === "PHILIPPINES" ? "national average" : params.customParams.baseRegion}, user-defined wage of ₱${params.customParams.dailyWage.toFixed(2)}/day, household size of ${params.customParams.householdSize})` : region === "PHILIPPINES" ? "the whole Philippines (national average)" : region}**

- **Time period covered:** ${formatMonth(earliestMonth)} to ${formatMonth(latestMonth)}
- **Days of minimum wage needed to feed a household (latest, ${formatMonth(latestMonth)}):** ${daysToFeed.toFixed(1)} days
- **Days to feed at the 2018 baseline:** ${baselineDtf.toFixed(1)} days
- **Change since 2018:** ${changePercent !== null ? `${parseFloat(changePercent) > 0 ? "+" : ""}${changePercent}% (${direction})` : "N/A"}
- **Daily minimum wage:** ₱${dailyWage.toFixed(2)}
- **Monthly food basket cost:** ₱${monthlyBasket.toFixed(2)}
${bestMonth ? `- **Best month for affordability:** ${formatMonth(bestMonth.month)} (${bestMonth.dtf.toFixed(1)} days)` : ""}
${worstMonth ? `- **Worst month for affordability:** ${formatMonth(worstMonth.month)} (${worstMonth.dtf.toFixed(1)} days)` : ""}

**KEY DRIVERS OF FOOD AFFORDABILITY (from regression analysis):**
${topDrivers.map((d) => `- **${d.label}**: ${d.direction} the number of days needed (standardized effect = ${d.magnitude})${d.significant ? " — statistically significant" : " — less certain"}`).join("\n")}

${modelFit}

---

Now write a friendly, plain-language analysis with the following sections:

## 📊 Summary
Give a 2–3 sentence plain-language summary of the current situation for ${region === "CUSTOM" ? "this custom scenario" : region === "PHILIPPINES" ? "the Philippines" : region}. Is it easy or hard to afford food on ${region === "CUSTOM" ? "the user-specified wage" : "minimum wage"}?

## 📈 Has it gotten better or worse?
Explain the trend since 2018 in simple terms. What does the percentage change actually mean for a real family?

## 🥗 What's driving food costs?
Explain in everyday language what factors most affect whether food is affordable or not, based on the regression data above.

## 💡 What does this mean for families?
Translate the numbers into real-life terms. For example, what does "X days" actually look like for a household earning minimum wage?

## ⚠️ Things to keep in mind
Briefly mention 1–2 limitations of this data or analysis (e.g., the basket is a simplified estimate, wages vary, not all items are included).`;
}

export function buildTrendData(
  panelData: PanelRow[],
  region: string,
  computeDaysToFeed: (row: PanelRow) => number,
  customParams?: CustomParams | null,
): Array<{ month: string; dtf: number }> {
  const effectiveRegion = region === "CUSTOM" && customParams
    ? customParams.baseRegion
    : region;
  if (effectiveRegion === "PHILIPPINES") {
    // Group by month and average
    const byMonth = new Map<string, number[]>();
    for (const row of panelData) {
      if (!byMonth.has(row.month)) byMonth.set(row.month, []);
      byMonth.get(row.month)!.push(computeDaysToFeed(row));
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month,
        dtf: values.reduce((a, b) => a + b, 0) / values.length,
      }));
  }
  return panelData
    .filter((r) => r.region === effectiveRegion)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((r) => ({ month: r.month, dtf: computeDaysToFeed(r) }));
}
