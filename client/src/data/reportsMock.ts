/**
 * Mock data for the Reports page.
 * TEMPORARY — replaced by precomputed rollups. Illustrative only.
 *
 * Note on "Convictions": the ER schema records case status and chargesheet
 * outcome (ChargesheetDetails.cstype) but no court verdict field, so conviction
 * counts would need a court-outcome source the current schema doesn't carry.
 * Shown here for the reporting layout; flagged as not-yet-backed in the plan.
 */

import type { Kpi } from "./mock";
import type { CrimeHeadSlice } from "./mapMock";

export const reportsDateRange = "01 Jun – 17 Jul 2026";

export const reportKpis: Kpi[] = [
  { id: "total", label: "Total Cases", value: "12,842", delta: "18.7%", deltaDirection: "up", deltaSentiment: "good", icon: "file-text", spark: [20, 24, 22, 28, 26, 31, 29, 34, 31, 37, 34, 40, 37, 43] },
  { id: "registered", label: "Registered Cases", value: "9,654", delta: "15.3%", deltaDirection: "up", deltaSentiment: "good", icon: "chart-up", spark: [18, 22, 20, 26, 24, 29, 27, 32, 30, 35, 33, 38, 36, 41] },
  { id: "chargesheet", label: "Chargesheet Filed", value: "5,642", delta: "12.4%", deltaDirection: "up", deltaSentiment: "good", icon: "file-check", spark: [16, 19, 18, 23, 21, 26, 24, 28, 27, 31, 29, 34, 32, 37] },
  { id: "convictions", label: "Convictions", value: "1,234", delta: "8.6%", deltaDirection: "up", deltaSentiment: "good", icon: "shield-check", spark: [10, 13, 12, 16, 15, 19, 17, 21, 20, 24, 22, 26, 25, 29] },
  { id: "pending", label: "Pending Cases", value: "6,213", delta: "6.2%", deltaDirection: "up", deltaSentiment: "bad", icon: "clock", spark: [30, 28, 31, 27, 29, 25, 27, 29, 26, 31, 28, 33, 30, 35] },
];

/* --- Cases over time (3 categorical series) ------------------------------- */

export const reportAxisLabels = [
  "01 Jun", "08 Jun", "15 Jun", "22 Jun", "29 Jun", "06 Jul", "13 Jul", "17 Jul",
];

export type LineSeries = { label: string; color: string; data: number[] };

export const reportSeries: LineSeries[] = [
  {
    label: "Registered",
    color: "var(--brand-green-700)",
    data: [820, 900, 880, 1020, 970, 1080, 1010, 1120, 1080, 1240, 1180, 1320, 1280, 1400, 1460, 1520, 1480, 1560, 1600, 1580, 1640],
  },
  {
    label: "Chargesheet Filed",
    color: "var(--brand-gold-500)",
    data: [430, 520, 500, 560, 540, 620, 600, 660, 640, 720, 700, 760, 740, 800, 820, 860, 840, 900, 880, 920, 940],
  },
  {
    label: "Convictions",
    color: "#5b53b8",
    data: [90, 110, 100, 130, 120, 150, 140, 160, 155, 180, 170, 190, 185, 200, 210, 220, 215, 235, 230, 245, 260],
  },
];

/* --- Cases by crime head (donut, 6 slices) -------------------------------- */

export const reportTotalCases = "12,842";

export const reportCrimeHeads: CrimeHeadSlice[] = [
  { label: "Theft", pct: 36, count: "4,670", tone: "var(--brand-green-800)" },
  { label: "Robbery", pct: 18, count: "2,317", tone: "var(--brand-green-600)" },
  { label: "Assault", pct: 15, count: "1,905", tone: "var(--seq-400)" },
  { label: "Burglary", pct: 12, count: "1,542", tone: "var(--brand-gold-500)" },
  { label: "Other IPC", pct: 10, count: "1,284", tone: "#5b53b8" },
  { label: "Others", pct: 9, count: "1,124", tone: "var(--line-grid)" },
];

/* --- Report summary (downloadable reports) -------------------------------- */

export type ReportRow = {
  icon: "chart-up" | "tag" | "map-pin" | "calendar";
  type: string;
  description: string;
  period: string;
  generatedOn: string;
};

export const reportRows: ReportRow[] = [
  { icon: "chart-up", type: "Crime Summary Report", description: "Overview of crime statistics and key metrics", period: "01 Jun – 17 Jul 2026", generatedOn: "17 Jul 2026, 10:30 AM" },
  { icon: "tag", type: "Crime Head Analysis", description: "Detailed analysis by crime head", period: "01 Jun – 17 Jul 2026", generatedOn: "17 Jul 2026, 10:25 AM" },
  { icon: "map-pin", type: "Zone Comparison Report", description: "Comparison across zones and divisions", period: "01 Jun – 17 Jul 2026", generatedOn: "17 Jul 2026, 10:20 AM" },
  { icon: "calendar", type: "Monthly Trend Report", description: "Month-on-month trend analysis", period: "01 Jun – 17 Jul 2026", generatedOn: "17 Jul 2026, 10:15 AM" },
];

/* --- Top zones by cases --------------------------------------------------- */

export type ZoneRow = { zone: string; cases: string; pct: number };

export const topZones: ZoneRow[] = [
  { zone: "Jayanagar Zone", cases: "2,842", pct: 22.1 },
  { zone: "JP Nagar Zone", cases: "2,317", pct: 18.0 },
  { zone: "Basavanagudi Zone", cases: "1,905", pct: 14.8 },
  { zone: "VV Puram Zone", cases: "1,542", pct: 12.0 },
  { zone: "Banashankari Zone", cases: "1,284", pct: 10.0 },
];
