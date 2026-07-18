/**
 * Mock data for Trends & Alerts.
 * TEMPORARY — replaced by precomputed trend baselines, spike detection, and the
 * risk model's output (architecture.md §5.3). Illustrative values only.
 */

import type { IconName } from "../components/Icon";

export const trendsDateRange = "01 Jun – 17 Jul 2026";

/* --- KPI tiles ------------------------------------------------------------ */

export type TrendKpi = {
  id: string;
  label: string;
  value: string;
  icon: IconName;
  delta?: string;
  deltaDirection?: "up" | "down";
  deltaSentiment?: "good" | "bad";
  spark?: number[];
  /** alerts tile shows a severity breakdown instead of a sparkline */
  breakdown?: { label: string; tone: string }[];
};

export const trendKpis: TrendKpi[] = [
  {
    id: "total",
    label: "Total Cases",
    value: "12,842",
    icon: "file-text",
    delta: "18.7%",
    deltaDirection: "up",
    deltaSentiment: "good",
    spark: [20, 24, 22, 28, 26, 31, 29, 34, 31, 37, 34, 40, 37, 43],
  },
  {
    id: "increasing",
    label: "Increasing Crimes",
    value: "4",
    icon: "arrow-up",
    delta: "25%",
    deltaDirection: "up",
    deltaSentiment: "bad",
    spark: [10, 14, 12, 18, 15, 21, 19, 24, 22, 27, 25, 30, 28, 33],
  },
  {
    id: "decreasing",
    label: "Decreasing Crimes",
    value: "3",
    icon: "arrow-down",
    delta: "12%",
    deltaDirection: "down",
    deltaSentiment: "good",
    spark: [33, 30, 31, 27, 28, 24, 26, 28, 25, 30, 28, 33, 31, 36],
  },
  {
    id: "alerts",
    label: "Active Alerts",
    value: "7",
    icon: "bell",
    breakdown: [
      { label: "2 High", tone: "var(--status-critical)" },
      { label: "3 Medium", tone: "var(--status-warning)" },
      { label: "2 Low", tone: "var(--status-neutral)" },
    ],
  },
];

/* --- Trend overview (dual-series line) ------------------------------------ */

export const trendAxisLabels = [
  "01 Jun",
  "08 Jun",
  "15 Jun",
  "22 Jun",
  "29 Jun",
  "06 Jul",
  "13 Jul",
  "17 Jul",
];

export const trendCurrent = [
  820, 900, 880, 1020, 970, 1080, 1010, 940, 1000, 1120, 1080, 1240, 1180, 1360,
  1420, 1520, 1480, 1560, 1600, 1580, 1640,
];
export const trendPrevious = [
  430, 520, 560, 640, 600, 700, 660, 720, 690, 780, 740, 820, 800, 860, 900,
  760, 820, 900, 880, 940, 900,
];

/* --- Trending crimes ------------------------------------------------------ */

export type TrendingCrime = {
  crimeHead: string;
  direction: "up" | "down";
  change: string;
  cases: string;
  spark: number[];
};

export const trendingCrimes: TrendingCrime[] = [
  { crimeHead: "Robbery", direction: "up", change: "42%", cases: "2,317", spark: [10, 14, 12, 18, 16, 22, 25] },
  { crimeHead: "Night-time Burglaries", direction: "up", change: "27%", cases: "1,233", spark: [12, 15, 14, 19, 17, 23, 26] },
  { crimeHead: "Vehicle Theft", direction: "up", change: "22%", cases: "987", spark: [14, 13, 17, 16, 20, 19, 24] },
  { crimeHead: "Assault", direction: "down", change: "14%", cases: "1,905", spark: [26, 24, 25, 21, 22, 19, 17] },
  { crimeHead: "Chain Snatching", direction: "down", change: "9%", cases: "654", spark: [22, 20, 23, 19, 21, 18, 17] },
];

/* --- Alert summary -------------------------------------------------------- */

export type TrendAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  where: string;
  when: string;
};

export const trendAlerts: TrendAlert[] = [
  { id: "t1", severity: "high", title: "Spike in Robbery Cases", where: "Jayanagar Zone", when: "Last 7 days" },
  { id: "t2", severity: "medium", title: "Night-time Burglaries Rising", where: "Basavanagudi & JP Nagar", when: "8 PM – 2 AM" },
  { id: "t3", severity: "medium", title: "Property Crime Hotspot", where: "South Bengaluru Zone", when: "Last 14 days" },
  { id: "t4", severity: "low", title: "Improved Clearance Rate", where: "All Stations in Division", when: "Last 30 days" },
];

/* --- Predicted risk zones (next 7 days) ----------------------------------- */

export type RiskZone = {
  zone: string;
  level: "High" | "Medium" | "Low";
  pct: number;
};

export const riskZones: RiskZone[] = [
  { zone: "Jayanagar Zone", level: "High", pct: 72 },
  { zone: "JP Nagar Zone", level: "Medium", pct: 58 },
  { zone: "Basavanagudi Zone", level: "Medium", pct: 47 },
  { zone: "VV Puram Zone", level: "Low", pct: 28 },
  { zone: "Banashankari Zone", level: "Low", pct: 22 },
];
