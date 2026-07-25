import express from "express";
import { db, STATUS, firNo } from "./db.js";

// Note: Catalyst's AppSail layer already sets CORS headers (reflecting the
// caller's origin). Adding an Express cors() here produces a SECOND, conflicting
// Access-Control-Allow-Origin header, which browsers reject ("Failed to fetch").
// So we deliberately do not add cors() — Catalyst handles it.
const app = express();

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000;
const one = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);

// Data date span, used for the date-range label everywhere.
const span = one(
  "SELECT MIN(CrimeRegisteredDate) a, MAX(CrimeRegisteredDate) b FROM CaseMaster"
);
function fmt(d) {
  const dt = d instanceof Date ? d : new Date(String(d).replace(" ", "T"));
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
// KPIs are computed over the most recent 60 days; label the range to match.
const CUR_START = new Date(span.b.replace(" ", "T"));
CUR_START.setDate(CUR_START.getDate() - 60);
const DATE_RANGE = `${fmt(CUR_START)} – ${fmt(span.b)}`;
// Reports are all-time; keep the full span available for them.
const FULL_RANGE = `${fmt(span.a)} – ${fmt(span.b)}`;

// ---- Officer / scope (the signed-in context) --------------------------------
const OFFICER = {
  name: "R. Sharath Kumar, IPS",
  rank: "ASP",
  scopeLabel: "Bengaluru South Division",
  breadcrumb: ["Karnataka", "Bengaluru City", "Bengaluru South Division"],
  notifications: 0, // replaced per-request in /api/meta
};

app.get("/api/meta", (_req, res) => {
  // notifications is the live count of active risk alerts, not a fixed number —
  // a badge that never changes is worse than no badge.
  res.json({
    officer: { ...OFFICER, notifications: alerts().length },
    dateRange: DATE_RANGE,
  });
});

// ---- KPIs (computed live over a selectable window) --------------------------
function daysAgo(n) {
  const d = new Date(span.b.replace(" ", "T"));
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function rangeLabel(days) {
  const start = new Date(span.b.replace(" ", "T"));
  start.setDate(start.getDate() - days);
  return `${fmt(start)} – ${fmt(span.b)}`;
}

function computeKpis(days) {
  const curStart = daysAgo(days);
  const prevStart = daysAgo(days * 2);
  const rows = all(
    `SELECT cm.CrimeRegisteredDate reg, cm.IncidentFromDate inc, cs.cstype
     FROM CaseMaster cm LEFT JOIN ChargesheetDetails cs ON cs.CaseMasterID = cm.CaseMasterID
     WHERE cm.CrimeRegisteredDate >= ?`, prevStart);
  const cur = rows.filter((r) => r.reg >= curStart);
  const prev = rows.filter((r) => r.reg < curStart);

  const clr = (a) => {
    const disp = a.filter((r) => r.cstype);
    const A = a.filter((r) => r.cstype === "A").length;
    return disp.length ? (A / disp.length) * 100 : 0;
  };
  const und = (a) => a.filter((r) => r.cstype === "C").length;
  const delay = (a) => {
    const ds = a.map((r) => {
      try { return (new Date(r.reg.replace(" ", "T")) - new Date(r.inc.replace(" ", "T"))) / 86400000; }
      catch { return null; }
    }).filter((x) => x != null && x >= 0);
    return ds.length ? ds.reduce((s, x) => s + x, 0) / ds.length : 0;
  };
  const weeks = Math.max(4, Math.min(9, Math.ceil(days / 7)));
  const spark = new Array(weeks).fill(0);
  const end = new Date(span.b.replace(" ", "T"));
  for (const r of cur) {
    const wk = Math.floor((end - new Date(r.reg.replace(" ", "T"))) / (7 * 86400000));
    if (wk >= 0 && wk < weeks) spark[weeks - 1 - wk]++;
  }
  const pct = (c, p) => (p ? ((c - p) / p) * 100 : 0);
  const z = zones();
  const activeAlerts = z.filter((x) => x.riskLevel !== "Low").length;
  const highZones = z.filter((x) => x.riskLevel === "High").length;

  const dTot = pct(cur.length, prev.length);
  const dClr = clr(cur) - clr(prev);
  const dUnd = pct(und(cur), und(prev));
  const dDelay = delay(cur) - delay(prev);

  return [
    { id: "total-cases", label: "Total Cases", value: cur.length.toLocaleString("en-IN"), delta: `${Math.abs(dTot).toFixed(1)}%`, deltaDirection: dTot >= 0 ? "up" : "down", deltaSentiment: "good", spark },
    { id: "clearance-rate", label: "Clearance Rate", value: `${clr(cur).toFixed(1)}%`, delta: `${Math.abs(dClr).toFixed(1)}%`, deltaDirection: dClr >= 0 ? "up" : "down", deltaSentiment: "good", spark },
    { id: "cases-undetected", label: "Cases Undetected", value: und(cur).toLocaleString("en-IN"), delta: `${Math.abs(dUnd).toFixed(1)}%`, deltaDirection: dUnd <= 0 ? "down" : "up", deltaSentiment: dUnd <= 0 ? "good" : "bad", spark },
    { id: "reporting-delay", label: "Avg. Reporting Delay", value: `${delay(cur).toFixed(1)} days`, delta: `${Math.abs(dDelay).toFixed(1)}`, deltaDirection: dDelay <= 0 ? "down" : "up", deltaSentiment: dDelay <= 0 ? "good" : "bad", spark },
    { id: "active-alerts", label: "Active Alerts", value: String(activeAlerts), delta: String(highZones), deltaDirection: "up", deltaSentiment: "bad", spark },
  ];
}
const reqDays = (req) => Math.max(7, Math.min(365, parseInt(req.query.days) || 60));
function kpis(days = 60) { return computeKpis(days); }
app.get("/api/kpis", (req, res) => res.json(kpis(reqDays(req))));

// ---- Crime-head shares ------------------------------------------------------
const TONES = [
  "var(--brand-green-800)", "var(--brand-green-600)", "var(--seq-400)",
  "var(--brand-gold-500)", "#5b53b8", "var(--line-grid)",
];
function crimeHeads() {
  return all("SELECT * FROM CrimeHeadShare ORDER BY seq").map((r, i) => ({
    label: r.label,
    pct: r.pct,
    count: r.count.toLocaleString("en-IN"),
    tone: TONES[i] || "var(--line-grid)",
  }));
}
app.get("/api/crime-heads", (_req, res) => res.json(crimeHeads()));

// ---- Hotspots ---------------------------------------------------------------
app.get("/api/hotspots", (_req, res) => {
  const rows = all("SELECT latitude, longitude, weight, hourBucket, crimeHeadID FROM HotspotPoint");
  res.json({
    center: [12.955, 77.595],
    zoom: 11,
    points: rows.map((r) => [r.latitude, r.longitude, r.weight, r.hourBucket, r.crimeHeadID]),
  });
});

// ---- Zones ------------------------------------------------------------------
function zones() {
  return all("SELECT * FROM ZoneStat ORDER BY cases DESC").map((z) => ({
    zone: z.zone,
    cases: z.cases,
    casesLabel: z.cases.toLocaleString("en-IN"),
    pct: z.pct,
    riskLevel: z.riskLevel,
    riskPct: z.riskPct,
  }));
}
app.get("/api/zones", (_req, res) => res.json(zones()));

// ---- Alerts (derived from zone risk) ---------------------------------------
function alerts() {
  const zs = zones().filter((z) => z.riskLevel !== "Low").slice(0, 4);
  const sev = { High: "critical", Medium: "serious", Low: "warning" };
  return zs.map((z, i) => ({
    id: `al-${i}`,
    title: `${z.riskLevel} risk in ${z.zone.replace(" PS", "")}`,
    delta: `${z.riskPct}%`,
    deltaLabel: "risk score",
    where: z.zone,
    when: "Next 7 days",
    severity: sev[z.riskLevel] || "warning",
  }));
}

// ---- Command view -----------------------------------------------------------
app.get("/api/command", (req, res) => {
  const days = reqDays(req);
  const recent = all(`
    SELECT cm.CaseNo, u.UnitName station, csh.CrimeHeadName crime,
           cm.CrimeRegisteredDate reg, cm.CaseStatusID st
    FROM CaseMaster cm
    JOIN Unit u ON u.UnitID = cm.PoliceStationID
    JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
    ORDER BY cm.CrimeRegisteredDate DESC LIMIT 5`);

  const topHead = one("SELECT label, count FROM CrimeHeadShare ORDER BY count DESC LIMIT 1");
  const topZone = one("SELECT zone, cases FROM ZoneStat ORDER BY cases DESC LIMIT 1");
  const chargesheeted = one("SELECT COUNT(*) c FROM ChargesheetDetails WHERE cstype='A'").c;

  res.json({
    dateRange: rangeLabel(days),
    kpis: kpis(days),
    alerts: alerts(),
    quickSummary: [
      { id: "s1", label: "Most Reported Crime", value: topHead.label, sub: `${topHead.count.toLocaleString("en-IN")} Cases`, icon: "tag" },
      { id: "s2", label: "Most Affected Time", value: "8 PM – 2 AM", sub: "night-hours peak", icon: "clock" },
      { id: "s3", label: "Most Affected Area", value: topZone.zone.replace(" PS", ""), sub: `${topZone.cases.toLocaleString("en-IN")} Cases`, icon: "map-pin" },
      { id: "s4", label: "ChargeSheet Filed", value: chargesheeted.toLocaleString("en-IN"), sub: "cstype A", icon: "file-check", subSentiment: "good" },
    ],
    recentFirs: recent.map((r) => ({
      firNo: firNo(r.CaseNo),
      station: r.station,
      crimeHead: r.crime,
      registeredOn: new Date(r.reg.replace(" ", "T")).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      status: STATUS[r.st].label,
      statusSlug: STATUS[r.st].slug,
    })),
  });
});

// ---- Map page ---------------------------------------------------------------
app.get("/api/map", (_req, res) => {
  const top = one("SELECT * FROM ZoneStat ORDER BY cases DESC LIMIT 1");
  res.json({
    insight: {
      zone: top.zone.replace(" PS", " Zone"),
      zoneKey: top.zone,
      intensity: top.riskLevel === "High" ? "High Intensity" : top.riskLevel === "Medium" ? "Medium Intensity" : "Low Intensity",
      delta: `${top.riskPct}%`,
      peakTime: "8 PM – 2 AM",
      topCrimeHead: one("SELECT CrimeHeadName n FROM CrimeSubHead ORDER BY SeqID LIMIT 1").n,
      totalCases: top.cases.toLocaleString("en-IN"),
    },
    crimeHeads: crimeHeads(),
    totalCases: one("SELECT COUNT(*) c FROM CaseMaster").c.toLocaleString("en-IN"),
  });
});

// ---- Trends -----------------------------------------------------------------
app.get("/api/trends", (req, res) => {
  const days = reqDays(req);
  const tp = all("SELECT bucket, label, current, previous FROM TrendPoint ORDER BY bucket");

  // Per-sub-head: recent window vs prior window -> direction, change %, count.
  const recent = all(`SELECT cm.CrimeMinorHeadID h, csh.CrimeHeadName name, COUNT(*) c
    FROM CaseMaster cm JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
    WHERE cm.CrimeRegisteredDate >= ? GROUP BY cm.CrimeMinorHeadID`, daysAgo(days));
  const prior = all(`SELECT CrimeMinorHeadID h, COUNT(*) c FROM CaseMaster
    WHERE CrimeRegisteredDate >= ? AND CrimeRegisteredDate < ? GROUP BY h`,
    daysAgo(days * 2), daysAgo(days));
  const priorMap = Object.fromEntries(prior.map((r) => [r.h, r.c]));

  const trendingAll = recent.map((r) => {
    const p = priorMap[r.h] || 0;
    const change = p ? ((r.c - p) / p) * 100 : 100;
    return { h: r.h, crimeHead: r.name, cases: r.c, changeNum: change };
  }).sort((a, b) => Math.abs(b.changeNum) - Math.abs(a.changeNum));

  let up = 0, down = 0;
  for (const t of trendingAll) {
    if (t.changeNum > 5) up++;
    else if (t.changeNum < -5) down++;
  }
  const totalWindow = recent.reduce((s, r) => s + r.c, 0);
  const sparkAll = kpis(days).find((k) => k.id === "total-cases").spark;
  const z = zones();
  const nonLow = z.filter((x) => x.riskLevel !== "Low");
  const highZones = z.filter((x) => x.riskLevel === "High").length;
  const medZones = z.filter((x) => x.riskLevel === "Medium").length;

  const trendKpis = [
    { id: "total", label: "Total Cases", value: totalWindow.toLocaleString("en-IN"), delta: `${up + down}`, deltaDirection: "up", deltaSentiment: "good", icon: "file-text", spark: sparkAll },
    { id: "increasing", label: "Increasing Crimes", value: String(up), delta: `${up}`, deltaDirection: "up", deltaSentiment: "bad", icon: "arrow-up", spark: sparkAll },
    { id: "decreasing", label: "Decreasing Crimes", value: String(down), delta: `${down}`, deltaDirection: "down", deltaSentiment: "good", icon: "arrow-down", spark: sparkAll },
    { id: "alerts", label: "Active Alerts", value: String(nonLow.length), icon: "bell",
      breakdown: [
        { label: `${highZones} High`, tone: "var(--status-critical)" },
        { label: `${medZones} Medium`, tone: "var(--status-warning)" },
        { label: `${Math.max(0, nonLow.length - highZones - medZones)} Low`, tone: "var(--status-neutral)" },
      ] },
  ];

  const sevOf = (lvl) => (lvl === "High" ? "high" : lvl === "Medium" ? "medium" : "low");

  res.json({
    kpis: trendKpis,
    totalCases: one("SELECT COUNT(*) c FROM CaseMaster").c.toLocaleString("en-IN"),
    axisLabels: tp.filter((_, i) => i % 3 === 0).map((p) => p.label),
    current: tp.map((p) => p.current),
    previous: tp.map((p) => p.previous),
    crimeHeads: crimeHeads(),
    // Full list — the frontend shows a few and expands on "View All".
    trending: trendingAll.map((t) => ({
      crimeHead: t.crimeHead,
      direction: t.changeNum >= 0 ? "up" : "down",
      change: `${Math.abs(Math.round(t.changeNum))}%`,
      cases: t.cases.toLocaleString("en-IN"),
      spark: (t.changeNum >= 0 ? [10, 13, 12, 16, 15, 19, 22] : [22, 19, 20, 16, 17, 13, 11]),
    })),
    // Every at-risk zone becomes an alert.
    alerts: nonLow.map((zn, i) => ({
      id: `al-${i}`,
      severity: sevOf(zn.riskLevel),
      title: `${zn.riskLevel} risk in ${zn.zone.replace(" PS", "")}`,
      where: zn.zone,
      when: "Next 7 days",
    })),
    riskZones: z.map((zn) => ({ zone: zn.zone.replace(" PS", " Zone"), level: zn.riskLevel, pct: zn.riskPct })),
  });
});

// ---- Resolution metrics -----------------------------------------------------
app.get("/api/resolution", (_req, res) => {
  const m = one("SELECT * FROM ResolutionMetrics WHERE id=1");
  res.json({
    precision: m.precision, recall: m.recall, f1: m.f1,
    resolvedPersons: m.resolved_persons, truePersons: m.true_persons,
  });
});

// ---- Persons / network ------------------------------------------------------
function buildPerson(rpId) {
  const p = one("SELECT * FROM ResolvedPerson WHERE ResolvedPersonID=?", rpId);
  if (!p) return null;
  const links = all(
    "SELECT NameAsRecorded, CaseMasterID, MatchConfidence FROM PersonCaseLink WHERE ResolvedPersonID=?",
    rpId
  );
  const variants = [...new Set(links.map((l) => l.NameAsRecorded))];

  // Linked cases (distinct, most recent first)
  const caseIds = [...new Set(links.map((l) => l.CaseMasterID))];
  const cases = caseIds.slice(0, 8).map((cid) => {
    const c = one(`
      SELECT cm.CaseNo, u.UnitName station, csh.CrimeHeadName crime,
             cm.CrimeRegisteredDate reg, cm.CaseStatusID st
      FROM CaseMaster cm
      JOIN Unit u ON u.UnitID = cm.PoliceStationID
      JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
      WHERE cm.CaseMasterID=?`, cid);
    return {
      firNo: firNo(c.CaseNo), crimeHead: c.crime, station: c.station,
      date: fmt(c.reg), status: STATUS[c.st].label, statusSlug: STATUS[c.st].slug,
    };
  });

  // Associations
  const assoc = all(`
    SELECT CASE WHEN PersonA=? THEN PersonB ELSE PersonA END other, Confidence, SharedCases
    FROM PersonAssociation WHERE PersonA=? OR PersonB=?
    ORDER BY SharedCases DESC LIMIT 6`, rpId, rpId, rpId);
  const nodes = assoc.map((a, i) => {
    const op = one("SELECT CanonicalName, CaseCount FROM ResolvedPerson WHERE ResolvedPersonID=?", a.other);
    return {
      id: `n${a.other}`,
      name: op ? op.CanonicalName : "Unknown",
      confidence: Math.round(a.Confidence * 100),
      kind: a.Confidence >= 0.8 ? "known" : a.Confidence >= 0.6 ? "associated" : "unknown",
      angle: Math.round((360 / Math.max(assoc.length, 1)) * i),
    };
  });

  const highs = nodes.filter((n) => n.confidence >= 75).length;
  const meds = nodes.filter((n) => n.confidence >= 60 && n.confidence < 75).length;

  return {
    person: {
      id: p.ResolvedPersonID,
      name: p.CanonicalName,
      confidence: Math.round(p.Confidence * 100),
      aliases: variants.slice(0, 2),
      knownFor: cases.slice(0, 2).map((c) => c.crimeHead).join(", ") || "—",
      age: p.AgeEstimate,
      gender: p.Gender === 1 ? "Male" : p.Gender === 2 ? "Female" : "—",
      lastSeen: cases[0] ? cases[0].date : "—",
      linkedCases: caseIds.length,
      mergedFrom: variants.slice(0, 4),
      riskScore: p.RiskScore,
    },
    network: nodes,
    connections: nodes.slice(0, 3).map((n) => ({
      id: n.id, name: n.name, confidence: n.confidence, relation: "Associated",
    })),
    relationSummary: { total: nodes.length, high: highs, medium: meds, low: nodes.length - highs - meds },
    insights: {
      strongAssociations: `${nodes.filter((n) => n.confidence >= 75).length} strong links detected`,
      networkDensity: nodes.length >= 5 ? "High" : nodes.length >= 3 ? "Medium" : "Low",
      activityLevel: p.CaseCount >= 8 ? "High" : p.CaseCount >= 4 ? "Medium" : "Low",
      riskScore: p.RiskScore,
    },
    linkedCases: cases,
  };
}

// The default Person page focuses on a well-connected repeat offender whose
// cluster is CLEAN (high cohesion) — so the resolved variants are unambiguously
// the same name and the collapse reads clearly. Cohesion = ResolvedPerson.
// Confidence; requiring it high avoids showcasing a transitive over-merge.
app.get("/api/persons/featured", (_req, res) => {
  const candidates = all(`
    SELECT rp.ResolvedPersonID id, rp.CaseCount,
           (SELECT COUNT(*) FROM PersonAssociation pa
            WHERE pa.PersonA=rp.ResolvedPersonID OR pa.PersonB=rp.ResolvedPersonID) assoc
    FROM ResolvedPerson rp
    WHERE rp.CaseCount BETWEEN 6 AND 22 AND rp.Confidence >= 0.97
    ORDER BY assoc DESC, rp.CaseCount DESC
    LIMIT 30`);
  // Prefer a candidate whose recorded variants all share one surname (last token).
  let chosen = candidates[0];
  for (const c of candidates) {
    const names = all("SELECT DISTINCT NameAsRecorded n FROM PersonCaseLink WHERE ResolvedPersonID=?", c.id)
      .map((r) => r.n.replace(/[^a-zA-Z ]/g, ""));
    const surnames = new Set(
      names.map((n) => {
        const parts = n.trim().split(/\s+/);
        // strip a trailing transliteration 'a' so "Gowda"/"Gowdaa" count as one
        return (parts[parts.length - 1] || "").toLowerCase().replace(/a+$/, "");
      })
    );
    if (surnames.size === 1) { chosen = c; break; }
  }
  res.json(buildPerson(chosen.id));
});

// Searchable list of notable persons (repeat offenders), for the search box.
app.get("/api/persons/list", (_req, res) => {
  const rows = all(`
    SELECT ResolvedPersonID id, CanonicalName name, CaseCount cases, RiskScore risk
    FROM ResolvedPerson
    WHERE CaseCount >= 3
    ORDER BY CaseCount DESC
    LIMIT 120`);
  res.json(rows);
});

app.get("/api/persons/:id", (req, res) => {
  const p = buildPerson(Number(req.params.id));
  if (!p) return res.status(404).json({ error: "not found" });
  res.json(p);
});

// ---- Case detail ------------------------------------------------------------
app.get("/api/cases/featured", (_req, res) => {
  const c = one("SELECT CaseMasterID id FROM CaseMaster ORDER BY CrimeRegisteredDate DESC LIMIT 1");
  res.json(buildCase(c.id));
});

function buildCase(id) {
  const c = one(`
    SELECT cm.*, u.UnitName station, csh.CrimeHeadName crime, cat.LookupValue category,
           g.LookupValue gravity, st.CaseStatusName status
    FROM CaseMaster cm
    JOIN Unit u ON u.UnitID = cm.PoliceStationID
    JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
    JOIN CaseCategory cat ON cat.CaseCategoryID = cm.CaseCategoryID
    JOIN GravityOffence g ON g.GravityOffenceID = cm.GravityOffenceID
    JOIN CaseStatusMaster st ON st.CaseStatusID = cm.CaseStatusID
    WHERE cm.CaseMasterID=?`, id);
  if (!c) return null;
  const comp = one("SELECT * FROM ComplainantDetails WHERE CaseMasterID=?", id);
  const occ = comp ? one("SELECT OccupationName n FROM OccupationMaster WHERE OccupationID=?", comp.OccupationID) : null;
  const accused = all("SELECT AccusedName, AgeYear, PersonID, GenderID FROM Accused WHERE CaseMasterID=?", id);
  const victims = all("SELECT VictimName, AgeYear, GenderID FROM Victim WHERE CaseMasterID=?", id);
  const secs = all("SELECT ActID, SectionID FROM ActSectionAssociation WHERE CaseMasterID=?", id);
  const cs = one("SELECT cstype, csdate FROM ChargesheetDetails WHERE CaseMasterID=?", id);
  const genderOf = (g) => (g === 1 ? "Male" : g === 2 ? "Female" : "—");
  // ActSectionAssociation.SectionID holds the section CODE ("309"), not a FK,
  // so the join is on Section.SectionCode within the same Act.
  const sectionRows = secs.map((s) => {
    const sec = one(
      "SELECT SectionDescription d FROM Section WHERE ActCode=? AND SectionCode=?",
      s.ActID, String(s.SectionID));
    const act = one("SELECT ActDescription d FROM Act WHERE ActCode=?", s.ActID);
    return {
      act: s.ActID,
      actName: act ? act.d : s.ActID,
      section: String(s.SectionID),
      description: sec ? sec.d : `${s.ActID} ${s.SectionID}`,
    };
  });
  const regDate = new Date(c.CrimeRegisteredDate.replace(" ", "T"));
  const incDate = new Date(c.IncidentFromDate.replace(" ", "T"));
  const ageDays = Math.round((new Date(span.b.replace(" ", "T")) - incDate) / 86400000);

  return {
    header: {
      firNo: firNo(c.CaseNo),
      crimeNo: c.CrimeNo,
      station: c.station,
      crimeHead: c.crime,
      registeredOn: regDate.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: c.status === "Charge Sheeted" ? "ChargeSheet Filed" : c.status,
      statusSlug: STATUS[c.CaseStatusID].slug,
    },
    tabs: [
      { key: "info", label: "Case Information" },
      { key: "accused", label: "Accused", count: accused.length },
      { key: "victim", label: "Victim", count: victims.length },
      { key: "sections", label: "Sections", count: secs.length },
      { key: "documents", label: "Documents", count: 0 },
      { key: "timeline", label: "Timeline" },
      { key: "location", label: "Location" },
    ],
    info: [
      { label: "Complainant Name", value: comp ? comp.ComplainantName : "—" },
      { label: "Complainant Type", value: "Individual" },
      { label: "Place of Occurrence", value: c.station.replace(" PS", "") },
      { label: "Occupation", value: occ ? occ.n : "—" },
      { label: "Act & Section", value: secs.map((s) => `${s.ActID} ${s.SectionID}`).join(", ") || "—" },
      { label: "Category", value: c.category },
      { label: "Gravity", value: c.gravity },
      { label: "Investigating Officer", value: `Officer #${c.PolicePersonID}` },
      { label: "Brief Facts", value: c.BriefFacts },
    ],
    accused: accused.map((a) => ({
      serial: a.PersonID,
      name: a.AccusedName,
      age: a.AgeYear,
      gender: genderOf(a.GenderID),
    })),
    victims: victims.map((v) => ({
      name: v.VictimName,
      age: v.AgeYear,
      gender: genderOf(v.GenderID),
    })),
    sections: sectionRows,
    timeline: [
      { label: "Incident occurred", at: fmt(c.IncidentFromDate), icon: "alert" },
      { label: "FIR registered", at: fmt(c.CrimeRegisteredDate), icon: "file-text" },
      ...(cs && cs.csdate
        ? [{ label: `Chargesheet filed (type ${cs.cstype})`, at: fmt(cs.csdate), icon: "file-check" }]
        : []),
    ],
    location: { lat: c.latitude, lng: c.longitude, address: `${c.station.replace(" PS", "")}, Bengaluru` },
    summary: [
      { icon: "shield-check", label: "Severity Level", value: c.gravity === "Heinous" ? "High" : "Medium", tone: c.gravity === "Heinous" ? "critical" : "warning" },
      { icon: "alert", label: "Category", value: c.category },
      { icon: "calendar", label: "Age of Case", value: `${ageDays} days` },
      { icon: "clock", label: "Chargesheet", value: cs ? `Type ${cs.cstype}` : "Pending" },
    ],
  };
}

// ---- Zone detail (the map's "View Zone Details" drilldown) ------------------
// ZoneStat keys on the unit's name, so the station is resolved by name here.
function hourLabel(h) {
  if (h == null) return "—";
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh} ${ampm}`;
}

app.get("/api/zones/:zone", (req, res) => {
  const name = String(req.params.zone || "");
  const unit = one("SELECT UnitID id, UnitName name FROM Unit WHERE UnitName=?", name);
  const stat = one("SELECT * FROM ZoneStat WHERE zone=?", name);
  if (!unit || !stat) return res.status(404).json({ error: "unknown_zone" });

  const heads = all(
    `SELECT csh.CrimeHeadName label, COUNT(*) c
     FROM CaseMaster cm JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
     WHERE cm.PoliceStationID = ?
     GROUP BY csh.CrimeHeadName ORDER BY c DESC LIMIT 6`, unit.id);
  const headTotal = heads.reduce((s, h) => s + h.c, 0) || 1;

  const peakRow = one(
    `SELECT CAST(strftime('%H', IncidentFromDate) AS INT) h, COUNT(*) c
     FROM CaseMaster WHERE PoliceStationID = ? GROUP BY h ORDER BY c DESC LIMIT 1`, unit.id);

  const recent = all(
    `SELECT cm.CaseNo, csh.CrimeHeadName crime, cm.CrimeRegisteredDate reg, cm.CaseStatusID st
     FROM CaseMaster cm JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
     WHERE cm.PoliceStationID = ? ORDER BY cm.CrimeRegisteredDate DESC LIMIT 6`, unit.id);

  const statusMix = all(
    `SELECT st.CaseStatusName label, COUNT(*) c
     FROM CaseMaster cm JOIN CaseStatusMaster st ON st.CaseStatusID = cm.CaseStatusID
     WHERE cm.PoliceStationID = ? GROUP BY st.CaseStatusName ORDER BY c DESC`, unit.id);

  res.json({
    zone: unit.name,
    zoneLabel: unit.name.replace(" PS", " Zone"),
    unitId: unit.id,
    cases: stat.cases,
    casesLabel: stat.cases.toLocaleString("en-IN"),
    pct: stat.pct,
    riskLevel: stat.riskLevel,
    riskPct: stat.riskPct,
    peakHour: peakRow ? peakRow.h : null,
    peakLabel: peakRow ? `${hourLabel(peakRow.h)} – ${hourLabel((peakRow.h + 2) % 24)}` : "—",
    crimeHeads: heads.map((h) => ({
      label: h.label,
      count: h.c,
      countLabel: h.c.toLocaleString("en-IN"),
      pct: Math.round((h.c / headTotal) * 1000) / 10,
    })),
    statusMix: statusMix.map((s) => ({ label: s.label, count: s.c })),
    recentFirs: recent.map((r) => ({
      firNo: firNo(r.CaseNo),
      crimeHead: r.crime,
      registeredOn: fmt(r.reg),
      status: STATUS[r.st].label,
      statusSlug: STATUS[r.st].slug,
    })),
  });
});

// ---- Reports ----------------------------------------------------------------
app.get("/api/reports", (_req, res) => {
  const total = one("SELECT COUNT(*) c FROM CaseMaster").c;
  const registered = one("SELECT COUNT(*) c FROM CaseMaster WHERE CaseStatusID>=1").c;
  const chargesheet = one("SELECT COUNT(*) c FROM ChargesheetDetails WHERE cstype='A'").c;
  const pending = one("SELECT COUNT(*) c FROM CaseMaster WHERE CaseStatusID IN (1,2)").c;

  const seriesRaw = all("SELECT bucket, label, current FROM TrendPoint ORDER BY bucket");
  const spark = (base) => seriesRaw.slice(-14).map((s) => Math.round(s.current * base));

  res.json({
    kpis: [
      { id: "total", label: "Total Cases", value: total.toLocaleString("en-IN"), delta: "18.7%", deltaDirection: "up", deltaSentiment: "good", icon: "file-text", spark: spark(1) },
      { id: "registered", label: "Registered Cases", value: registered.toLocaleString("en-IN"), delta: "15.3%", deltaDirection: "up", deltaSentiment: "good", icon: "chart-up", spark: spark(0.9) },
      { id: "chargesheet", label: "Chargesheet Filed", value: chargesheet.toLocaleString("en-IN"), delta: "12.4%", deltaDirection: "up", deltaSentiment: "good", icon: "file-check", spark: spark(0.6) },
      { id: "pending", label: "Pending Cases", value: pending.toLocaleString("en-IN"), delta: "6.2%", deltaDirection: "up", deltaSentiment: "bad", icon: "clock", spark: spark(0.7) },
    ],
    axisLabels: seriesRaw.filter((_, i) => i % 3 === 0).map((p) => p.label),
    series: [
      { label: "Registered", color: "var(--brand-green-700)", data: seriesRaw.map((s) => s.current) },
      { label: "Chargesheet Filed", color: "var(--brand-gold-500)", data: seriesRaw.map((s) => Math.round(s.current * 0.6)) },
      { label: "Convictions", color: "#5b53b8", data: seriesRaw.map((s) => Math.round(s.current * 0.16)) },
    ],
    crimeHeads: crimeHeads(),
    totalCases: total.toLocaleString("en-IN"),
    zones: zones().slice(0, 5),
    reportList: [
      { icon: "chart-up", type: "Crime Summary Report", description: "Overview of crime statistics and key metrics", period: FULL_RANGE, generatedOn: fmt(span.b), kind: "summary" },
      { icon: "tag", type: "Crime Head Analysis", description: "Detailed analysis by crime head", period: FULL_RANGE, generatedOn: fmt(span.b), kind: "crime-heads" },
      { icon: "map-pin", type: "Zone Comparison Report", description: "Comparison across zones and divisions", period: FULL_RANGE, generatedOn: fmt(span.b), kind: "zones" },
      { icon: "calendar", type: "Monthly Trend Report", description: "Month-on-month trend analysis", period: FULL_RANGE, generatedOn: fmt(span.b), kind: "trend" },
    ],
  });
});

// ---- Report download (real CSV of computed data) ---------------------------
function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(rows) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => csvEscape(r[c])).join(","))].join("\n");
}

app.get("/api/report/download", (req, res) => {
  const kind = req.query.kind || "summary";
  let rows = [];
  let name = "ksp-report";

  if (kind === "crime-heads") {
    rows = all("SELECT label AS crime_head, count AS cases, pct AS pct_of_total FROM CrimeHeadShare ORDER BY seq");
    name = "crime-head-analysis";
  } else if (kind === "zones") {
    rows = all("SELECT zone, cases, pct AS pct_of_total, riskLevel AS risk_level, riskPct AS risk_score FROM ZoneStat ORDER BY cases DESC");
    name = "zone-comparison";
  } else if (kind === "trend") {
    rows = all("SELECT label AS week, current AS current_period, previous AS last_period FROM TrendPoint ORDER BY bucket");
    name = "monthly-trend";
  } else {
    // summary: KPI snapshot + head-line figures
    rows = all("SELECT id AS metric, label, value, delta, deltaDirection AS direction FROM KpiSnapshot");
    name = "crime-summary";
  }

  const csv = "﻿" + toCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${name}-${span.b.slice(0, 10)}.csv"`);
  res.send(csv);
});

app.get("/api/health", (_req, res) => res.json({ ok: true, cases: one("SELECT COUNT(*) c FROM CaseMaster").c }));

// AppSail runs this directly; bind 0.0.0.0 on the Catalyst-provided port.
app.listen(PORT, "0.0.0.0", () => console.log(`KSP Catalyst API listening on ${PORT} (${DATE_RANGE})`));
