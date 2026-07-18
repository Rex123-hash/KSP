/**
 * Mock data for the Person & Network page.
 *
 * TEMPORARY — hand-written to build the UI. Replaced by the person-resolution
 * engine's output (architecture.md §5.2): ResolvedPerson + PersonCaseLink, every
 * link carrying a real confidence score, evaluated against generated ground
 * truth. The confidence values here are illustrative, not computed.
 *
 * No photographs anywhere: the schema has none (Accused is name/age/gender
 * only), so people are shown as initial avatars, never invented faces.
 */

import type { FirStatus } from "./mock";

export type ConfidenceTier = "high" | "medium" | "low";

export function tierOf(score: number): ConfidenceTier {
  if (score >= 75) return "high";
  if (score >= 60) return "medium";
  return "low";
}

/* --- The resolved person at the centre ------------------------------------ */

export type ResolvedPerson = {
  name: string;
  confidence: number;
  aliases: string[];
  knownFor: string;
  age: number;
  gender: string;
  lastSeen: string;
  linkedCases: number;
  /** The raw name strings that resolved into this one person — the moat, shown. */
  mergedFrom: string[];
  riskScore: number;
};

export const focusPerson: ResolvedPerson = {
  name: "Ravi Kumar",
  confidence: 89,
  aliases: ["Ravi", "RK"],
  knownFor: "Theft, Robbery",
  age: 34,
  gender: "Male",
  lastSeen: "16 Jul 2026",
  linkedCases: 5,
  mergedFrom: ["Ravi Kumar", "Ravikumar", "Ravi Kumara", "Ravi K."],
  riskScore: 72,
};

/* --- Connected persons (graph nodes) -------------------------------------- */

export type NetworkNode = {
  id: string;
  name: string;
  confidence: number;
  /** identity certainty of the node itself, not the edge */
  kind: "known" | "associated" | "unknown";
  /** angle position on the ring, degrees clockwise from top */
  angle: number;
};

export const networkNodes: NetworkNode[] = [
  { id: "n1", name: "Rohit Sharma", confidence: 72, kind: "associated", angle: 0 },
  { id: "n2", name: "Vikram Shetty", confidence: 61, kind: "known", angle: 55 },
  { id: "n3", name: "Unknown", confidence: 48, kind: "unknown", angle: 120 },
  { id: "n4", name: "Sandeep M.", confidence: 67, kind: "known", angle: 180 },
  { id: "n5", name: "Imran Ali", confidence: 78, kind: "known", angle: 235 },
  { id: "n6", name: "Arun Prasad", confidence: 65, kind: "associated", angle: 300 },
];

/* --- Relation summary ----------------------------------------------------- */

export const relationSummary = {
  total: 6,
  high: 3,
  medium: 2,
  low: 1,
};

/* --- Connected-to list (right rail) --------------------------------------- */

export type Connection = {
  name: string;
  confidence: number;
  relation: string;
};

export const connections: Connection[] = [
  { name: "Imran Ali", confidence: 78, relation: "Associated" },
  { name: "Arun Prasad", confidence: 65, relation: "Associated" },
  { name: "Vikram Shetty", confidence: 61, relation: "Associated" },
];

/* --- Network insights ----------------------------------------------------- */

export const networkInsights = {
  strongAssociations: "3 strong links detected",
  networkDensity: "Medium",
  activityLevel: "High",
  riskScore: 72,
};

/* --- Linked cases --------------------------------------------------------- */

export type LinkedCase = {
  firNo: string;
  crimeHead: string;
  station: string;
  date: string;
  status: FirStatus | "Chain Snatching";
};

export type LinkedCaseRow = {
  firNo: string;
  crimeHead: string;
  station: string;
  date: string;
  status: FirStatus;
};

export const linkedCases: LinkedCaseRow[] = [
  {
    firNo: "1234/2026",
    crimeHead: "Theft",
    station: "Jayanagar PS",
    date: "17 Jul 2026",
    status: "Under Investigation",
  },
  {
    firNo: "1198/2026",
    crimeHead: "Robbery",
    station: "JP Nagar PS",
    date: "12 Jul 2026",
    status: "ChargeSheet Filed",
  },
  {
    firNo: "1087/2026",
    crimeHead: "Burglary",
    station: "Banashankari PS",
    date: "08 Jul 2026",
    status: "Under Investigation",
  },
  {
    firNo: "1023/2026",
    crimeHead: "Chain Snatching",
    station: "VV Puram PS",
    date: "05 Jul 2026",
    status: "FIR Registered",
  },
  {
    firNo: "0998/2026",
    crimeHead: "Assault",
    station: "Basavanagudi PS",
    date: "02 Jul 2026",
    status: "Under Investigation",
  },
];
