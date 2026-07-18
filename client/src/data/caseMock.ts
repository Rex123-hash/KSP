/**
 * Mock data for Case / FIR Details.
 * TEMPORARY — replaced by real CaseMaster / ComplainantDetails / Accused /
 * Victim / ActSectionAssociation joins. Illustrative only.
 *
 * CrimeNo in the real schema is structured (1-digit category + 4-digit district
 * + 4-digit station + 4-digit year + 5-digit serial); the UI decodes it. Here
 * the short CaseNo form is used for display.
 */

export type CaseStatus = "Under Investigation" | "ChargeSheet Filed" | "FIR Registered";

export const caseHeader = {
  firNo: "1234/2026",
  station: "Jayanagar PS",
  crimeHead: "Robbery",
  registeredOn: "17 Jul 2026, 10:45 AM",
  status: "Under Investigation" as CaseStatus,
};

export const caseTabs = [
  { key: "info", label: "Case Information" },
  { key: "accused", label: "Accused", count: 2 },
  { key: "victim", label: "Victim", count: 1 },
  { key: "sections", label: "Sections", count: 3 },
  { key: "documents", label: "Documents", count: 4 },
  { key: "timeline", label: "Timeline" },
  { key: "location", label: "Location" },
];

export const caseInfo: { label: string; value: string }[] = [
  { label: "Complainant Name", value: "Suresh B." },
  { label: "Complainant Type", value: "Individual" },
  { label: "Place of Occurrence", value: "19th Main, Jayanagar" },
  { label: "Beat", value: "Beat 12" },
  { label: "Method of Offence", value: "Threat with Weapon" },
  { label: "Property Stolen", value: "Mobile Phone, Wallet" },
  { label: "Estimated Value", value: "₹18,000" },
  { label: "Case Officer", value: "ASI Mahesh" },
  { label: "Remarks", value: "Investigation in progress" },
];

export const caseLocation = {
  lat: 12.9308,
  lng: 77.5838,
  address: "19th Main, 4th T Block, Jayanagar, Bengaluru – 560041",
};

export type SummaryTone = "good" | "warning" | "serious" | "critical" | "neutral";

export const caseSummary: {
  icon: "shield-check" | "alert" | "calendar" | "clock";
  label: string;
  value: string;
  tone?: SummaryTone;
}[] = [
  { icon: "shield-check", label: "Severity Level", value: "Medium", tone: "warning" },
  { icon: "alert", label: "Priority", value: "Normal" },
  { icon: "calendar", label: "Age of Case", value: "6 days" },
  { icon: "clock", label: "Days Since Occurrence", value: "6 days" },
  { icon: "clock", label: "Last Updated", value: "22 Jul 2026, 09:32 AM" },
];
