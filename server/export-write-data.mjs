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
const caseStation = {};
for (const r of all("SELECT CaseMasterID id, PoliceStationID st FROM CaseMaster")) {
  caseStation[r.id] = r.st;
}
await writeFile(join(OUT, "case-station.json"), JSON.stringify(caseStation));

console.log(
  `org.json: ${org.units.length} units, ${org.unitTypes.length} types, ${org.ranks.length} ranks\n` +
    `case-station.json: ${Object.keys(caseStation).length} cases`
);
