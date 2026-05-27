# CLAUDE — Codebase Notes

## Stack

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`)
- **shadcn/ui** components built on **Base UI** (`@base-ui/react`), not Radix
- **Recharts 3** for charts
- **D3** for the choropleth map
- **pnpm** as the package manager

## React Compiler

This project uses the **React Compiler** (`babel-plugin-react-compiler` via `@rolldown/plugin-babel`).

> **Do not use `useMemo`, `useCallback`, or `memo()`.**
> The compiler handles all memoization automatically. Adding these manually is redundant noise and may interfere with compiler optimizations.

`useRef` and `useState` are still used as normal — the compiler doesn't replace those.

## Component conventions

- All UI primitives come from `src/components/ui/` (shadcn). Don't reach for native HTML `<select>`, `<button>`, etc. — use the shadcn wrappers.
- Icons come from `@hugeicons/react` + `@hugeicons/core-free-icons`. Usage: `<HugeiconsIcon icon={SomeIcon} strokeWidth={1.5} className="size-4" />`.
- Color tokens use OKLCH via CSS variables (`var(--primary)`, `var(--muted)`, etc.). Avoid hardcoded hex/rgb values.

## Data

All chart data is **static JSON** served from `/public/data/`:
- `panel.json` — regional panel rows (~876 KB)
- `regression.json` — OLS regression results
- `ph-regions.geojson.json` — GeoJSON for the choropleth

These files are pre-built. If the source spreadsheets change, re-run the Python pipeline to regenerate them.

## AI Analysis

- Uses **Google Gemini 2.0 Flash** via `@google/genai`.
- Streams responses token-by-token into a markdown string, rendered with `react-markdown` + `remark-gfm`.
- Requires a free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card needed.
- Key is stored in `.env` as `VITE_GEMINI_API_KEY`. See `.env.example`.
