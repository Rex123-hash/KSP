import initSqlJs from "sql.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * SQLite access via sql.js (pure WebAssembly) — no native module, so it runs on
 * Catalyst AppSail's managed Node runtime where better-sqlite3 fails to build.
 * The DB is read-only and bundled beside this file; sql.js loads it into memory.
 *
 * A thin shim exposes the same `db.prepare(sql).get(...)/.all(...)` surface the
 * server uses, so the API code is unchanged.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.KSP_DB || join(__dirname, "ksp.db");

const SQL = await initSqlJs({
  locateFile: (f) => join(__dirname, "node_modules", "sql.js", "dist", f),
});
const raw = new SQL.Database(readFileSync(DB_PATH));

export const db = {
  prepare(sql) {
    return {
      get(...params) {
        const stmt = raw.prepare(sql);
        try {
          if (params.length) stmt.bind(params);
          return stmt.step() ? stmt.getAsObject() : undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        const stmt = raw.prepare(sql);
        const rows = [];
        try {
          if (params.length) stmt.bind(params);
          while (stmt.step()) rows.push(stmt.getAsObject());
        } finally {
          stmt.free();
        }
        return rows;
      },
    };
  },
};

// Case-status id -> the label + pill slug the frontend expects
export const STATUS = {
  1: { label: "FIR Registered", slug: "fir-registered" },
  2: { label: "Under Investigation", slug: "under-investigation" },
  3: { label: "ChargeSheet Filed", slug: "chargesheet-filed" },
  4: { label: "Closed", slug: "closed" },
};

// CaseNo is "YYYY#####" (year + 5-digit serial); present it as "serial/year".
export function firNo(caseNo) {
  if (!caseNo || caseNo.length < 5) return caseNo || "";
  const year = caseNo.slice(0, 4);
  const serial = parseInt(caseNo.slice(4), 10);
  return `${serial}/${year}`;
}
