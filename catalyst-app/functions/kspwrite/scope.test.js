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
