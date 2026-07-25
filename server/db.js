import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.KSP_DB || join(__dirname, "..", "data", "generated", "ksp.db");

export const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

// Case-status id -> the label + pill slug the frontend expects
export const STATUS = {
  1: { label: "FIR Registered", slug: "fir-registered" },
  2: { label: "Under Investigation", slug: "under-investigation" },
  3: { label: "ChargeSheet Filed", slug: "chargesheet-filed" },
  4: { label: "Closed", slug: "closed" },
};

// CaseNo is "YYYY#####" (year + 5-digit serial drawn from the station's FIR
// register for that year); present it the way an officer writes it: "serial/year".
export function firNo(caseNo) {
  if (!caseNo || caseNo.length < 5) return caseNo || "";
  const year = caseNo.slice(0, 4);
  const serial = parseInt(caseNo.slice(4), 10);
  return `${serial}/${year}`;
}
