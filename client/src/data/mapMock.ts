/**
 * Mock data for the Map & Hotspots page.
 *
 * TEMPORARY — hand-written to build the UI. Replaced by precomputed hotspot
 * grids and district/zone rollups once the pipeline lands (architecture.md
 * §5.3). Totals here are kept consistent with the Command View mock.
 */

import type { IconName } from "../components/Icon";

export const dateRangeLabel = "01 Jun – 17 Jul 2026";

export const mapFilters = {
  crimeHead: "All Crime Heads",
  timeOfDay: "All Time",
  viewBy: "Heatmap",
  level: "Zone",
};

/* --- Hotspot insight (the currently-focused zone) ------------------------- */

export type HotspotInsight = {
  zone: string;
  intensity: "High Intensity" | "Medium Intensity" | "Low Intensity";
  delta: string;
  peakTime: string;
  topCrimeHead: string;
  totalCases: string;
};

export const hotspotInsight: HotspotInsight = {
  zone: "Jayanagar Zone",
  intensity: "High Intensity",
  delta: "42%",
  peakTime: "8 PM – 2 AM",
  topCrimeHead: "Theft",
  totalCases: "1,243",
};

/* --- Crime-head breakdown (donut) ----------------------------------------- */

export type CrimeHeadSlice = {
  label: string;
  pct: number;
  count: string;
  /** token role for the slice fill */
  tone: string;
};

export const totalCasesInView = "12,842";

/* Categorical fills drawn from the brand family + gold, fixed order, tail
   folded into "Others" per the series-count rule. Not a rainbow. */
export const crimeHeadSlices: CrimeHeadSlice[] = [
  { label: "Theft", pct: 36, count: "4,670", tone: "var(--brand-green-800)" },
  { label: "Robbery", pct: 18, count: "2,317", tone: "var(--brand-green-600)" },
  { label: "Assault", pct: 15, count: "1,905", tone: "var(--seq-400)" },
  { label: "Burglary", pct: 12, count: "1,542", tone: "var(--brand-gold-500)" },
  { label: "Others", pct: 19, count: "2,408", tone: "var(--line-grid)" },
];

/* --- Filter option lists (for the dropdown chips) ------------------------- */

export const filterOptions: Record<string, { label: string; icon?: IconName }[]> =
  {
    crimeHead: [
      { label: "All Crime Heads" },
      { label: "Theft" },
      { label: "Robbery" },
      { label: "Assault" },
      { label: "Burglary" },
    ],
    timeOfDay: [
      { label: "All Time" },
      { label: "Morning (6 AM – 12 PM)" },
      { label: "Afternoon (12 – 6 PM)" },
      { label: "Evening (6 PM – 12 AM)" },
      { label: "Night (12 – 6 AM)" },
    ],
    viewBy: [
      { label: "Heatmap", icon: "map-pin" },
      { label: "Clusters", icon: "layers" },
    ],
    level: [{ label: "Zone" }, { label: "District" }, { label: "Station" }],
  };
