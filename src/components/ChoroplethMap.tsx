import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { FeatureCollection } from "geojson";
import type { PanelRow } from "@/types";

interface ChoroplethMapProps {
  geo: FeatureCollection | null;
  data: PanelRow[];
  selectedRegion: string;
  onRegionClick: (region: string) => void;
  computeDaysToFeed: (row: PanelRow) => number;
}

export function ChoroplethMap({
  geo,
  data,
  selectedRegion,
  onRegionClick,
  computeDaysToFeed,
}: ChoroplethMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const regionGeo = geo;

  const regionDtf = new Map<string, number>();
  for (const row of data) {
    regionDtf.set(row.region, computeDaysToFeed(row));
  }

  const dtfValues = Array.from(regionDtf.values());
  const extent: [number, number] = dtfValues.length > 0
    ? [Math.min(...dtfValues), Math.max(...dtfValues)]
    : [0, 1];

  useEffect(() => {
    if (!regionGeo || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 500;
    const height = 600;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const projection = d3
      .geoMercator()
      .center([122, 12])
      .scale(2200)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3
      .scaleSequential()
      .domain(extent)
      .interpolator(
        d3.interpolateRgbBasis(["#f7e888", "#f5a623", "#d94f3b", "#8b1a1a"])
      );

    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("*").remove();

    const g = svg.append("g");

    g.selectAll("path")
      .data(regionGeo.features)
      .join("path")
      .attr("d", path as never)
      .attr("fill", (d) => {
        const name = (d.properties?.region ?? "") as string;
        const dtf = regionDtf.get(name);
        return dtf !== undefined ? colorScale(dtf) : "#e5e7eb";
      })
      .attr("stroke", (d) => {
        const name = (d.properties?.region ?? "") as string;
        return name === selectedRegion ? "#000" : "#fff";
      })
      .attr("stroke-width", (d) => {
        const name = (d.properties?.region ?? "") as string;
        return name === selectedRegion ? 2 : 0.5;
      })
      .attr("cursor", "pointer")
      .on("click", (_, d) => {
        const name = (d.properties?.region ?? "") as string;
        if (name) onRegionClick(name);
      })
      .on("mouseenter", (event, d) => {
        const name = (d.properties?.region ?? "") as string;
        const dtf = regionDtf.get(name);
        tooltip
          .style("opacity", "1")
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 28}px`)
          .html(
            `<strong>${name}</strong><br/>Days to feed: ${
              dtf !== undefined ? dtf.toFixed(1) : "N/A"
            }`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.offsetX + 12}px`)
          .style("top", `${event.offsetY - 28}px`);
      })
      .on("mouseleave", () => {
        tooltip.style("opacity", "0");
      });

    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = width - legendWidth - 20;
    const legendY = height - 30;

    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "legend-gradient");

    gradient
      .selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .join("stop")
      .attr("offset", (d) => `${d * 100}%`)
      .attr("stop-color", (d) =>
        colorScale(extent[0] + d * (extent[1] - extent[0]))
      );

    const legend = svg
      .append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#legend-gradient)")
      .attr("rx", 2);

    const legendScale = d3
      .scaleLinear()
      .domain(extent)
      .range([0, legendWidth]);

    legend
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(
        d3
          .axisBottom(legendScale)
          .ticks(4)
          .tickFormat((d) => `${(d as number).toFixed(0)}d`)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll("text").attr("fill", "currentColor").style("font-size", "10px")
      )
      .call((g) => g.selectAll("line").attr("stroke", "currentColor"));
  }, [regionGeo, regionDtf, extent, selectedRegion, onRegionClick]);

  if (!regionGeo) return <p className="text-muted-foreground">Loading map…</p>;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        className="mx-auto w-full max-w-lg text-foreground"
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute rounded border bg-background px-2 py-1 text-xs shadow opacity-0 transition-opacity"
      />
    </div>
  );
}
