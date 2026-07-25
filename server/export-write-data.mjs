/**
 * Export the two lookup files the kspwrite function needs at runtime.
 *
 * The write function runs as a Catalyst Advanced I/O Function and has no SQLite
 * access, but it must answer two questions on every mutating request WITHOUT
 * trusting the client:
 *
 *   org.json          - the command tree, to resolve an officer's unit subtree
 *   case-station.json - CaseMasterID -> PoliceStationID, to locate a case
 *
 * Both are small (a few KB and ~60 KB), deterministic, and committed alongside
 * the function. Deriving the station from a bundled map rather than the request
 * body is what makes the scope check tamper-proof.
 *
 * Run:  node server/export-write-data.mjs   (after the pipeline has built the DB)
 */

import Database from "better-sqlite3";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.KSP_DB || join(__dirname, "..", "data", "generated", "ksp.db");
const OUT = join(__dirname, "..", "catalyst-app", "functions", "kspwrite", "data");

const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
const all = (sql) => db.prepare(sql).all();

await mkdir(OUT, { recursive: true });

// ---- org.json: units, unit types, ranks -------------------------------------
const org = {
  units: all(
    "SELECT UnitID id, UnitName name, TypeID typeId, ParentUnit parent FROM Unit WHERE Active=1 ORDER BY UnitID"
  ),
  unitTypes: all(
    "SELECT UnitTypeID id, UnitTypeName name, CityDistState level, Hierarchy hierarchy FROM UnitType ORDER BY Hierarchy"
  ),
  ranks: all("SELECT RankID id, RankName name, Hierarchy hierarchy FROM Rank ORDER BY Hierarchy"),
};
await writeFile(join(OUT, "org.json"), JSON.stringify(org));

// ---- case-station.json: CaseMasterID -> PoliceStationID ---------------------
// ---- crime-case.json:   CrimeNo      -> CaseMasterID ------------------------
// The read API identifies a case in its payload by CrimeNo, not by primary key,
// so the function needs to resolve one to the other. CrimeNo is used rather than
// CaseNo because CaseNo is an FIR number: unique within a station's register for
// a year, but deliberately not statewide, so it cannot identify a case on its
// own. CrimeNo is one-per-case and embeds station, year and FIR serial.
const caseStation = {};
const crimeCase = {};
for (const r of all("SELECT CaseMasterID id, PoliceStationID st, CrimeNo crime FROM CaseMaster")) {
  caseStation[r.id] = r.st;
  if (r.crime != null) crimeCase[String(r.crime)] = r.id;
}
await writeFile(join(OUT, "case-station.json"), JSON.stringify(caseStation));
await writeFile(join(OUT, "crime-case.json"), JSON.stringify(crimeCase));

// The Case Details page always renders the most recent case, exactly as the read
// API's /api/cases/featured does. Resolving "featured" here keeps the write layer
// in step without an extra round trip or a change to AppSail.
const featured = db
  .prepare("SELECT CaseMasterID id FROM CaseMaster ORDER BY CrimeRegisteredDate DESC LIMIT 1")
  .get();
await writeFile(join(OUT, "featured.json"), JSON.stringify({ caseId: featured.id }));

console.log(
  `org.json: ${org.units.length} units, ${org.unitTypes.length} types, ${org.ranks.length} ranks\n` +
    `case-station.json: ${Object.keys(caseStation).length} cases\n` +
    `crime-case.json: ${Object.keys(crimeCase).length} crime numbers\n` +
    `featured.json: case ${featured.id} (station ${caseStation[featured.id]})`
);
