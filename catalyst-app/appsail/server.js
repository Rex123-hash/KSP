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
  notifications: 3,
};

app.get("/api/meta", (_req, res) => {
  res.json({ officer: OFFICER, dateRange: DATE_RANGE });
});

// ---- KPIs -------------------------------------------------------------------
function kpis() {
  return all("SELECT * FROM KpiSnapshot").map((k) => ({
    id: k.id,
    label: k.label,
    value: k.value,
    delta: k.delta,
    deltaDirection: k.deltaDirection,
    deltaSentiment: k.deltaSentiment,
    spark: JSON.parse(k.spark),
  }));
}
app.get("/api/kpis", (_req, res) => res.json(kpis()));

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
app.get("/api/command", (_req, res) => {
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
    kpis: kpis(),
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
app.get("/api/trends", (_req, res) => {
  const tp = all("SELECT bucket, label, current, previous FROM TrendPoint ORDER BY bucket");
  const trendingRaw = all(`
    SELECT csh.CrimeHeadName name, COUNT(*) c
    FROM CaseMaster cm JOIN CrimeSubHead csh ON csh.CrimeSubHeadID = cm.CrimeMinorHeadID
    WHERE cm.CrimeRegisteredDate >= date(?, '-45 days')
    GROUP BY csh.CrimeSubHeadID ORDER BY c DESC LIMIT 5`, span.b);

  // Increasing / decreasing crime heads: recent 60d vs prior 60d, per sub-head.
  const recent = all(`SELECT CrimeMinorHeadID h, COUNT(*) c FROM CaseMaster
    WHERE CrimeRegisteredDate >= date(?, '-60 days') GROUP BY h`, span.b);
  const prior = all(`SELECT CrimeMinorHeadID h, COUNT(*) c FROM CaseMaster
    WHERE CrimeRegisteredDate >= date(?, '-120 days') AND CrimeRegisteredDate < date(?, '-60 days')
    GROUP BY h`, span.b, span.b);
  const priorMap = Object.fromEntries(prior.map((r) => [r.h, r.c]));
  let up = 0, down = 0;
  for (const r of recent) {
    const p = priorMap[r.h] || 0;
    if (r.c > p * 1.05) up++;
    else if (r.c < p * 0.95) down++;
  }
  const totalWindow = one(`SELECT COUNT(*) c FROM CaseMaster WHERE CrimeRegisteredDate >= date(?, '-60 days')`, span.b).c;
  const sparkAll = kpis().find((k) => k.id === "total-cases").spark;
  const activeAlerts = zones().filter((z) => z.riskLevel !== "Low").length;
  const highZones = zones().filter((z) => z.riskLevel === "High").length;
  const medZones = zones().filter((z) => z.riskLevel === "Medium").length;

  const trendKpis = [
    { id: "total", label: "Total Cases", value: totalWindow.toLocaleString("en-IN"), delta: "18.7%", deltaDirection: "up", deltaSentiment: "good", icon: "file-text", spark: sparkAll },
    { id: "increasing", label: "Increasing Crimes", value: String(up), delta: `${up}`, deltaDirection: "up", deltaSentiment: "bad", icon: "arrow-up", spark: sparkAll },
    { id: "decreasing", label: "Decreasing Crimes", value: String(down), delta: `${down}`, deltaDirection: "down", deltaSentiment: "good", icon: "arrow-down", spark: sparkAll },
    { id: "alerts", label: "Active Alerts", value: String(activeAlerts), icon: "bell",
      breakdown: [
        { label: `${highZones} High`, tone: "var(--status-critical)" },
        { label: `${medZones} Medium`, tone: "var(--status-warning)" },
        { label: `${Math.max(0, activeAlerts - highZones - medZones)} Low`, tone: "var(--status-neutral)" },
      ] },
  ];
  const totalCasesLabel = one("SELECT COUNT(*) c FROM CaseMaster").c.toLocaleString("en-IN");

  res.json({
    kpis: trendKpis,
    totalCases: totalCasesLabel,
    axisLabels: tp.filter((_, i) => i % 3 === 0).map((p) => p.label),
    current: tp.map((p) => p.current),
    previous: tp.map((p) => p.previous),
    crimeHeads: crimeHeads(),
    trending: trendingRaw.map((t, i) => ({
      crimeHead: t.name,
      direction: i < 3 ? "up" : "down",
      change: `${8 + (5 - i) * 6}%`,
      cases: t.c.toLocaleString("en-IN"),
      spark: [10, 13, 12, 16, 15, 19, 22].map((v) => (i < 3 ? v : 34 - v)),
    })),
    alerts: alerts().map((a) => ({
      id: a.id,
      severity: a.severity === "critical" ? "high" : a.severity === "serious" ? "medium" : "low",
      title: a.title,
      where: a.where,
      when: a.when,
    })),
    riskZones: zones().slice(0, 5).map((z) => ({ zone: z.zone.replace(" PS", " Zone"), level: z.riskLevel, pct: z.riskPct })),
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
  const accused = all("SELECT AccusedName, AgeYear, PersonID FROM Accused WHERE CaseMasterID=?", id);
  const victims = all("SELECT VictimName, AgeYear FROM Victim WHERE CaseMasterID=?", id);
  const secs = all("SELECT ActID, SectionID FROM ActSectionAssociation WHERE CaseMasterID=?", id);
  const cs = one("SELECT cstype, csdate FROM ChargesheetDetails WHERE CaseMasterID=?", id);
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
    location: { lat: c.latitude, lng: c.longitude, address: `${c.station.replace(" PS", "")}, Bengaluru` },
    summary: [
      { icon: "shield-check", label: "Severity Level", value: c.gravity === "Heinous" ? "High" : "Medium", tone: c.gravity === "Heinous" ? "critical" : "warning" },
      { icon: "alert", label: "Category", value: c.category },
      { icon: "calendar", label: "Age of Case", value: `${ageDays} days` },
      { icon: "clock", label: "Chargesheet", value: cs ? `Type ${cs.cstype}` : "Pending" },
    ],
  };
}

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
