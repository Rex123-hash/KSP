/**
 * Invariants the generated database must hold.  Run: node --test server/
 *
 * These guard properties the read API and the write layer both lean on, and that
 * a change to the generator could silently break. They need a built database —
 * run `python pipeline/build.py` first.
 */

import test from "node:test";
import assert from "node:assert";

import { db, firNo } from "./db.js";

const all = (sql) => db.prepare(sql).all();

test("CrimeNo is unique across every case", () => {
  const [{ n, d }] = all("SELECT COUNT(*) n, COUNT(DISTINCT CrimeNo) d FROM CaseMaster");
  assert.ok(n > 0, "database should contain cases");
  assert.strictEqual(d, n, `${n - d} cases share a CrimeNo`);
});

test("CaseNo is unique per police station per year, as a real FIR number is", () => {
  // A real FIR number identifies one case within its station's register for that
  // year. It is not unique statewide — two stations legitimately both have FIR
  // 1/2026 — so uniqueness is asserted per (station, year), not globally.
  const dupes = all(`
    SELECT PoliceStationID station, substr(CaseNo, 1, 4) year, CaseNo, COUNT(*) n
      FROM CaseMaster
     WHERE CaseNo IS NOT NULL
     GROUP BY 1, 2, 3
    HAVING n > 1
     ORDER BY n DESC`);

  assert.deepStrictEqual(
    dupes,
    [],
    `${dupes.length} station-year FIR numbers are reused; worst: ` +
      dupes
        .slice(0, 3)
        .map((r) => `${firNo(r.CaseNo)} at station ${r.station} (${r.n} cases)`)
        .join(", ")
  );
});

test("every case has a CaseNo in the YYYY##### form firNo() decodes", () => {
  const bad = all(
    "SELECT CaseMasterID id, CaseNo FROM CaseMaster WHERE CaseNo IS NULL OR CaseNo NOT GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'"
  );
  assert.deepStrictEqual(bad, [], "CaseNo must be a 4-digit year followed by a 5-digit serial");
});

test("the FIR serial restarts at 1 each year within a station", () => {
  // A per-station-per-year counter, not a running total: every station-year that
  // has cases at all must have issued serial 1.
  const missingFirst = all(`
    SELECT PoliceStationID station, substr(CaseNo, 1, 4) year
      FROM CaseMaster
     WHERE CaseNo IS NOT NULL
     GROUP BY 1, 2
    HAVING MIN(CAST(substr(CaseNo, 5) AS INTEGER)) <> 1`);

  assert.deepStrictEqual(missingFirst, [], "each station-year register should start at serial 1");
});

test("the serial embedded in CrimeNo is the FIR serial for that station and year", () => {
  // CrimeNo is 1-digit category + 4-digit district + 4-digit station + 4-digit
  // year + 5-digit serial. The trailing serial and year must agree with CaseNo,
  // and the embedded station with PoliceStationID — the UI decodes CrimeNo, so a
  // drift between the two numbers would show the officer a contradiction.
  const mismatched = all(`
    SELECT CaseMasterID id, CrimeNo, CaseNo, PoliceStationID station
      FROM CaseMaster
     WHERE length(CrimeNo) <> 18
        OR CAST(substr(CrimeNo, 6, 4) AS INTEGER) <> PoliceStationID
        OR substr(CrimeNo, 10, 4) <> substr(CaseNo, 1, 4)
        OR substr(CrimeNo, 14, 5) <> substr(CaseNo, 5)`);

  assert.deepStrictEqual(mismatched, [], "CrimeNo should encode the same station, year and serial");
});
