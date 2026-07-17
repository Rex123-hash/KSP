# Architecture — KSP Crime Intelligence Platform

**Datathon 2026 · Challenge 2: AI-Driven Crime Analytics & Visualization Platform**

Status: draft for review. Last updated 2026-07-17.

---

## 1. What this is

A crime analytics platform for the Karnataka State Police State Crime Records Bureau (SCRB), replacing siloed Excel reporting with an integrated system that surfaces spatial, temporal, and relational patterns across FIR data from 1100+ police stations.

The platform is shaped like the police command structure: what you see is determined by where you sit in the hierarchy.

## 2. Hard constraints

These are not preferences. They come from the rules or from the platform, and they drive most decisions below.

| Constraint | Source | Consequence |
|---|---|---|
| Deployment on Zoho Catalyst is **mandatory** | Initiative rules ("without exception") | No Vercel, no AWS, no Supabase |
| Using a third-party where a Catalyst service exists "may affect the validity of your submission" | Initiative rules | Service choices are dictated, not chosen |
| Data Store queries use **ZCQL**, not SQL | Catalyst platform | Window functions / CTEs unverified — see §7 |
| Data Store dev env: **5,000 rows/table, 25,000/project** | Catalyst docs | Synthetic data lives in **production**; dev gets a sample |
| Free tier: **5,000 row insertions/month, account-wide** | Catalyst docs | Credits must be confirmed live before bulk load |
| QuickML: 25 datasets, 25 pipelines, 10 endpoints, 100K DB records | Catalyst docs | Feed QuickML aggregates, not raw FIRs |
| No real data exists — schema only | Initiative resources | Synthetic generation is a first-class component |
| No person identity in schema | ER diagram | Entity resolution is required, not optional — see §5 |

## 3. Service mapping

Per the mandated capability→service table in the initiative resources:

| Layer | Catalyst service |
|---|---|
| Frontend (React SPA) | Web Client Hosting |
| API / backend logic | Serverless Functions |
| API routing & auth | API Gateway |
| Relational store | Data Store (ZCQL) |
| Auth / RBAC | Catalyst Authentication |
| ML (risk scoring, anomaly) | QuickML |
| Hot aggregates | Catalyst Cache |
| Object storage (GeoJSON, exports) | Stratus |

## 4. Core decision: precompute, don't query live

The dashboard reads **flat summary tables**, not raw FIRs.

Rationale:
- ZCQL's analytical capability is unverified; window functions and CTEs may be absent. Rolling averages, rank-within-district, and period-over-period deltas all need them.
- A live demo that hangs is a dead demo. The pitch is 7 minutes.
- Data is synthetic and static. There is no real-time source to be live against.

A batch job computes hotspot grids, district-month rollups, trend baselines, clearance metrics, and risk scores into purpose-built tables. The API layer does simple indexed reads.

**Trade-off accepted:** data is not real-time. If a judge asks, the answer is that the ingestion pipeline is event-driven (Catalyst Signals on insert) and recompute is incremental — which is true of the design even though the prototype recomputes in batch.

## 5. Components

### 5.1 Data generator (Python, offline)

Emits synthetic FIRs conforming exactly to the ER schema, bulk-loaded to Data Store as CSV.

Calibration sources (real, public, verified):
- KSP Monthly Crime Review PDFs — 42 reports covering 2023, 2024, 2025, and Jan–Jun 2026, district-wise by crime head
- OpenCity Karnataka Crime Data 2023 — CSVs of district/city-wise totals, IPC and SLL splits

What it calibrates: district weights, crime-head proportions, monthly seasonality.
What it invents (and must be labelled as invented): time-of-day distributions by crime type, lat/long within district boundaries, name pools, network structure.

**It retains ground truth.** A separate artifact maps every generated `AccusedMasterID` to the synthetic person who committed it. This never enters Data Store. It is the evaluation set for §5.2 and it is the thing no competing team will have.

**Planted signal** (deliberate, for the demo and to make the analytics find anything at all):
- an offender ring operating across 3 stations under transliteration variants
- at least one genuine spatiotemporal hotspot
- at least one trend spike against baseline

> Naive uniform-random generation produces a map with evenly scattered dots and analytics that find nothing. The generator is the foundation, not scaffolding.

### 5.2 Person resolution engine (Python, offline batch) — **the moat**

The schema has no person identity. `Accused` carries `AccusedMasterID` (PK), `CaseMasterID` (FK), name, age, gender. `PersonID` is intra-case ordering (A1, A2, A3), not identity. There is no address, phone, parent name, or biometric.

So the same human across four FIRs is four unrelated rows, and **every downstream feature** — criminal networks, repeat offenders, risk scoring, association detection — depends on inferring that link.

Pipeline:
1. **Blocking** — candidate pairs only within tractable buckets (district, gender, coarse name key)
2. **Normalisation** — transliteration-aware; Kannada-derived names arrive as "Ravi Kumar" / "Ravikumar" / "Ravi Kumara" / "Ravi K."
3. **Scoring** — Jaro-Winkler on normalised name + age-progression consistency across incident years + gender agreement
4. **Clustering** — connected components over the match graph above threshold
5. **Output** — `ResolvedPerson` + `PersonCaseLink`, every link carrying a **confidence score**

**Evaluated against §5.1's ground truth: precision, recall, F1.** Reported in the UI and the pitch. Competing teams will show a network graph and assert it. We show a number and say how we know.

### 5.3 Analytics precompute

- Spatiotemporal hotspots from real `CaseMaster.latitude` / `longitude` × time-of-day
- Trend baselines and spike detection vs historical district/crime-head averages
- Anomaly flags
- Clearance metrics from `ChargesheetDetails.cstype` (A=chargesheet, B=false case, C=undetected) — **the only real supervised label in the schema**
- Reporting-delay metrics from `IncidentFromDate` → `InfoReceivedPSDate` → `CrimeRegisteredDate` (derivable, and nobody else will compute it)

### 5.4 API layer (Catalyst Functions)

Role-scoped reads over summary tables. Scope enforced server-side from the caller's `Employee` record — never trusted from the client.

### 5.5 Dashboard (React SPA)

See `design.md`.

## 6. The org-chart spine

The schema hands us the command tree. This is the single most important structural insight, and it is what the 2024 winning submission was built on.

- `Unit.ParentUnit` — self-referencing hierarchy = the actual command tree
- `UnitType.Hierarchy` — "lower = higher authority"
- `UnitType.CityDistState` — City / District / State operational level
- `Rank.Hierarchy` — rank authority level
- `Designation` — SHO, Investigating Officer

A user authenticates and resolves to an `Employee` with a `UnitID` and `RankID`. **Visible scope = the subtree beneath their unit.** An SI sees their station. An ASP sees their district's stations. SCRB sees the state.

Access control is not bolted on. It falls out of the data model.

## 7. Open questions — resolve day one

| Question | Why it blocks | How to answer |
|---|---|---|
| Does ZCQL support window functions / CTEs? | Determines if analytics live in DB or Functions | Hands-on in Catalyst console. Docs are silent. |
| Did the Zoho credits actually land? | Free tier caps at 5K insertions/month account-wide | Check Catalyst billing console |
| Is Karnataka district-boundary GeoJSON available? | Needed to place lat/long inside real districts | Search; fall back to district centroids + jitter |
| Data Store bulk-load throughput and format? | Sizes the generator's output target | Catalyst bulk write API docs / trial |

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Catalyst deployment fails late | **Fatal** | Hello-world deployed day 1–2, not day 8 |
| Entity resolution is invisible to judges | High | Demo must *show* name variants collapsing — see `design.md` |
| "Would this work on real data?" | Medium | Schema-conformant by construction; swap the source. Have the answer rehearsed. |
| ZCQL can't express the analytics | Medium | Precompute already routes around it |
| Two people, ten weeks, unfamiliar platform | High | Scope discipline; the 2024 winner shipped ~212KB total |

## 9. Timeline

- **26 Jul** — prototype gate: deck + video + deployed link. Ships the spine.
- **19 Aug** — initial shortlist
- **19–30 Aug** — refinement window, with assigned mentors
- **9 Sep** — final shortlist
- **26 Sep** — Grand Finale, in-person demo day. **This is the real deadline.**

Target: 100% of Challenge 2 coverage by the finale. The 26 Jul gate ships the spine plus an honest roadmap.

## 10. Scope boundaries — stated honestly

Two Challenge 2 / Challenge 1 requirements are **not backed by the schema**. We name these in the submission rather than fake them:

- **Financial crime / transaction link analysis** — no transaction table, no account, no financial column exists. Unbuildable without inventing data the SCRB never provided. We show where it would attach.
- **Modus operandi analysis** — no MO field. The only source is `BriefFacts` (free text). Requires NLP; roadmapped to the refinement window.

Also honest: socio-economic attributes (`OccupationID`, `ReligionID`, `CasteID`) exist **only on `ComplainantDetails`**. Victims and accused have name, age, gender only. So socio-demographic analysis describes who *reports* crime, not who commits it. Any claim beyond that is false. Caste and religion analysis additionally warrants editorial care.
