/**
 * Mock data for the Command View.
 *
 * TEMPORARY. This exists so the UI can be built before the synthetic data
 * generator lands (see architecture.md §5.1). It is hand-written, not
 * calibrated to anything, and must not survive into the submission — the real
 * numbers come from generated FIRs calibrated against KSP's published Crime
 * Reviews. Replace wholesale once the API layer exists.
 */

import type { IconName } from "../components/Icon";

/* --- Session -------------------------------------------------------------- */

export const currentOfficer = {
  name: "R. Sharath Kumar, IPS",
  rank: "ASP",
  scopeLabel: "Bengaluru South Division",
  breadcrumb: ["Karnataka", "Bengaluru City", "Bengaluru South Division"],
  notifications: 3,
};

export const dateRange = "01 Jun – 17 Jul 2026";

/* --- KPI row -------------------------------------------------------------- */

export type Kpi = {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaDirection: "up" | "down";
  /** Whether this movement is good or bad — NOT which way the arrow points. */
  deltaSentiment: "good" | "bad";
  icon: IconName;
  spark: number[];
};

export const kpis: Kpi[] = [
  {
    id: "total-cases",
    label: "Total Cases",
    value: "12,842",
    delta: "18.7%",
    deltaDirection: "up",
    deltaSentiment: "good",
    icon: "file-text",
    spark: [12, 18, 14, 22, 19, 27, 24, 31, 28, 35, 30, 38, 34, 42],
  },
  {
    id: "clearance-rate",
    label: "Clearance Rate",
    value: "62.4%",
    delta: "6.3%",
    deltaDirection: "up",
    deltaSentiment: "good",
    icon: "shield-check",
    spark: [20, 24, 22, 28, 26, 32, 30, 35, 33, 38, 36, 41, 39, 44],
  },
  {
    id: "cases-undetected",
    label: "Cases Undetected",
    value: "2,317",
    delta: "9.2%",
    deltaDirection: "down",
    deltaSentiment: "good",
    icon: "eye-off",
    spark: [40, 36, 38, 33, 35, 30, 32, 27, 29, 24, 26, 21, 23, 19],
  },
  {
    id: "reporting-delay",
    label: "Avg. Reporting Delay",
    value: "3.6 days",
    delta: "0.8",
    deltaDirection: "down",
    deltaSentiment: "good",
    icon: "clock",
    spark: [30, 28, 31, 26, 28, 24, 26, 22, 24, 20, 22, 18, 20, 17],
  },
  {
    id: "active-alerts",
    label: "Active Alerts",
    value: "17",
    delta: "3",
    deltaDirection: "up",
    deltaSentiment: "bad",
    icon: "bell",
    spark: [8, 10, 9, 13, 11, 16, 14, 19, 17, 22, 20, 25, 23, 28],
  },
];

/* --- Alerts --------------------------------------------------------------- */

export type Alert = {
  id: string;
  title: string;
  delta: string;
  deltaLabel: string;
  where: string;
  when: string;
  severity: "critical" | "serious" | "warning" | "good";
};

export const alerts: Alert[] = [
  {
    id: "a1",
    title: "Spike in Robbery Cases",
    delta: "42%",
    deltaLabel: "vs baseline",
    where: "Jayanagar PS",
    when: "Last 7 days",
    severity: "critical",
  },
  {
    id: "a2",
    title: "Night-time Burglaries Rising",
    delta: "27%",
    deltaLabel: "vs baseline",
    where: "Basavanagudi & JP Nagar",
    when: "8 PM – 2 AM",
    severity: "serious",
  },
  {
    id: "a3",
    title: "Property Crime Hotspot",
    delta: "31%",
    deltaLabel: "vs baseline",
    where: "South Bengaluru Zone",
    when: "Last 14 days",
    severity: "warning",
  },
  {
    id: "a4",
    title: "Improved Clearance Rate",
    delta: "8%",
    deltaLabel: "vs last period",
    where: "All Stations in Division",
    when: "Last 30 days",
    severity: "good",
  },
];

/* --- Quick summary -------------------------------------------------------- */

export type SummaryItem = {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: IconName;
  subSentiment?: "good" | "bad";
};

export const quickSummary: SummaryItem[] = [
  {
    id: "s1",
    label: "Most Reported Crime",
    value: "Theft",
    sub: "4,236 Cases",
    icon: "tag",
  },
  {
    id: "s2",
    label: "Most Affected Time",
    value: "8 PM – 2 AM",
    sub: "38% of cases",
    icon: "clock",
  },
  {
    id: "s3",
    label: "Most Affected Area",
    value: "Jayanagar Zone",
    sub: "2,842 Cases",
    icon: "map-pin",
  },
  {
    id: "s4",
    label: "ChargeSheet Filed",
    value: "5,642",
    sub: "↑ 12.4% vs last period",
    icon: "file-check",
    subSentiment: "good",
  },
];

/* --- Recent FIRs ---------------------------------------------------------- */

export type FirStatus =
  | "Under Investigation"
  | "ChargeSheet Filed"
  | "FIR Registered";

export type Fir = {
  firNo: string;
  station: string;
  crimeHead: string;
  registeredOn: string;
  status: FirStatus;
};

export const recentFirs: Fir[] = [
  {
    firNo: "1234/2026",
    station: "Jayanagar PS",
    crimeHead: "Robbery",
    registeredOn: "17 Jul 2026, 10:45 AM",
    status: "Under Investigation",
  },
  {
    firNo: "1233/2026",
    station: "JP Nagar PS",
    crimeHead: "Theft",
    registeredOn: "17 Jul 2026, 09:32 AM",
    status: "Under Investigation",
  },
  {
    firNo: "1232/2026",
    station: "Banashankari PS",
    crimeHead: "Assault",
    registeredOn: "17 Jul 2026, 08:15 AM",
    status: "ChargeSheet Filed",
  },
  {
    firNo: "1231/2026",
    station: "VV Puram PS",
    crimeHead: "Burglary",
    registeredOn: "16 Jul 2026, 11:20 PM",
    status: "Under Investigation",
  },
  {
    firNo: "1230/2026",
    station: "Basavanagudi PS",
    crimeHead: "Theft",
    registeredOn: "16 Jul 2026, 10:05 PM",
    status: "FIR Registered",
  },
];

/* --- Map heat points ------------------------------------------------------ */

/** Named zones with a weight; points are scattered around each centre. */
const ZONES: { lat: number; lng: number; weight: number; spread: number }[] = [
  { lat: 12.9081, lng: 77.5855, weight: 1.0, spread: 0.022 }, // Bengaluru South — the hot core
  { lat: 12.9308, lng: 77.5838, weight: 0.85, spread: 0.018 }, // Jayanagar
  { lat: 12.9698, lng: 77.5986, weight: 0.5, spread: 0.03 }, // Central
  { lat: 13.0298, lng: 77.594, weight: 0.42, spread: 0.035 }, // Bengaluru North
  { lat: 12.9784, lng: 77.6408, weight: 0.4, spread: 0.032 }, // Bengaluru East
  { lat: 12.9698, lng: 77.5223, weight: 0.38, spread: 0.032 }, // Bengaluru West
  { lat: 13.1007, lng: 77.5963, weight: 0.22, spread: 0.03 }, // Yelahanka
  { lat: 12.7112, lng: 77.6947, weight: 0.16, spread: 0.035 }, // Anekal
];

/** Deterministic PRNG so the map is identical every render and every demo. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateHeatPoints(): [number, number, number][] {
  const rand = mulberry32(20260717);
  const points: [number, number, number][] = [];

  for (const zone of ZONES) {
    const count = Math.round(zone.weight * 180);
    for (let i = 0; i < count; i++) {
      // Box-Muller for a gaussian scatter — clusters look organic, not square.
      const u1 = Math.max(rand(), 1e-9);
      const u2 = rand();
      const mag = Math.sqrt(-2 * Math.log(u1));
      const dLat = mag * Math.cos(2 * Math.PI * u2) * zone.spread;
      const dLng = mag * Math.sin(2 * Math.PI * u2) * zone.spread;

      points.push([
        zone.lat + dLat,
        zone.lng + dLng,
        zone.weight * (0.55 + rand() * 0.45),
      ]);
    }
  }

  return points;
}

export const MAP_CENTER: [number, number] = [12.955, 77.595];
export const MAP_ZOOM = 11;
