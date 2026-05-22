import { useState, useEffect } from "react";
import type { PanelRow, RegressionResult } from "@/types";
import type { FeatureCollection } from "geojson";

interface DataState {
  panel: PanelRow[];
  regression: RegressionResult | null;
  geo: FeatureCollection | null;
  loading: boolean;
  error: string | null;
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function camelizeKeys<T>(obj: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = v;
  }
  return out as T;
}

export function useData(): DataState {
  const [state, setState] = useState<DataState>({
    panel: [],
    regression: null,
    geo: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.all([
      fetch("/data/panel.json").then((r) => r.json()),
      fetch("/data/regression.json").then((r) => r.json()),
      fetch("/data/ph-regions.geojson.json").then((r) => r.json()),
    ])
      .then(([rawPanel, regression, geo]) => {
        const panel = (rawPanel as Record<string, unknown>[]).map(
          (row) => camelizeKeys<PanelRow>(row),
        );
        setState({ panel, regression, geo, loading: false, error: null });
      })
      .catch((err) => {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      });
  }, []);

  return state;
}
