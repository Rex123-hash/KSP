'use strict';

/**
 * kspwrite — the authenticated write layer.
 *
 * Served by Catalyst at /server/kspwrite on the SAME origin as the SPA, which is
 * the whole reason this is a Function and not part of the AppSail read API: the
 * Catalyst session cookie is scoped to the Web Client Hosting domain and never
 * reaches the AppSail origin. Same-origin means catalyst.initialize(req) can
 * resolve the real signed-in user with no token juggling.
 *
 * Identity  : Catalyst Authentication (we never see or store a password)
 * Storage   : Catalyst Data Store
 * Authority : the Unit.ParentUnit command tree — see scope.js and architecture.md §6
 *
 * Every mutating request follows one path:
 *   session -> AppUser -> case's station (bundled map) -> scope test -> write -> audit
 * Denials are refused AND recorded. The client never supplies identity or scope.
 */

const express = require('express');
const catalyst = require('zcatalyst-sdk-node');

const scope = require('./scope');
const caseStation = require('./data/case-station.json');
const crimeCase = require('./data/crime-case.json');
const featured = require('./data/featured.json');

const app = express();
app.use(express.json({ limit: '64kb' }));

const STATUS = {
  1: 'FIR Registered',
  2: 'Under Investigation',
  3: 'ChargeSheet Filed',
  4: 'Closed',
};
const CLOSED_STATUS_ID = 4;
const NOTE_MAX = 2000;

// ---- small helpers ----------------------------------------------------------

/** Escape a string for safe interpolation into a ZCQL literal. */
const zesc = (s) => String(s == null ? '' : s).replace(/'/g, "''");

/** Strict integer coercion; returns null for anything else. */
function asInt(v) {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return parseInt(v, 10);
  return null;
}

/** ZCQL returns [{TableName: {...cols}}]; flatten to the column objects. */
const rowsOf = (res, table) => (res || []).map((r) => r[table]).filter(Boolean);

/**
 * Resolve the `:id` path segment to a CaseMasterID. Accepts:
 *   "featured"  - the most recent case, matching the read API's /cases/featured
 *   a CaseMasterID
 *   a CrimeNo   - what the read payload actually exposes per case
 *
 * Returns null when it resolves to nothing. Note this only *identifies* a case;
 * the station always comes from case-station.json, so a caller choosing an
 * arbitrary id still cannot act outside their own command scope.
 */
function resolveCaseId(raw) {
  if (raw == null) return null;
  const key = String(raw).trim();
  if (key === 'featured') return featured.caseId;

  const n = asInt(key);
  if (n != null && Object.prototype.hasOwnProperty.call(caseStation, String(n))) return n;

  if (Object.prototype.hasOwnProperty.call(crimeCase, key)) return crimeCase[key];
  return null;
}

// ---- identity & authorization ----------------------------------------------

/**
 * catalyst.initialize() THROWS when it cannot read project details — which is
 * the case anywhere outside the Catalyst runtime (local boot, smoke tests). It
 * must never take a request down, so failure degrades to "no session".
 */
function initCatalyst(req) {
  try {
    return catalyst.initialize(req);
  } catch (_) {
    return null;
  }
}

async function catalystUser(capp) {
  try {
    const u = await capp.userManagement().getCurrentUser();
    return u && u.email_id ? u : null;
  } catch (_) {
    return null; // not signed in, or auth not reachable
  }
}

async function appUserFor(capp, email) {
  const res = await capp
    .zcql()
    .executeZCQLQuery(
      `SELECT AppUser.Email, AppUser.DisplayName, AppUser.RankID, AppUser.RankName, ` +
        `AppUser.UnitID, AppUser.Designation, AppUser.Role, AppUser.Active ` +
        `FROM AppUser WHERE AppUser.Email = '${zesc(email)}' LIMIT 1`
    );
  const row = rowsOf(res, 'AppUser')[0];
  if (!row) return null;
  if (row.Active === false || row.Active === 'false') return null;
  return row;
}

/**
 * Resolve the caller. Returns null when unauthenticated or when the signed-in
 * email has no AppUser record — authenticated-but-unmapped gets no scope rather
 * than defaulting to anything.
 */
async function resolveActor(req) {
  const capp = initCatalyst(req);
  if (!capp) return { capp: null, actor: null };

  const cu = await catalystUser(capp);
  if (!cu) return { capp, actor: null };

  const au = await appUserFor(capp, cu.email_id);
  if (!au) return { capp, actor: null, unmapped: cu.email_id };

  const unitId = asInt(au.UnitID);
  const scopeSet = scope.descendants(unitId);
  const displayName =
    au.DisplayName || [cu.first_name, cu.last_name].filter(Boolean).join(' ') || cu.email_id;

  return {
    capp,
    actor: {
      email: cu.email_id,
      name: displayName,
      rankId: asInt(au.RankID),
      rankName: au.RankName || scope.rankName(asInt(au.RankID)),
      unitId,
      unitName: scope.unitName(unitId),
      designation: au.Designation || null,
      role: au.Role || 'investigator',
      scopeSet,
    },
  };
}

async function audit(capp, actor, entry) {
  try {
    await capp.datastore().table('AuditLog').insertRow({
      ActorEmail: actor ? actor.email : 'anonymous',
      ActorName: actor ? actor.name : 'Anonymous',
      ActorUnitID: actor ? actor.unitId : null,
      Action: entry.action,
      EntityType: entry.entityType,
      EntityID: String(entry.entityId == null ? '' : entry.entityId),
      Outcome: entry.outcome,
      Detail: (entry.detail || '').slice(0, 1000),
    });
  } catch (err) {
    // Never let an audit failure mask the caller's result; surface it in logs.
    console.error('audit write failed', err && err.message);
  }
}

/**
 * Guard for case-scoped mutations. Resolves the actor, locates the case's
 * station from the bundled map (never from the body), and tests command scope.
 * Writes the deny audit row itself and returns null when refused.
 */
async function requireCaseAccess(req, res, { action }) {
  const { capp, actor, unmapped } = await resolveActor(req);

  if (!actor) {
    res.status(401).json({
      error: 'not_authenticated',
      message: unmapped
        ? `${unmapped} is signed in but not mapped to an officer record.`
        : 'Sign in to perform this action.',
    });
    return null;
  }

  const caseId = resolveCaseId(req.params.id);
  const stationId = caseId == null ? null : caseStation[String(caseId)];

  if (stationId == null) {
    await audit(capp, actor, {
      action,
      entityType: 'case',
      entityId: req.params.id,
      outcome: 'deny',
      detail: 'Unknown case id',
    });
    res.status(404).json({ error: 'unknown_case', message: 'No such case.' });
    return null;
  }

  if (!scope.canActOn(actor.scopeSet, stationId)) {
    await audit(capp, actor, {
      action,
      entityType: 'case',
      entityId: caseId,
      outcome: 'deny',
      detail: `Case belongs to ${scope.unitName(stationId)}; actor commands ${actor.unitName}`,
    });
    res.status(403).json({
      error: 'out_of_scope',
      message: `${scope.unitName(stationId)} is outside your command scope. The attempt has been recorded.`,
    });
    return null;
  }

  return { capp, actor, caseId, stationId };
}

// ---- routes -----------------------------------------------------------------

const router = express.Router();

// Express 4 does not catch rejections from async handlers — one unhandled
// rejection takes the whole function down. Wrap every handler once, here, so a
// failure becomes a 500 rather than a dead process.
for (const method of ['get', 'post', 'put']) {
  const original = router[method].bind(router);
  router[method] = (path, handler) =>
    original(path, (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next));
}

router.get('/health', (_req, res) => res.json({ ok: true, service: 'kspwrite' }));

/** Who am I, and what do I command? The client renders from this, never asserts it. */
router.get('/session', async (req, res) => {
  try {
    const { actor, unmapped } = await resolveActor(req);
    if (!actor) {
      return res.json({ authenticated: false, unmapped: unmapped || null });
    }
    res.json({
      authenticated: true,
      user: {
        email: actor.email,
        name: actor.name,
        rank: actor.rankName,
        rankId: actor.rankId,
        unitId: actor.unitId,
        unitName: actor.unitName,
        designation: actor.designation,
        role: actor.role,
        level: scope.unitLevel(actor.unitId),
        scopeLabel: actor.unitName,
        breadcrumb: scope.breadcrumb(actor.unitId),
        scopeUnitIds: [...actor.scopeSet],
        scopeSize: actor.scopeSet.size,
      },
    });
  } catch (err) {
    console.error('session failed', err);
    res.status(500).json({ error: 'session_failed', message: 'Could not resolve session.' });
  }
});

/**
 * Write-side overlay for a case: notes plus the latest status change.
 * Reads require authentication but not command scope — an officer may read
 * across the state; `canWrite` tells the UI whether they may act.
 */
router.get('/cases/:id/overlay', async (req, res) => {
  try {
    const { capp, actor } = await resolveActor(req);
    if (!actor) return res.status(401).json({ error: 'not_authenticated' });

    const caseId = resolveCaseId(req.params.id);
    if (caseId == null) return res.status(404).json({ error: 'unknown_case' });

    const [noteRes, statusRes] = await Promise.all([
      capp.zcql().executeZCQLQuery(
        `SELECT CaseNote.ROWID, CaseNote.NoteText, CaseNote.AuthorName, CaseNote.AuthorEmail, ` +
          `CaseNote.CREATEDTIME FROM CaseNote WHERE CaseNote.CaseMasterID = ${caseId} ` +
          `ORDER BY CaseNote.CREATEDTIME DESC LIMIT 100`
      ),
      capp.zcql().executeZCQLQuery(
        `SELECT CaseStatusChange.ROWID, CaseStatusChange.FromStatusID, CaseStatusChange.ToStatusID, ` +
          `CaseStatusChange.Reason, CaseStatusChange.AuthorName, CaseStatusChange.CREATEDTIME ` +
          `FROM CaseStatusChange WHERE CaseStatusChange.CaseMasterID = ${caseId} ` +
          `ORDER BY CaseStatusChange.CREATEDTIME DESC LIMIT 20`
      ),
    ]);

    const changes = rowsOf(statusRes, 'CaseStatusChange');
    const latest = changes[0] || null;
    const stationId = caseStation[String(caseId)];

    res.json({
      caseId,
      canWrite: scope.canActOn(actor.scopeSet, stationId),
      station: stationId == null ? null : scope.unitName(stationId),
      notes: rowsOf(noteRes, 'CaseNote').map((n) => ({
        id: n.ROWID,
        text: n.NoteText,
        authorName: n.AuthorName,
        authorEmail: n.AuthorEmail,
        createdAt: n.CREATEDTIME,
      })),
      statusHistory: changes.map((c) => ({
        id: c.ROWID,
        fromStatusId: asInt(c.FromStatusID),
        toStatusId: asInt(c.ToStatusID),
        toStatus: STATUS[asInt(c.ToStatusID)] || null,
        reason: c.Reason,
        authorName: c.AuthorName,
        createdAt: c.CREATEDTIME,
      })),
      effectiveStatusId: latest ? asInt(latest.ToStatusID) : null,
      effectiveStatus: latest ? STATUS[asInt(latest.ToStatusID)] || null : null,
    });
  } catch (err) {
    console.error('overlay failed', err);
    res.status(500).json({ error: 'overlay_failed', message: 'Could not load case overlay.' });
  }
});

router.post('/cases/:id/notes', async (req, res) => {
  const ctx = await requireCaseAccess(req, res, { action: 'note.add' });
  if (!ctx) return;
  const { capp, actor, caseId } = ctx;

  const text = String((req.body && req.body.text) || '').trim();
  if (!text) return res.status(400).json({ error: 'empty_note', message: 'Note text is required.' });
  if (text.length > NOTE_MAX) {
    return res
      .status(400)
      .json({ error: 'note_too_long', message: `Notes are limited to ${NOTE_MAX} characters.` });
  }

  try {
    const row = await capp.datastore().table('CaseNote').insertRow({
      CaseMasterID: caseId,
      NoteText: text,
      AuthorEmail: actor.email,
      AuthorName: actor.name,
      AuthorUnitID: actor.unitId,
    });
    await audit(capp, actor, {
      action: 'note.add',
      entityType: 'case',
      entityId: caseId,
      outcome: 'allow',
      detail: text.slice(0, 200),
    });
    res.status(201).json({
      id: row.ROWID,
      text,
      authorName: actor.name,
      authorEmail: actor.email,
      createdAt: row.CREATEDTIME,
    });
  } catch (err) {
    console.error('note insert failed', err);
    res.status(500).json({ error: 'write_failed', message: 'Could not save the note.' });
  }
});

/** Shared implementation for an explicit status change and for "close case". */
async function changeStatus(req, res, { action, forcedStatusId }) {
  const ctx = await requireCaseAccess(req, res, { action });
  if (!ctx) return;
  const { capp, actor, caseId } = ctx;

  const body = req.body || {};
  const toStatusId = forcedStatusId != null ? forcedStatusId : asInt(body.toStatusId);
  if (toStatusId == null || !STATUS[toStatusId]) {
    return res
      .status(400)
      .json({ error: 'bad_status', message: 'A valid target status is required.' });
  }
  const fromStatusId = asInt(body.fromStatusId);
  const reason = String(body.reason || '').trim().slice(0, 500);

  try {
    const row = await capp.datastore().table('CaseStatusChange').insertRow({
      CaseMasterID: caseId,
      FromStatusID: fromStatusId,
      ToStatusID: toStatusId,
      Reason: reason,
      AuthorEmail: actor.email,
      AuthorName: actor.name,
      AuthorUnitID: actor.unitId,
    });
    await audit(capp, actor, {
      action,
      entityType: 'case',
      entityId: caseId,
      outcome: 'allow',
      detail: `${fromStatusId ? STATUS[fromStatusId] || fromStatusId : '—'} → ${STATUS[toStatusId]}${
        reason ? ` (${reason})` : ''
      }`,
    });
    res.status(201).json({
      id: row.ROWID,
      caseId,
      fromStatusId,
      toStatusId,
      toStatus: STATUS[toStatusId],
      reason,
      authorName: actor.name,
      createdAt: row.CREATEDTIME,
    });
  } catch (err) {
    console.error('status insert failed', err);
    res.status(500).json({ error: 'write_failed', message: 'Could not record the status change.' });
  }
}

router.post('/cases/:id/status', (req, res) =>
  changeStatus(req, res, { action: 'case.status', forcedStatusId: null })
);

router.post('/cases/:id/close', (req, res) =>
  changeStatus(req, res, { action: 'case.close', forcedStatusId: CLOSED_STATUS_ID })
);

// ---- profile ----------------------------------------------------------------

router.get('/profile', async (req, res) => {
  try {
    const { capp, actor } = await resolveActor(req);
    if (!actor) return res.status(401).json({ error: 'not_authenticated' });

    const pres = await capp
      .zcql()
      .executeZCQLQuery(
        `SELECT UserProfile.ROWID, UserProfile.Phone, UserProfile.PreferredLanguage, ` +
          `UserProfile.DisplayName FROM UserProfile WHERE UserProfile.Email = '${zesc(actor.email)}' LIMIT 1`
      );
    const p = rowsOf(pres, 'UserProfile')[0] || {};

    res.json({
      email: actor.email,
      displayName: p.DisplayName || actor.name,
      phone: p.Phone || '',
      preferredLanguage: p.PreferredLanguage || 'en',
      rank: actor.rankName,
      unitName: actor.unitName,
      designation: actor.designation,
      role: actor.role,
    });
  } catch (err) {
    console.error('profile read failed', err);
    res.status(500).json({ error: 'profile_failed' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { capp, actor } = await resolveActor(req);
    if (!actor) return res.status(401).json({ error: 'not_authenticated' });

    const body = req.body || {};
    const displayName = String(body.displayName || '').trim().slice(0, 255);
    const phone = String(body.phone || '').trim().slice(0, 32);
    const preferredLanguage = ['en', 'kn'].includes(body.preferredLanguage)
      ? body.preferredLanguage
      : 'en';

    if (phone && !/^[0-9+\-\s()]{6,32}$/.test(phone)) {
      return res.status(400).json({ error: 'bad_phone', message: 'Enter a valid phone number.' });
    }

    const table = capp.datastore().table('UserProfile');
    const existing = await capp
      .zcql()
      .executeZCQLQuery(
        `SELECT UserProfile.ROWID FROM UserProfile WHERE UserProfile.Email = '${zesc(actor.email)}' LIMIT 1`
      );
    const rowId = (rowsOf(existing, 'UserProfile')[0] || {}).ROWID;

    const payload = {
      Email: actor.email,
      DisplayName: displayName || actor.name,
      Phone: phone,
      PreferredLanguage: preferredLanguage,
    };
    if (rowId) await table.updateRow({ ROWID: rowId, ...payload });
    else await table.insertRow(payload);

    await audit(capp, actor, {
      action: 'profile.update',
      entityType: 'profile',
      entityId: actor.email,
      outcome: 'allow',
      detail: `name="${payload.DisplayName}" phone="${phone}" lang=${preferredLanguage}`,
    });

    res.json({ ok: true, ...payload });
  } catch (err) {
    console.error('profile write failed', err);
    res.status(500).json({ error: 'write_failed', message: 'Could not save your profile.' });
  }
});

// ---- audit trail ------------------------------------------------------------

/** Recent activity within the caller's command scope. Denials included — that is the point. */
router.get('/audit', async (req, res) => {
  try {
    const { capp, actor } = await resolveActor(req);
    if (!actor) return res.status(401).json({ error: 'not_authenticated' });

    const limit = Math.min(Math.max(asInt(req.query.limit) || 50, 1), 200);
    const units = [...actor.scopeSet];
    const unitList = units.length ? units.join(',') : '-1';

    const ares = await capp
      .zcql()
      .executeZCQLQuery(
        `SELECT AuditLog.ROWID, AuditLog.ActorName, AuditLog.ActorEmail, AuditLog.ActorUnitID, ` +
          `AuditLog.Action, AuditLog.EntityType, AuditLog.EntityID, AuditLog.Outcome, ` +
          `AuditLog.Detail, AuditLog.CREATEDTIME FROM AuditLog ` +
          `WHERE AuditLog.ActorUnitID IN (${unitList}) ` +
          `ORDER BY AuditLog.CREATEDTIME DESC LIMIT ${limit}`
      );

    res.json({
      scopeLabel: actor.unitName,
      entries: rowsOf(ares, 'AuditLog').map((a) => ({
        id: a.ROWID,
        actorName: a.ActorName,
        actorEmail: a.ActorEmail,
        actorUnit: scope.unitName(asInt(a.ActorUnitID)),
        action: a.Action,
        entityType: a.EntityType,
        entityId: a.EntityID,
        outcome: a.Outcome,
        detail: a.Detail,
        createdAt: a.CREATEDTIME,
      })),
    });
  } catch (err) {
    console.error('audit read failed', err);
    res.status(500).json({ error: 'audit_failed', message: 'Could not load the audit trail.' });
  }
});

// Catalyst may or may not strip the /server/<name> prefix depending on how the
// request is routed; mounting both keeps the function reachable either way.
app.use('/', router);
app.use('/server/kspwrite', router);

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

// Final safety net for anything the route wrappers forward.
app.use((err, _req, res, _next) => {
  console.error('unhandled', err && (err.stack || err.message || err));
  if (res.headersSent) return;
  res.status(500).json({ error: 'server_error', message: 'Unexpected server error.' });
});

module.exports = app;
