'use strict';

/**
 * Scope resolution over the KSP command tree.
 *
 * architecture.md §6: a user resolves to a unit, and their visible/actionable
 * scope is the subtree beneath it. An SI sees their station, an ASP their
 * division's stations, SCRB the whole state.
 *
 * This module is pure — it reads only the bundled org.json — so it is fully
 * unit-testable without Catalyst, a database, or a network.
 */

const org = require('./data/org.json');

const unitById = new Map(org.units.map((u) => [u.id, u]));
const rankById = new Map(org.ranks.map((r) => [r.id, r]));
const typeById = new Map(org.unitTypes.map((t) => [t.id, t]));

const childrenOf = new Map();
for (const u of org.units) {
  if (u.parent == null) continue;
  if (!childrenOf.has(u.parent)) childrenOf.set(u.parent, []);
  childrenOf.get(u.parent).push(u.id);
}

/**
 * Every unit id at or beneath `unitId`. Returns an empty set for an unknown
 * unit — an officer with a bad UnitID gets no scope rather than global scope.
 * The `seen` guard also makes a malformed parent cycle terminate.
 */
function descendants(unitId) {
  const out = new Set();
  if (!unitById.has(unitId)) return out;
  const stack = [unitId];
  while (stack.length) {
    const id = stack.pop();
    if (out.has(id) || !unitById.has(id)) continue;
    out.add(id);
    for (const child of childrenOf.get(id) || []) stack.push(child);
  }
  return out;
}

/** Root-to-unit chain of names, e.g. ["Karnataka State Police", …, "Jayanagar PS"]. */
function breadcrumb(unitId) {
  const chain = [];
  const seen = new Set();
  let cur = unitById.get(unitId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur.name);
    cur = cur.parent == null ? null : unitById.get(cur.parent);
  }
  return chain;
}

function unitName(unitId) {
  const u = unitById.get(unitId);
  return u ? u.name : 'Unknown Unit';
}

function rankName(rankId) {
  const r = rankById.get(rankId);
  return r ? r.name : 'Unknown Rank';
}

/** Operational level of a unit: "State" | "City" | "District". */
function unitLevel(unitId) {
  const u = unitById.get(unitId);
  const t = u ? typeById.get(u.typeId) : null;
  return t ? t.level : null;
}

/**
 * Authorization test. `stationId` comes from the bundled case→station map, never
 * from the request body, so this cannot be widened by a crafted payload.
 */
function canActOn(scopeSet, stationId) {
  return stationId != null && scopeSet.has(stationId);
}

module.exports = {
  descendants,
  breadcrumb,
  unitName,
  rankName,
  unitLevel,
  canActOn,
  unitById,
};
