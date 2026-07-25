'use strict';

/**
 * Scope resolution tests.  Run: node --test catalyst-app/functions/kspwrite
 *
 * These assert the security-critical property of the whole write layer: an
 * officer can act only within their own command subtree.
 */

const test = require('node:test');
const assert = require('node:assert');

const scope = require('./scope');
const org = require('./data/org.json');
const caseStation = require('./data/case-station.json');
const crimeCase = require('./data/crime-case.json');
const featured = require('./data/featured.json');

// Fixed points in the seeded org tree (see data/org.json).
const STATE = 1; // Karnataka State Police
const SOUTH_DIV = 3; // Bengaluru South Division
const NORTH_DIV = 4; // Bengaluru North Division
const JAYANAGAR_PS = 8; // station under South

const stationsUnder = (unitId) =>
  org.units.filter((u) => u.parent === unitId && u.typeId === 4).map((u) => u.id);

test('a station-level officer sees only their own station', () => {
  const s = scope.descendants(JAYANAGAR_PS);
  assert.deepStrictEqual([...s], [JAYANAGAR_PS]);
});

test("a division officer sees their division and its stations, and nothing from a sibling division", () => {
  const s = scope.descendants(SOUTH_DIV);
  const south = stationsUnder(SOUTH_DIV);
  const north = stationsUnder(NORTH_DIV);

  assert.ok(south.length > 0, 'fixture should have stations under South');
  assert.ok(north.length > 0, 'fixture should have stations under North');

  assert.ok(s.has(SOUTH_DIV));
  for (const id of south) assert.ok(s.has(id), `South station ${id} should be in scope`);
  for (const id of north) assert.ok(!s.has(id), `North station ${id} must NOT be in scope`);
});

test('the state unit sees every active unit', () => {
  const s = scope.descendants(STATE);
  assert.strictEqual(s.size, org.units.length);
});

test('an unknown unit resolves to empty scope, never to global scope', () => {
  assert.strictEqual(scope.descendants(999999).size, 0);
  assert.strictEqual(scope.descendants(undefined).size, 0);
  assert.strictEqual(scope.descendants(null).size, 0);
});

test('canActOn denies a station officer acting outside their station', () => {
  const si = scope.descendants(JAYANAGAR_PS);
  const north = stationsUnder(NORTH_DIV);

  assert.strictEqual(scope.canActOn(si, JAYANAGAR_PS), true);
  assert.strictEqual(scope.canActOn(si, north[0]), false);
});

test('canActOn denies when the station is unknown', () => {
  const scrb = scope.descendants(STATE);
  assert.strictEqual(scope.canActOn(scrb, null), false);
  assert.strictEqual(scope.canActOn(scrb, undefined), false);
});

test('breadcrumb runs root-first down to the unit', () => {
  const chain = scope.breadcrumb(JAYANAGAR_PS);
  assert.strictEqual(chain[0], 'Karnataka State Police');
  assert.strictEqual(chain[chain.length - 1], scope.unitName(JAYANAGAR_PS));
  assert.ok(chain.includes('Bengaluru South Division'));
});

test('every case maps to a station that exists in the org tree', () => {
  const ids = Object.keys(caseStation);
  assert.ok(ids.length > 0, 'case-station map should not be empty');
  for (const id of ids) {
    assert.ok(
      scope.unitById.has(caseStation[id]),
      `case ${id} maps to unknown station ${caseStation[id]}`
    );
  }
});

test('state scope can act on every case; a single station cannot', () => {
  const scrb = scope.descendants(STATE);
  const si = scope.descendants(JAYANAGAR_PS);
  const stations = Object.values(caseStation);

  assert.ok(stations.every((st) => scope.canActOn(scrb, st)));
  assert.ok(stations.some((st) => !scope.canActOn(si, st)));
});

test('the featured case resolves to a real, in-tree station', () => {
  const st = caseStation[String(featured.caseId)];
  assert.ok(st != null, 'featured case must exist in the case→station map');
  assert.ok(scope.unitById.has(st), 'featured case station must exist in the org tree');
});

test('CrimeNo is a unique key: every crime number maps to a known case', () => {
  const entries = Object.entries(crimeCase);
  assert.strictEqual(
    entries.length,
    Object.keys(caseStation).length,
    'there should be one crime number per case'
  );
  for (const [, caseId] of entries) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(caseStation, String(caseId)),
      `crime number maps to unknown case ${caseId}`
    );
  }
});

test('the FIR number in each CrimeNo is unique within its station and year', () => {
  // CrimeNo is 1-digit category + 4-digit district + 4-digit station + 4-digit
  // year + 5-digit serial, and that trailing serial is the case's FIR number.
  // Asserting the (station, year, serial) triple is unique is asserting that
  // CaseNo — which the UI renders as "serial/year" — identifies exactly one case
  // within a station's register for that year, the way a real FIR number does.
  // It is checked here, from the bundled data, because these files are the write
  // layer's contract with the generator: a regenerated dataset that reused FIR
  // numbers would make the lookups below ambiguous.
  const seen = new Map();
  for (const [crimeNo, caseId] of Object.entries(crimeCase)) {
    assert.strictEqual(crimeNo.length, 18, `CrimeNo ${crimeNo} is not 18 digits`);

    const station = Number(crimeNo.slice(5, 9));
    const firNo = `${Number(crimeNo.slice(13))}/${crimeNo.slice(9, 13)}`;

    assert.strictEqual(
      station,
      caseStation[String(caseId)],
      `CrimeNo ${crimeNo} encodes station ${station}, but case ${caseId} belongs to ${caseStation[String(caseId)]}`
    );

    const key = `${station}:${firNo}`;
    assert.ok(!seen.has(key), `FIR ${firNo} at station ${station} is used by cases ${seen.get(key)} and ${caseId}`);
    seen.set(key, caseId);
  }
  assert.strictEqual(seen.size, Object.keys(caseStation).length, 'every case should hold one FIR number');
});

test('command position, not rank, decides access to the featured case', () => {
  // The featured case sits in Bengaluru East. A South-division ASP outranks an
  // East-division SI, yet must still be refused — this is the property the
  // whole org-chart model exists to enforce.
  const station = caseStation[String(featured.caseId)];
  const eastStationScope = scope.descendants(station);
  const southDivScope = scope.descendants(SOUTH_DIV);
  const stateScope = scope.descendants(STATE);

  assert.strictEqual(scope.canActOn(eastStationScope, station), true);
  assert.strictEqual(scope.canActOn(southDivScope, station), false);
  assert.strictEqual(scope.canActOn(stateScope, station), true);
});
