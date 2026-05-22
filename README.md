# Days to Feed

An interactive dashboard that answers: **"How many days of minimum wage does it take to feed a Filipino household?"**

It tracks food affordability across all 17 Philippine regions from January 2018 to the latest available data, combining minimum wage rates, commodity prices, CPI, and household size into a single metric — *days to feed*.

## Features

- **Choropleth map** — color-coded Philippine regions by days-to-feed, with tooltips and click-to-select
- **Trend chart** — monthly time series comparing a selected region against the national average
- **Drivers chart** — OLS regression coefficients showing which factors (rice price, wage, CPI, etc.) most influence the metric
- **Basket editor** — adjust food quantities (rice, eggs, galunggong, pork) to see how the metric changes in real time
- **KPI cards** — days to feed, change vs. 2018 baseline, daily minimum wage, and monthly food cost

## Project Structure

```
├── notebooks/                  # Data pipeline (Python / Jupyter)
│   ├── 01_ingest.ipynb         #   Raw data → panel.json
│   ├── 02_eda.ipynb            #   Exploratory data analysis
│   └── 03_model.ipynb          #   OLS regression → regression.json
├── public/
│   └── data/
│       ├── raw/                #   Source datasets (xlsx, csv, pdf)
│       ├── panel.json          #   Master panel: 17 regions × 100 months
│       ├── regression.json     #   Regression results & feature importance
│       └── ph-regions.geojson.json  # Philippine region boundaries
├── src/
│   ├── App.tsx                 # Root layout, view switching, region selection
│   ├── main.tsx                # React entry point
│   ├── index.css               # Tailwind CSS + theme variables
│   ├── components/
│   │   ├── Header.tsx          # Title + KPI cards
│   │   ├── ViewTabs.tsx        # Map / Trend / Drivers tab switcher
│   │   ├── RegionPicker.tsx    # Region dropdown
│   │   ├── BasketEditor.tsx    # Food basket quantity editor
│   │   ├── ChoroplethMap.tsx   # D3 geo map
│   │   ├── TrendChart.tsx      # Recharts line chart
│   │   ├── DriversChart.tsx    # Recharts bar chart (regression)
│   │   └── ui/                 # shadcn/ui primitives (Button, Chart)
│   ├── hooks/
│   │   ├── useData.ts          # Fetches panel, regression, and GeoJSON
│   │   └── useBasket.ts        # Basket state and days-to-feed computation
│   ├── lib/
│   │   ├── constants.ts        # Default basket, feature labels, region list
│   │   ├── utils.ts            # Formatting helpers
│   │   └── province-to-region.ts
│   └── types/
│       └── index.ts            # PanelRow, BasketItem, RegressionResult
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Data Sources

| Dataset | Source | Coverage |
|---|---|---|
| Minimum wages | NWPC wage orders | 2018–2026, 17 regions |
| Commodity prices (rice, eggs, fish, pork) | PSA retail price surveys | 2018–2026, monthly |
| CPI (all income & bottom 30%) | PSA Consumer Price Index | 2018–2026, monthly |
| Household size | PSA Census of Population 2020 | Static per region |

Raw data is compiled into `public/data/raw/compiled_MASTER_wage_price_analysis.xlsx`. The Jupyter notebooks process this into the JSON files consumed by the dashboard.

## Tech Stack

- **React 19** with React Compiler (automatic memoization)
- **TypeScript 6**
- **Vite 8** (dev server & build)
- **Tailwind CSS 4** + **shadcn/ui** (base-luma style)
- **D3** for the choropleth map
- **Recharts** for trend and drivers charts
- **pnpm** for package management
- **Python / Pandas** for the data pipeline (Jupyter notebooks)

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- Python 3.9+ with Jupyter (only needed to re-run the data pipeline)

### Install & Run

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Build for production
pnpm build

# Preview the production build
pnpm preview
```

### Regenerating Data (Optional)

If you need to update the data from new source files:

```bash
cd notebooks
jupyter notebook
```

Run the notebooks in order:

1. **`01_ingest.ipynb`** — reads the master Excel file and outputs `public/data/panel.json`
2. **`02_eda.ipynb`** — exploratory analysis (no output files)
3. **`03_model.ipynb`** — runs OLS regression and outputs `public/data/regression.json`

## Key Metric

**Days to feed** = (daily per-person basket cost x household size x 30) / daily minimum wage

It represents how many days a minimum-wage earner must work in a month solely to cover their household's basic food costs. A value above 30 means a single minimum wage cannot cover monthly food expenses.
