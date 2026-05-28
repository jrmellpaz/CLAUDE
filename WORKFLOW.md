# CLAUDE — Data Pipeline & Dashboard Workflow

> **CLAUDE** = Computing Living Affordability Using Data Exploration

This document explains how raw government data becomes the interactive food-affordability dashboard, step by step. It is written for readers who may not have a data analytics background — technical terms are defined where they first appear.

---

## Overview

The project answers one question: **How many days of minimum wage does a household need to afford a basic food basket?**

It does this by combining price data, wage data, and economic indicators for every Philippine region, every month, from January 2018 onward. The result is an interactive web dashboard where users can explore affordability across regions, over time, and with customizable food baskets.

The system has three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — DATA PIPELINE  (Python / Jupyter notebooks)     │
│  Raw CSVs & XLSX → cleaned, merged panel.json              │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2 — STATISTICAL MODEL  (Python / Jupyter notebook)  │
│  panel.json → OLS regression → regression.json             │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3 — INTERACTIVE DASHBOARD  (React / TypeScript)     │
│  panel.json + regression.json + GeoJSON → web app          │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1 — Data Pipeline (`notebooks/01_ingest.ipynb`)

### What it does

Takes multiple raw data files from government agencies and produces a single, clean dataset: **`public/data/panel.json`**.

### Input files

| File | Source | Contains |
|------|--------|----------|
| `compiled_MASTER_wage_price_analysis.xlsx` | PSA, NWPC, BSP | Minimum wages, CPI, household size, and 5 core commodity prices (rice regular, rice well-milled, eggs, galunggong, pork kasim) across multiple Excel sheets |
| `public/data/raw/datas/*.csv` | PSA | 44 additional commodity price CSVs (vegetables, fish, meat, grains) |
| `ph-regions.geojson.json` | — | Geographic boundaries of Philippine regions (used by the map, not processed by this notebook) |

### Step-by-step process

#### Step 1: Region name standardization

**The problem:** Every data source calls the same region by a different name. PSA price sheets say `"NCR - National Capital Region"`, CPI sheets say `"National Capital Region (NCR)"`, bottom-30% CPI says just `"NCR"`, household size data says `"NCR (National Capital Region)"`, and the CSV files say `"..NCR - National Capital Region"` (with leading dots).

**The solution:** A dictionary (`REGION_MAP`) maps every known variant to one canonical name. For example, all of the above map to `"NCR"`. There are 17 canonical region names used throughout the project:

> NCR, CAR, Region I through Region XIII, BARMM

National-level rows (e.g., `"PHILIPPINES"`) are mapped to `None` and dropped, since the dashboard computes national averages on-the-fly from the 17 regional values.

#### Step 2: Load core commodity prices (from XLSX)

The master Excel file has separate sheets for each commodity (e.g., `"4a. Rice (Regular)"`, `"4d. Galunggong"`). Each sheet is in **wide format**:

> **Wide format** means each row is a region, and each column is a time period (e.g., `"2024 January"`, `"2024 February"`, ...). This is how spreadsheets are usually organized for human readability.

The notebook converts each sheet to **long format**:

> **Long format** (also called "tidy data") means each row is a single observation: one region, one month, one price. This is how data needs to be structured for merging and analysis.

Example transformation:

```
WIDE FORMAT (how the spreadsheet looks):
Region   | 2024 Jan | 2024 Feb | 2024 Mar
NCR      | 47.5     | 48.1     | 48.9
CAR      | 42.3     | 42.8     | 43.1

LONG FORMAT (what the notebook produces):
region | month   | rice_price
NCR    | 2024-01 | 47.5
NCR    | 2024-02 | 48.1
NCR    | 2024-03 | 48.9
CAR    | 2024-01 | 42.3
CAR    | 2024-02 | 42.8
CAR    | 2024-03 | 43.1
```

This is done using `pd.melt()`, a pandas function that "unpivots" columns into rows.

#### Step 3: Load additional commodity prices (from CSV files)

The 44 additional PSA commodity CSVs follow the same wide format but use semicolons (`;`) as delimiters instead of being Excel sheets. A parallel function (`load_commodity_csv`) handles the format differences:
- Skips the first 2 rows (title and blank line)
- Parses semicolon-delimited values
- Strips leading dots from region names (e.g., `"..NCR"` → `"NCR"`)
- Converts `.` and `..` (PSA's notation for missing data) to `NaN`

These 44 commodities are organized into categories:

| Category | Items |
|----------|-------|
| Cereals & grains | Corn grits (white), corn grits (yellow), monggo |
| Root crops | Camote, cassava, gabi, potato, singkamas |
| Leafy vegetables | Kangkong, pechay (native & Chinese), alugbati, gabi leaves, malunggay, onion leaves, cabbage |
| Fruit vegetables | Tomato, talong, ampalaya, sayote, upo, squash, okra, pipino, patola, string beans, baguio beans |
| Other vegetables | Carrot, labanos, onion (red & white), garlic, ginger |
| Fish & seafood | Tilapia, bangus, dilis, tulingan, budburon, barilis, tahong, gulaman dagat, lato |
| Meat & poultry | Chicken (native), edible offal |

#### Step 4: Load CPI data

**CPI (Consumer Price Index)** measures how much prices have changed over time relative to a base period (2018 = 100). A CPI of 120 means prices are 20% higher than in 2018.

Two CPI series are loaded:
- **CPI All Income** — tracks price changes for all consumers
- **CPI Bottom 30%** — tracks price changes specifically for the poorest 30% of households (whose spending patterns differ from the average — more of their budget goes to food)

The CPI data uses abbreviated month names (`"2024 Jan"` instead of `"2024 January"`), so it has its own parsing function.

#### Step 5: Load minimum wages

Minimum wages in the Philippines are set per region through **wage orders** — government decrees that specify the daily rate and an effective date. The data looks like:

```
Region | Effective Date | Daily Rate
NCR    | Jul 17, 2024   | ₱608.00
NCR    | Jul 17, 2025   | ₱658.00
CAR    | Dec 5, 2023    | ₱430.00
```

**The challenge:** Wage orders take effect on specific dates, not on the first of every month. But the rest of the data is monthly. To produce monthly wage values, the notebook uses **forward-fill**: once a wage order takes effect, that wage applies to every subsequent month until the next order.

For months *before* the first recorded wage order (e.g., NCR in January 2018, before the November 2018 order), it **back-fills** using the earliest known wage.

When wages are given as a range (e.g., `"500.00–537.00"`), the notebook takes the minimum — the non-agricultural floor rate.

#### Step 6: Load household size

Average household size by region comes from the 2020 Census of Population and Housing. This is a static value (one number per region, not changing monthly), broadcast across all months. For example, NCR = 3.83 persons, BARMM = 5.93 persons.

#### Step 7: Build the region × month spine and merge

A **spine** is a complete grid of every combination of region and month — 17 regions × 108 months = 1,836 rows. This ensures every region-month pair has a row, even if some data sources are missing values for certain periods.

All datasets are joined onto this spine using **left joins**:

> A **left join** keeps every row from the spine (left table) and attaches matching data from each source (right table). If a source doesn't have data for a particular region-month, that cell becomes `NaN` (missing).

After merging: wages and household size have no gaps (100% coverage). Commodity prices have some gaps, especially for future months not yet published by PSA. The new CSV commodities may have gaps for certain regions where PSA doesn't track that item (e.g., kangkong data is unavailable for CAR).

#### Step 8: Compute derived features

From the raw data, the notebook calculates several metrics:

| Feature | Formula | What it means |
|---------|---------|---------------|
| `daily_basket_pp` | Σ (price × quantity) for each basket item | Daily food cost per person |
| `daily_basket_hh` | `daily_basket_pp` × `household_size` | Daily food cost for the whole household |
| `monthly_basket` | `daily_basket_hh` × 30 | Monthly food cost for the household |
| `days_to_feed` | `monthly_basket` / `daily_wage` | **The core metric.** How many days of wages it takes to pay for one month of food. Higher = worse affordability. |
| `real_wage` | `daily_wage` / `cpi_all` × 100 | Wage adjusted for inflation. Tells you what the wage is "really" worth compared to 2018 prices. |
| `rice_share` | (rice cost) / `daily_basket_pp` | What fraction of the basket cost comes from rice alone |
| `wage_basket_gap` | `daily_wage` − `daily_basket_hh` | How much money is left after food. Negative = food costs more than the daily wage. |

The basket used for these pre-computed values matches the dashboard's default 9-item basket, based on the **PSA Food Threshold Menu** (see "Basis for default basket items" under Layer 3):

| Item | Quantity | Unit |
|------|----------|------|
| Rice (regular milled) | 0.35 | kg |
| Monggo (green) | 0.03 | kg |
| Camote | 0.05 | kg |
| Kangkong | 0.05 | kg |
| Malunggay | 0.03 | kg |
| Galunggong | 0.08 | kg |
| Dilis | 0.02 | kg |
| Eggs | 1 | pc |
| Pork kasim | 0.05 | kg |

> **Note:** The frontend **always recomputes** `days_to_feed` on-the-fly using the user's current basket selection. When the user hasn't customized the basket, the frontend's computed value will match the pre-computed `days_to_feed` in `panel.json`. When the user adds or removes items, the dashboard updates instantly without needing to re-run the notebook.

#### Step 9: Data quality check

- Rows missing core columns (wages, rice, fish, pork, household size) are dropped — 136 rows out of 1,836, all from future months with no price data yet.
- Missing egg prices (Region VII has none in the source) are filled with the national median for that month.
- Missing prices for the other default basket items (monggo, camote, kangkong, malunggay, dilis) are also filled with the national median for that month, ensuring the pre-computed `days_to_feed` has no gaps.
- Derived features are recomputed after the fill.

#### Step 10: Export

The final DataFrame is exported as `public/data/panel.json` (~3 MB) — a JSON array of 1,700 objects (17 regions × 100 months with data), each with 62 fields. Each object contains the original 5 commodity prices, the 44 additional commodity prices, CPI, wages, household size, and all derived metrics. Non-default commodity prices may be `null` for certain region-month pairs where PSA data is unavailable — the dashboard handles these gracefully by treating them as ₱0.

---

## Layer 2 — Statistical Model (`notebooks/03_model.ipynb`)

### What it does

Fits a regression model to answer: **Which factors most influence food affordability?**

### What is OLS regression?

**OLS (Ordinary Least Squares) regression** is a statistical method that finds the relationship between a target variable (what you want to predict) and several predictor variables (factors that might influence it).

Think of it as drawing the "best-fitting line" through data — except instead of one line through a 2D scatter plot, it finds the best-fitting surface through a multi-dimensional space.

In this project:
- **Target variable:** `days_to_feed` (how many days of wages to afford food)
- **Predictor variables:** rice price, egg price, fish price, pork price, daily wage, CPI (bottom 30%), and household size

### Key outputs

The model produces these results, saved to `public/data/regression.json`:

| Output | Value | Meaning |
|--------|-------|---------|
| R² | 0.98 | The model explains 98% of the variation in `days_to_feed`. This is very high — the chosen predictors capture almost all of what drives food affordability. |
| Adjusted R² | 0.98 | Same as R² but penalizes for having many predictors. Still 0.98, confirming the model isn't just overfitting. |
| RMSE | 0.86 | On average, the model's prediction is off by about ±0.86 days. |

### Feature importance (standardized coefficients)

To compare the influence of different predictors fairly (since they're in different units — pesos, people, index points), the model **standardizes** all variables to z-scores first:

> **Standardization (z-score):** Subtract the mean and divide by the standard deviation. This makes every variable have a mean of 0 and a standard deviation of 1, so their coefficients are directly comparable.

| Rank | Feature | Standardized Coefficient | Interpretation |
|------|---------|--------------------------|----------------|
| 1 | Daily wage | −0.92 | **Strongest driver.** Higher wages strongly reduce days-to-feed. The negative sign means "as wage goes up, days-to-feed goes down." |
| 2 | Household size | +0.68 | Larger households need more food, increasing days-to-feed. |
| 3 | Fish price | +0.46 | Fish (galunggong) is a significant cost driver. |
| 4 | Pork price | +0.45 | Pork price has a similar impact to fish. |
| 5 | Rice price | +0.08 | Smaller effect — rice is cheap per serving. |
| 6 | Egg price | −0.08 | Small negative effect (likely a statistical artifact of correlation with other variables). |
| 7 | CPI (bottom 30%) | −0.03 | Minimal independent effect after other prices are controlled for. |

**In plain language:** Wages and household size are the dominant factors. Among food prices, fish and pork matter most. Rice, despite being a staple, has a smaller impact because it's relatively inexpensive per serving.

### Model diagnostics

The notebook also runs diagnostic tests to check if the model's assumptions hold:

- **VIF (Variance Inflation Factor):** Checks if predictors are too correlated with each other ("multicollinearity"). All VIF values are below 10, which is acceptable.
- **Residual analysis:** Checks if prediction errors are random and normally distributed. The Durbin-Watson statistic of 0.12 (ideal is 2.0) indicates autocorrelation — expected in time-series data where consecutive months are similar.

---

## Exploratory Data Analysis (`notebooks/02_eda.ipynb`)

This notebook is for exploration and visualization — it doesn't produce outputs used by the dashboard, but it informed the design decisions. It generates:

- **Distribution histograms** of key variables (wages, prices, days-to-feed)
- **Time series** showing how days-to-feed has changed per region since 2018
- **Regional heatmaps** comparing affordability across regions and years
- **Correlation matrices** showing how variables relate to each other
- **Scatter plots** of key predictors vs. days-to-feed
- **Outlier analysis** identifying unusual data points (e.g., BARMM consistently appears as an outlier due to its high household size and low wages)

---

## Layer 3 — Interactive Dashboard (React / TypeScript)

### Architecture

```
public/data/
├── panel.json          ← 1,700 rows of region × month data (from Notebook 01)
├── regression.json     ← Model results (from Notebook 03)
└── ph-regions.geojson.json  ← Region boundaries for the map

src/
├── hooks/
│   ├── useData.ts      ← Fetches all three JSON files, converts snake_case → camelCase
│   ├── useBasket.ts    ← Manages basket state & computes days-to-feed
│   └── useAIAnalysis.ts ← Streams analysis from Gemini AI
├── lib/
│   ├── constants.ts    ← DEFAULT_BASKET items (49 items across 7 categories)
│   ├── buildPrompt.ts  ← Constructs the AI analysis prompt from data
│   └── utils.ts        ← Formatting helpers (peso, dates, regions)
├── types/
│   └── index.ts        ← TypeScript interfaces (PanelRow, BasketItem, etc.)
└── components/
    ├── App.tsx          ← Main app: region selector, view tabs, FAB
    ├── ChoroplethMap.tsx ← D3-powered map colored by days-to-feed
    ├── TrendChart.tsx   ← Recharts line chart of days-to-feed over time
    ├── DriversChart.tsx ← Regression coefficients bar chart + stats table
    ├── BasketSheet.tsx  ← Slide-out panel for the basket editor
    ├── BasketEditor.tsx ← Item list with checkboxes, quantities, costs
    ├── AIAnalysis.tsx   ← Gemini-powered natural language analysis
    └── Header.tsx       ← Region selector + summary stat cards
```

### Data loading (`useData.ts`)

On app startup, three JSON files are fetched in parallel. The panel data arrives with snake_case keys (e.g., `rice_price`, `daily_wage`) because that's what Python/pandas produces. The `camelizeKeys` function converts them to camelCase (e.g., `ricePrice`, `dailyWage`) to match TypeScript conventions.

### The food basket (`useBasket.ts` + `BasketEditor.tsx`)

The basket is the central interactive feature. It defines **what food items** and **how much of each** make up the daily food cost calculation.

**Default basket:** 9 items are enabled by default, chosen to mirror the **PSA Food Threshold Menu** — the Philippine government's official daily food bundle used to define the food poverty line. This is not an arbitrary selection; it reflects what the government considers the minimum daily diet for a Filipino. The defaults are further validated by two additional sources: FIES household expenditure data and FNRI dietary guidelines.

#### Basis for default basket items

**Primary basis — PSA Food Threshold Menu (2023)**

The PSA defines a daily menu for computing the food poverty threshold (₱64/person/day as of 2023). This menu specifies what a minimum-wage family is expected to eat:

| Meal | PSA Menu | Dashboard basket item |
|------|----------|-----------------------|
| Breakfast | Scrambled egg, rice | Rice (regular), Eggs |
| Lunch | Boiled monggo with malunggay, dried dilis, rice | Monggo, Malunggay, Dilis |
| Dinner | Fried fish or boiled pork, vegetable dish, rice | Galunggong, Pork kasim, Kangkong |
| Snack | Bread or boiled rootcrop | Camote |

> Source: [PSA Food Threshold Menu (Manila Bulletin, 2024)](https://mb.com.ph/2024/8/15/psa-p64-daily-food-spending-not-considered-as-food-poor-what-s-the-basis); [PSA Poverty Technical Notes](https://psa.gov.ph/statistics/poverty/technical-notes)

**Supporting basis — FIES Household Expenditure Data**

Analysis of 41,544 households from the Family Income and Expenditure Survey shows that the **bottom 20% by income** allocate their food budget as follows:

| Category | Share of food budget |
|----------|---------------------|
| Rice | 29.1% |
| Fish & marine products | 14.5% |
| Vegetables | 8.2% |
| Meat | 7.3% |

This confirms that rice, fish, vegetables, and meat (in that order) are the priority food groups for low-income Filipino households — matching the PSA menu's composition.

> Source: FIES microdata (`kaggle_fies_household_data.csv.csv` in `public/data/raw/datas/`)

**Supporting basis — FNRI Pinggang Pinoy & Daily Nutritional Guide Pyramid**

The Food and Nutrition Research Institute recommends daily intake proportions of approximately 1/3 plate rice/carbohydrates, 1/6 plate meat/fish/protein, and 1/2 plate vegetables and fruits. For adults (20–39 years old), this translates to roughly 8 servings of rice (~4 cups cooked), 4 servings of protein (fish, meat, eggs), and 2–3 servings of vegetables per day.

> Sources: [FNRI Pinggang Pinoy](https://www.fnri.dost.gov.ph/index.php/116-pinggang-pinoy); [FNRI Daily Nutritional Guide Pyramid — Adults](https://fnri.dost.gov.ph/index.php/tools-and-standard/nutritional-guide-pyramid/28-nutrition-statistic/nutritional-guide-pyramid/79-adults-20-39yrs-old)

#### Default quantities

| Item | Default qty | Unit | Rationale |
|------|-------------|------|-----------|
| Rice (regular milled) | 0.35 | kg | ~3.5 cups cooked, aligned with FNRI's 8-serving recommendation |
| Eggs | 1 | pc | PSA breakfast; FNRI protein serving |
| Galunggong | 0.08 | kg | PSA dinner fish; FIES fish = 14.5% of food budget |
| Pork kasim | 0.05 | kg | PSA dinner alternative; FIES meat = 7.3% |
| Monggo (green) | 0.03 | kg | PSA lunch viand (dried weight) |
| Malunggay | 0.03 | kg | PSA lunch ingredient (in monggo dish) |
| Dilis | 0.02 | kg | PSA lunch protein (dried) |
| Kangkong | 0.05 | kg | PSA dinner vegetable; FIES vegetables = 8.2% |
| Camote | 0.05 | kg | PSA snack rootcrop |

All other items (40 additional commodities) are available but disabled by default. Users can enable them to build a more complete or regionally specific basket.

**How `computeDaysToFeed` works:**

```
1. For each enabled basket item:
     item_cost = quantity × price_from_panel_row

2. daily_cost_per_person = sum of all item costs

3. daily_cost_household = daily_cost_per_person × household_size

4. monthly_cost = daily_cost_household × 30

5. days_to_feed = monthly_cost / daily_wage
```

When the user customizes the basket, this computation runs on every `PanelRow`, so the map, trend chart, and summary cards all update instantly to reflect the custom basket.

**Category grouping:** With 49 items, the basket editor organizes them into 7 collapsible categories (Grains & staples, Root crops, Leafy vegetables, Fruit vegetables, Other vegetables, Fish & seafood, Meat & poultry) so users can find items easily.

### Dashboard views

#### Map view (`ChoroplethMap.tsx`)
A **choropleth map** colors each region by its `days_to_feed` value for the latest month. Darker/warmer colors indicate worse affordability. Users can click a region to select it. Built with D3.js using the GeoJSON boundary data.

#### Trend view (`TrendChart.tsx`)
A line chart showing `days_to_feed` over time for the selected region (or the national average if "Philippines" is selected). Built with Recharts.

#### Drivers view (`DriversChart.tsx`)
A horizontal bar chart showing the standardized regression coefficients — which factors matter most. Bars pointing right (positive coefficients) mean that factor increases days-to-feed; bars pointing left (negative) decrease it. Color-coded: red = increases cost burden, green = decreases it. Faded bars indicate coefficients that are not statistically significant.

Also displays:
- **Model fit statistics** (R², Adjusted R², RMSE, etc.) with an info dialog explaining each metric
- **Full coefficient table** with standard errors, t-statistics, p-values, and significance stars

#### AI Analysis (`AIAnalysis.tsx`)
Sends the current region's data and regression results to **Google Gemini 2.0 Flash** via the `@google/genai` SDK. The AI generates a plain-language analysis with sections covering the summary, trends, cost drivers, real-life implications, and caveats. Responses are streamed token-by-token and rendered as Markdown.

### The floating action button (FAB)

A persistent button at the bottom-right of the screen shows the current basket's monthly cost and item count. Clicking it opens the `BasketSheet` — a slide-out panel (from the right on desktop, from the bottom on mobile) containing the full `BasketEditor`.

---

## How the pieces connect — a complete example

Here's what happens when a user opens the dashboard and selects "Region V" (Bicol):

1. **Data loads:** `useData` fetches `panel.json` (1,700 rows), `regression.json`, and the GeoJSON.
2. **Region filters:** `App.tsx` filters panel data to the latest month (e.g., `2026-04`) for all 17 regions (used by the map) and finds the row for Region V.
3. **Basket computes:** `useBasket` runs `computeDaysToFeed` on Region V's row using the default 9-item basket (rice, egg, galunggong, pork, monggo, malunggay, dilis, kangkong, camote — based on the PSA food threshold menu), producing the days-to-feed value shown in the header.
4. **Map colors:** `ChoroplethMap` runs `computeDaysToFeed` on all 17 regions' latest rows to color each region.
5. **Trend draws:** When the user switches to the trend tab, `TrendChart` runs `computeDaysToFeed` on all of Region V's 100 monthly rows to draw the line.
6. **Drivers display:** `DriversChart` reads `regression.json` and renders the coefficient chart — this doesn't change per region (it's a national model).
7. **AI analyzes:** When triggered, `AIAnalysis` builds a prompt containing Region V's data, trend, and regression results, sends it to Gemini, and streams the response.

If the user then opens the basket and enables an additional item like "Tilapia (0.05 kg)", the map, trend, header stats, and FAB cost all recompute instantly — no server round-trip needed, because all the price data is already loaded in `panel.json`.

---

## Reproducing the pipeline

To regenerate `panel.json` after updating raw data:

1. Place updated CSVs in `public/data/raw/datas/`
2. Run `notebooks/01_ingest.ipynb` (requires Python with pandas, numpy)
3. Run `notebooks/03_model.ipynb` to update `regression.json` (requires statsmodels, scipy)
4. The dashboard will pick up the new data on next page load

To add a new commodity:
1. Place the PSA CSV file in `public/data/raw/datas/`
2. Add its filename → column name mapping to `CSV_COMMODITIES` in Notebook 01
3. Add the corresponding field to `PanelRow` in `src/types/index.ts`
4. Add a `BasketItem` entry in `src/lib/constants.ts`
5. Re-run the notebook and restart the dev server
