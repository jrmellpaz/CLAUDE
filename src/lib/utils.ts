import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PanelRow } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLatestMonth(panel: PanelRow[]): string {
  return panel.reduce((max, r) => (r.month > max ? r.month : max), "");
}

export function getEarliestMonth(panel: PanelRow[]): string {
  return panel.reduce(
    (min, r) => (r.month < min ? r.month : min),
    "9999-99"
  );
}

export function getUniqueRegions(panel: PanelRow[]): string[] {
  const set = new Set(panel.map((r) => r.region));
  return Array.from(set).sort();
}

export function formatPeso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}