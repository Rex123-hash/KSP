<p align="center">
  <img src="docs/assets/banner.svg" alt="KSP Crime Intelligence Platform" width="100%">
</p>

<p align="center">
  <a href="https://ksp-crime-intelligence-60078249847.development.catalystserverless.in/app/index.html"><img src="https://img.shields.io/badge/Live%20Demo-0b4229?style=for-the-badge&labelColor=06291a" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Deployed%20on-Zoho%20Catalyst-c9a227?style=for-the-badge&labelColor=06291a" alt="Zoho Catalyst">
  <img src="https://img.shields.io/badge/Tests-23%20passing-1f7a54?style=for-the-badge&labelColor=06291a" alt="23 tests passing">
  <img src="https://img.shields.io/badge/Entity%20Resolution%20F1-0.943-1f7a54?style=for-the-badge&labelColor=06291a" alt="F1 0.943">
</p>

---

## <img src="docs/assets/icons/overview.svg" width="22" align="center"> What this is

A crime intelligence platform for the **Karnataka State Police State Crime Records Bureau**, built for **Datathon 2026 · Challenge 02**.

It replaces siloed Excel reporting with a system that answers the three questions a police bureau actually asks: *where is crime concentrated and when*, *who is connected to whom*, and *who did what to this case file*.

**Live:** https://ksp-crime-intelligence-60078249847.development.catalystserverless.in/app/index.html

| Sign in as | Email | Commands | On the featured case |
|---|---|---|---|
| Sub-Inspector, Indiranagar PS | `amaan.k2405@gmail.com` | 1 station | **allowed** |
| ASP, Bengaluru South Division | `amaank2405@gmail.com` | 7 units | **refused** |
| DGP, SCRB | `a.maank2405@gmail.com` | all 44 units | **allowed** |

Password for all three: `Ksp@Datathon2026`

> The middle row is the point. An ASP **outranks** a Sub-Inspector and is still refused, because authority follows position in the command tree, not rank. See [Role-based access](#-role-based-access-is-real).

### Contents

- [The problem](#-the-problem)
- [What it does](#-what-it-does) — the full feature catalogue
  - [Spatiotemporal hotspots](#1-spatiotemporal-hotspots)
  - [Zone drilldown](#2-zone-drilldown)
  - [Criminal network analysis](#3-criminal-network--relationship-analysis)
  - [Trends, alerts & risk scoring](#4-trends-alerts--risk-scoring)
  - [Case file with real writes](#5-case-file-with-real-writes)
  - [Audit trail](#6-audit-trail)
  - [Reports & export](#7-reports--export)
- [Role-based access is real](#-role-based-access-is-real)
- [Architecture](#-architecture)
- [The data & entity resolution](#-the-data)
- [Stack](#-stack) · [Run locally](#-run-it-locally) · [Tests](#-tests) · [Demo](#-demo)
- [What we did **not** build](#-what-we-did-not-build)

---

## <img src="docs/assets/icons/problem.svg" width="22" align="center"> The problem

The challenge brief describes an analytical ecosystem with four failures. Each maps to something concrete here:

| Stated problem | What we built |
|---|---|
| Data silos, Excel-based reporting | One integrated store; every view is a live query |
| No AI-driven analysis of behaviour or networks | Entity resolution + co-accused network graph (F1 **0.943**) |
| SCRB receives fragmented information | State → city → division → station drilldown from one tree |
| Policing is reactive, not proactive | Spatiotemporal hotspots with peak-hour windows and risk scoring |

---

## <img src="docs/assets/icons/features.svg" width="22" align="center"> What it does

Seven surfaces, mapped to the challenge's framework. Each one is described by what an
officer actually *does* with it and what the data underneath is doing — not a bullet list.

### 1. Spatiotemporal hotspots

*Framework items 1 & 4 — advanced visualisation, pattern & trend discovery.*

A live heat surface over all **5,200 FIRs**, rendered with Leaflet on a muted CARTO
basemap so the crime signal — not the map furniture — carries the colour.

- **24-hour time scrubber.** Every incident carries an hour bucket. Drag the slider, or hit
  **Play**, and the heat re-renders for a ±1-hour window around the selected hour. The
  clusters visibly migrate across the city as the day advances: property crime concentrates
  in commercial belts by afternoon, the night window shifts it elsewhere. A static map
  averages that away, and averaging is exactly what loses the deployment decision.
- **Crime-head filter.** Restrict the surface to a single crime family (Property, Body,
  Women, Economic, Other IPC/BNS) to see where *that* offence type concentrates.
- **Two view modes.** *Heatmap* is a continuous density gradient; *Clusters* bins the same
  points into counted bubbles sized by share of the busiest cell, each showing a case count
  on hover — a gradient tells you *where* it's hot, a count tells you *how many* officers you
  need. **Zone** granularity yields ~690 clusters statewide; **District** collapses that to 58.
- **The heat ramp is a deliberate exception.** It uses the entrenched green→red convention
  that police users read natively — the only multi-hue ramp in the product; everything else
  follows a single-hue sequential scale.

### 2. Zone drilldown

*Framework item 1 — district-level drilldown & spatiotemporal clusters.*

The heatmap raises a question it can't answer alone: *within this station, what is actually
happening?* **View Zone Details** answers it, server-computed per station:

- **Crime-head split** — the top offence types and their share of the zone.
- **Peak window** — derived from the actual distribution of incident hours, not a guess
  (e.g. *9 PM – 11 PM*).
- **Investigation status mix** — how many cases are under investigation, chargesheeted,
  closed, or freshly registered.
- **Recent FIRs** — the latest filings with live status pills.

*"Theft, 40% of this zone, peaking 9–11 PM"* is not a statistic. It's a patrol roster.

### 3. Criminal network & relationship analysis

*Framework item 2 — criminal network analysis, repeat-offender tracking.*

The single hardest requirement, because **the schema has no person identity** — every accused
row is bound to one case, so the same individual recurs as a fresh record in every FIR, under
transliteration variants of their name (`Ravi Kumar` / `RaviKumar` / `Ravi Kumara`).

- **Identity is reconstructed** across cases by the entity-resolution engine
  ([details below](#entity-resolution)), scored against ground truth at **F1 0.943**.
- **A person profile** shows the collapsed name variants, linked cases, estimated age, a risk
  score, and the associates that emerged from shared cases.
- **The network graph** is node-based: the resolved person at the centre, their co-accused
  associates around them, each edge weighted by shared-case confidence. **2,366** associations
  were inferred across the corpus.
- **Repeat-offender tracking** falls straight out of resolution — an individual linked to
  multiple incidents across jurisdictions is exactly what the clustering surfaces.

### 4. Trends, alerts & risk scoring

*Framework items 3 & 8 — trend analytics, crime forecasting & early warning.*

- **Trend analytics** compare a recent window against the prior one per crime sub-head, and
  count which offence types are rising versus falling — not just a single total line.
- **Risk-scored zones.** Each zone carries a risk level and percentage; the ones above
  threshold surface as active alerts, and the top bar's live notification badge reflects that
  count (it is **not** a hardcoded number — remove a zone from the threshold and the badge drops).
- **Offender risk scoring** ranks repeat offenders by case count weighted by involvement in
  heinous offences, so investigation effort can be prioritised.

### 5. Case file with real writes

*Framework items 6 & 10 — investigator decision support, governance.*

The Case / FIR Details screen is a working case file, not a read-only view. Tabs cover Case
Information, Accused, Victims, Acts & Sections, Timeline and Location — all populated from the
record. On top of that, three **persisted** actions:

- **Add note** — an investigation note, saved to Catalyst Data Store, appearing in the case
  timeline with author, unit and timestamp.
- **Update status** — a status transition with a recorded reason.
- **Close case** — a move to *Closed*, recorded.

Reads stay authoritative from the original FIR record; writes are layered **over** it, so the
underlying case data is never mutated — the same principle as an append-only case diary. Each
action also writes to the audit trail, and each is gated by the command-scope check below.

### 6. Audit trail

*Framework item 10 — audit logs and traceability.*

Every write **and every refused attempt**, listed with officer, unit, action, target,
timestamp and outcome. Refusals are the point: a successful action looks identical whether or
not the access check ran, but a recorded *denial* is positive proof it ran. This is the
difference between claiming compliance and demonstrating it.

### 7. Reports & export

*Framework item 1 — intelligence reporting.*

Crime-summary, crime-head, zone-comparison and monthly-trend reports, each downloadable as a
real CSV generated from the computed figures (not a static file) with a UTF-8 BOM so it opens
cleanly in Excel — the tool this platform is meant to replace.

---

## <img src="docs/assets/icons/security.svg" width="22" align="center"> Role-based access is real

The brief asks for *"role-based access for investigators, analysts, supervisors and policymakers… with audit logs and traceability."* Most submissions will show a role dropdown. This derives authority from the data model itself.

`Unit.ParentUnit` is a self-referencing hierarchy — it **is** the police command tree. A signed-in officer resolves to a unit, and their authority is the subtree beneath it:

```
Karnataka State Police            ← DGP / SCRB sees all 44 units
└── Bengaluru City Police
    ├── Bengaluru South Division  ← ASP sees this subtree
    │   ├── Jayanagar PS
    │   └── JP Nagar PS …
    └── Bengaluru East Division
        └── Indiranagar PS        ← SI sees one station
```

Every mutating request follows one path, server-side:

```
session → AppUser row → case's station (bundled map) → subtree test → write → audit
```

Three properties make this more than decoration:

1. **The client never asserts identity.** Unit and rank are read from the Catalyst session on every request. A crafted request body cannot widen scope.
2. **The station is never taken from the request.** It comes from a `CaseMasterID → PoliceStationID` map bundled with the function, so naming an arbitrary case id cannot escape your own command.
3. **Refusals are recorded.** A denied action writes an `AuditLog` row with `Outcome='deny'`. A successful action proves nothing about access control; a recorded refusal proves the check ran.

And it **fails safe**. If the session can't be resolved, or the officer isn't mapped to a unit, scope resolves to the *empty* set — no authority — rather than defaulting to anything. Access widens only on positive evidence of posting, never on its absence.

<sub>Enforcement is asserted by tests, not just claimed — see `catalyst-app/functions/kspwrite/scope.test.js`, including *"command position, not rank, decides access to the featured case"* and *"an unknown unit resolves to empty scope, never to global scope"*.</sub>

---

## <img src="docs/assets/icons/architecture.svg" width="22" align="center"> Architecture

```
Browser  (catalystserverless.in/app/)
   │
   ├── GET reads ─────────────► AppSail  "kspapi"      SQLite via sql.js (WASM)
   │                                                    analytics, hotspots, cases
   │
   └── writes + session ──────► Function "kspwrite"     SAME ORIGIN
                                   ├── Catalyst Authentication   identity
                                   ├── Catalyst Data Store       notes, status, audit
                                   └── org.json / case-station.json   scope, never client input
```

**Why writes live in a Function rather than in AppSail.** The SPA is served from `catalystserverless.in`; the read API from `catalystappsail.in`. Catalyst's session cookie is scoped to the Web Client Hosting domain and is **never sent cross-site** to AppSail. Any design that POSTs from the browser straight to the read API arrives anonymous, and `catalyst.initialize(req)` cannot resolve a user. Advanced I/O Functions are served at `/server/<name>` on the *same* origin, so the cookie flows and identity resolves with no token juggling.

This also means the read path never changed while writes were added.

### Catalyst services

Per the mandated capability → service table:

| Capability | Service | Used for |
|---|---|---|
| Frontend / SPA | **Web Client Hosting** | React app under `/app/` |
| Web app in a managed runtime | **AppSail** | Read API over the case database |
| Serverless backend logic | **Serverless Functions** (Advanced I/O) | Authenticated write layer |
| Relational database | **Data Store** (ZCQL) | Notes, status changes, profiles, audit |
| User auth / login | **Authentication** (Embedded) | Officer sign-in; we never handle a password |
| Object storage | **Stratus** | Bulk seed staging |

---

## <img src="docs/assets/icons/data.svg" width="22" align="center"> The data

No real crime data exists for this challenge — only a schema. So the generator is a first-class component, not a fixture.

| | |
|---|---|
| FIRs | **5,200** across 37 stations, Jun 2025 – Jul 2026 |
| Accused / victims | 7,230 / 7,819 |
| Command units | 44 (1 state, 1 city, 5 divisions, 18 stations, 19 district units) |
| Officers | 120 |
| Tables | 36, schema-conformant to the published ER diagram |

Two properties matter more than volume:

**It is reproducible.** Two builds under different `PYTHONHASHSEED` values produce byte-identical data. This was not free — `transliteration_variants()` returned an unsorted `set`, and because CPython salts string hashing per process, `rng.choice()` recorded different name spellings on every run despite a fixed seed. Three consecutive builds produced 1,581 / 1,590 / 1,614 resolved persons before the fix. Now pinned, and asserted by `pipeline/test_determinism.py`.

**FIR numbers behave like real ones.** `CaseNo` is unique per station per year — two stations both hold an FIR 1/2026, exactly as in the real register — and `CrimeNo` embeds the same serial so a case's two numbers can never contradict each other.

### Entity resolution

The hardest requirement, because the schema gives no person key. Names recur as transliteration variants (`Ravi Kumar` / `RaviKumar` / `Ravi Kumara`). The pipeline reconstructs identity in four stages, all in pure Python:

1. **Blocking.** Candidates are grouped by gender plus the first two characters of a normalised name key. Variants preserve leading characters, so true matches share a block while blocks stay small — this keeps the comparison count tractable without a database.
2. **Similarity.** For each pair in a block, Jaro-Winkler is computed both forward and on the reversed strings, and the **minimum** is taken. Plain Jaro-Winkler over-weights a shared prefix and would merge *Venkatesh Nayak* with *Venkatesh Achar*; taking the min forces the **surname** to agree too. Implemented locally — no fuzzy-match dependency.
3. **Clustering.** Pairs above threshold, and within an age tolerance, are unioned with union-find. Cluster cohesion (mean intra-cluster similarity) becomes the person's confidence score.
4. **Association & risk.** Co-accused in the same case become weighted graph edges; risk is repeat-count weighted by heinous involvement.

**It is measured, not asserted.** The generator emits ground-truth identities, and resolution is scored pairwise against them:

| Precision | Recall | F1 | Resolved | True persons | Pairs evaluated |
|---|---|---|---|---|---|
| **0.934** | **0.953** | **0.943** | 1,634 | 1,393 | 37,673 |

An entity-resolution system that can't be measured shouldn't be trusted with an investigation. This one reports its own error rate, in-product on the Person page.

---

## <img src="docs/assets/icons/stack.svg" width="22" align="center"> Stack

**Frontend** React 19 · TypeScript · Vite · Leaflet + leaflet.heat · hand-built SVG charts (no chart library)
**Backend** Node 20 · Express · `sql.js` (WASM SQLite) · `zcatalyst-sdk-node`
**Pipeline** Python 3, standard library only — Jaro-Winkler and union-find implemented locally

~9,600 lines across app, API and pipeline.

### Four decisions worth explaining

**Charts are hand-built SVG, not a chart library.** Every donut, sparkline, line chart and bar
is drawn directly. It keeps the bundle small, and it means the visual language — the single-hue
sequential ramp, the one sanctioned green→red exception for crime density — is enforced by us
rather than fought against a library's defaults.

**SQLite compiled to WebAssembly.** Catalyst AppSail's managed Node runtime cannot build native
modules, so `better-sqlite3` fails there. `sql.js` is the same engine as pure WASM, letting the
identical SQL run locally and in production against a database bundled with the service.

**The write layer is a separate serverless function, deliberately.** The app and the read API sit
on different domains, and the session cookie belongs to the app's domain — it is never sent to
the other one. Writes are therefore served from the *same* origin as the app, so identity
resolves server-side with no tokens handled in the browser. A full explanation is in
[`docs/design/access-control-and-writes.md`](docs/design/access-control-and-writes.md) §6.

**The data generator is a component, not a fixture.** No real crime data exists for this
challenge, so the generator is tested, reproducible, and schema-conformant by construction —
which is what makes "swap in real SCRB extracts" a credible claim rather than a hope.

---

## <img src="docs/assets/icons/quickstart.svg" width="22" align="center"> Run it locally

```bash
python pipeline/build.py
```

```bash
cd server && npm install && npm start
```

```bash
cd client && npm install && npm run dev
```

The app runs at `http://localhost:5173`, proxying `/api` to the local server on `:4000`.

Sign-in and write actions need Catalyst hosting; locally they degrade to honest read-only messages rather than breaking. Deployment and console setup are in [`docs/writes-and-auth-runbook.md`](docs/writes-and-auth-runbook.md).

---

## <img src="docs/assets/icons/testing.svg" width="22" align="center"> Tests

```bash
cd catalyst-app/functions/kspwrite && npm test   # 13 — scope enforcement + data invariants
cd server && npm test                            # 7  — FIR uniqueness, launch behaviour
cd pipeline && python -m unittest test_determinism  # 3 — reproducibility across hash seeds
```

**23 passing.** They cover the properties that would be embarrassing to get wrong: that an unknown unit yields *empty* scope rather than global scope; that a South-division ASP is refused on an East-division case; that every case maps to a station that exists in the org tree; and that two builds under different hash seeds are identical.

---

## <img src="docs/assets/icons/demo.svg" width="22" align="center"> Demo

The five-minute walkthrough, with timings and the exact narration, is in [`docs/demo-script.md`](docs/demo-script.md).

Short version: sign in as the Sub-Inspector, add a note to a case in your own station — it persists. Sign in as the ASP, who outranks you, and the same action on that case is refused. Sign in as SCRB and it succeeds. Open the Audit Trail: all three, with officer, unit, time and outcome.

---

## <img src="docs/assets/icons/team.svg" width="22" align="center"> Coverage against the challenge framework

Challenge 02 lists six capability groups. Marked honestly — **Built**, **Partial**, or **Not built** — because a judge will find the gaps either way, and naming them first is worth more than hiding them.

| Capability (from the brief) | Status | Where it lives |
|---|---|---|
| Interactive dashboards & geospatial maps | **Built** | Command View, Map & Hotspots |
| District-level drilldown | **Built** | Zone drilldown; cluster Zone/District levels |
| Spatiotemporal clusters (time × location) | **Built** | 24-hour scrubber over the heat surface |
| Emerging trend alerts | **Built** | Trends & Alerts; risk-scored zones; live alert badge |
| Relationship mapping (node-based) | **Built** | Person & Network graph |
| Repeat-offender tracking | **Built** | Entity resolution, F1 **0.943** |
| Association detection | **Built** | 2,366 co-accused associations inferred |
| Predictive risk scoring | **Partial** | Zone and offender risk are **transparent heuristics** (recency, volume, heinous weighting), not a trained model. Deliberate: an unexplainable risk score is a liability in an investigation, and the brief demands explainability. |
| Socio-economic correlation | **Partial** | The schema carries occupation, caste and religion, and case records expose them. No external census or urbanisation layer is joined. |
| Anomaly detection | **Not built** | Trend deltas surface unusual movement, but there is no formal outlier model. |
| Modus operandi analysis | **Not built** | The published ER diagram has no MO field to analyse. |
| Role-based access, audit & traceability | **Built** | Beyond the brief — enforced server-side, refusals recorded |

---

## <img src="docs/assets/icons/audit.svg" width="22" align="center"> What we did **not** build

Stated plainly, because a labelled gap is more credible than a half-working feature:

- **Password changes** are delegated to Catalyst's own reset flow. This codebase contains no password field and never handles a credential.
- **Document upload** is labelled in-product as not in this build.
- **Financial transaction analysis** (framework item 7) has no schema support — there is no transaction table in the published ER diagram.
- Data is **synthetic**. The system is schema-conformant by construction, so real SCRB extracts drop in by swapping the source.

---

## <img src="docs/assets/icons/roadmap.svg" width="22" align="center"> Repository

```
pipeline/        synthetic generation, entity resolution, precompute (Python)
server/          read API over SQLite (local dev + static export)
client/          React SPA
catalyst-app/
  appsail/       deployed read API
  functions/
    kspwrite/    authenticated write layer + scope enforcement
  client/        deployed SPA bundle
docs/            architecture, design specs, runbook, demo script
```

Design rationale lives in [`architecture.md`](architecture.md), [`design.md`](design.md), and
[`docs/design/access-control-and-writes.md`](docs/design/access-control-and-writes.md).

---

## <img src="docs/assets/icons/legal.svg" width="22" align="center"> A note on the emblem

The mark used throughout is a **stylised shield-and-star, not the Karnataka State Police emblem**. A 2022 Government of Karnataka circular, citing the State Emblem of India (Prohibition of Improper Use) Act, 2005, reserves the real emblem for government departments absent prior permission. Nothing here reproduces the Gandaberunda or the Ashoka Lion Capital. It should be swapped for the official emblem only once KSP authorises its use.

---

<p align="center">
  <sub>Built for Datathon 2026 · Karnataka State Police · State Crime Records Bureau</sub>
</p>
