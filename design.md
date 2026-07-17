# Design Brief — KSP Crime Intelligence Platform

**Datathon 2026 · Challenge 2** · Companion to `architecture.md`
Status: brief for the designer. Last updated 2026-07-17.

---

## 1. Read this first

This is a brief, not a spec of screens I've already drawn. It states what each screen must **do**, what must be **visible**, and the constraints that aren't negotiable. Composition, spacing, and craft are yours.

**Who this is for:** Karnataka State Police officers — Sub-Inspectors up to SCRB analysts and senior IPS officers. Not consumers. Not startup users. People who currently do this job in Excel and will judge whether this looks like *their* system.

**Why design decides this competition:** the team that won the 2024 KSP Datathon against 380 teams shipped a React dashboard with no machine learning at all, and 31% of their codebase was SCSS and CSS. Judges bought the framing and the polish. Our analytics are genuinely stronger than theirs — but the analytics only score if the design makes them legible in a **7-minute pitch**.

## 2. Design principles

1. **Institutional, not consumer.** This is a government intelligence tool. Sober, dense, confident. No gradients, no glassmorphism, no marketing gloss, no rounded-everything. Closer to a terminal than to a SaaS landing page.
2. **The org chart is the product.** Every screen answers "where am I in the force, and what does that let me see?" first.
3. **Density is a feature.** These users want more on screen, not less. Whitespace that reads as "premium" to a designer reads as "toy" to a police officer with 40 stations to watch.
4. **Every number is traceable.** Nothing appears without a path back to the FIRs behind it. The brief demands explainability; the design must deliver it.
5. **Kannada-ready.** Karnataka. Labels must survive Kannada strings roughly 1.3–1.6× English width. Design for it now even though the prototype ships English.

## 3. Information architecture

Six surfaces. No more.

| # | Surface | Job |
|---|---|---|
| 1 | **Login** | Authenticate → resolve to an `Employee` (unit + rank) |
| 2 | **Command View** | Landing. "What is happening in my command, right now?" |
| 3 | **Map / Hotspots** | Where crime is concentrated, in space and time |
| 4 | **Person & Network** | Who is connected to whom — **the differentiator** |
| 5 | **Trends & Alerts** | What changed vs baseline; anomalies |
| 6 | **Case / FIR detail** | The evidence layer every number drills into |

Persistent chrome: unit/rank identity always visible ("**Bengaluru South Division · ASP**"), plus a scope breadcrumb that reflects the `Unit.ParentUnit` tree.

## 4. Role scoping — the spine

Same dashboard. Scope derived from identity, not a menu.

| Role | Sees |
|---|---|
| Sub-Inspector | Their station |
| Inspector | Their station + subordinate beats |
| DySP / ASP | Their district's stations |
| SCRB / State | All of Karnataka |

**Design requirement:** the scope must be *visible and switchable downward*. A senior officer drills from state → district → station and back. The breadcrumb is a first-class component, not an afterthought. Show me the hierarchy — that's the thing the 2024 winner got right and the reason a police bureau recognised it as theirs.

## 5. Screens

### 5.1 Command View (landing)

The screen a judge sees first. It must land the story in under ten seconds.

- **Hero figure** — one number, ≥48px: total cases in scope, current period. Not a chart.
- **KPI row** — stat tiles (value + delta + sparkline), not a grouped bar chart. Suggested: cases registered, clearance rate, cases undetected, avg reporting delay, active alerts.
- **Map panel** — hotspots in scope
- **Alerts panel** — spikes vs baseline, status-coded
- **Recent activity** — latest FIRs in scope

Note *avg reporting delay* — derived from `IncidentFromDate` → `InfoReceivedPSDate` → `CrimeRegisteredDate`. It's real, it's operationally meaningful, and no competing team will have thought to compute it. Give it room.

### 5.2 Map / Hotspots

Real `latitude`/`longitude` from `CaseMaster`. Karnataka districts.

- Density/choropleth layer — **sequential, one hue, light→dark** (see §7)
- Time-of-day filter → spatiotemporal clusters (the brief explicitly asks for time × location layering)
- District drilldown → station level
- Crime-head filter
- **Emerging-trend indicator** where a category spikes vs historical average. The brief literally suggests "red-zone pulsing" — do something with restraint; a pulsing red blob is easy to make look cheap. Status color + icon + label, never color alone.

### 5.3 Person & Network — **the most important screen**

This is where we win or lose, and it needs the most design attention.

The database has **no person identity**. `Accused` rows are bound to a single case; the same human across four FIRs is four unrelated rows with only name, age, and gender to go on — and Karnataka names arrive as inconsistent transliterations of Kannada. Our engine infers identity with a confidence score. Every other team will either not notice or fake it with exact-name matching that silently fails.

**Therefore the design must make the hard thing visible.** If resolution stays under the hood, the work is wasted.

Required on this screen:
- **The collapse, shown literally.** Four name variants — "Ravi Kumar", "Ravikumar", "Ravi Kumara", "Ravi K." — visibly resolving into one person. This is the single most important visual in the entire submission. It's the pitch's payoff. Design it as the hero moment, not a table row.
- **Confidence, always.** Every link carries a score. Show it. Never present an inferred identity as a certainty.
- **The network graph** — nodes (persons, locations, cases), edges (co-accused, shared location). Edge weight/opacity encodes confidence. Must stay readable at ~50 nodes; degrade gracefully past that.
- **Person profile** — resolved identity, linked cases across stations, timeline, MO placeholder, risk score.
- **The metrics, on screen.** Precision / recall / F1 against ground truth. A judge should be able to see we measured it. Small, factual, unmissable — not buried in the deck.
- **Evidence path.** Click any inferred link → the FIRs and the reason it matched.

### 5.4 Trends & Alerts

- Spike detection vs district/crime-head baseline → **emphasis form** (one series in accent, rest gray). Not categorical. The story is "this one moved."
- Anomaly call-outs with status color + icon + label
- Seasonality view

### 5.5 Case / FIR detail

The evidence layer. `CrimeNo` is structured (1-digit category + 4-digit district + 4-digit station + 4-digit year + 5-digit serial) — **decode it in the UI**. Showing the officer that we understand their numbering scheme is a small touch that signals we read their documentation.

Include: parties (complainant / victim / accused), acts & sections, status, court, chargesheet outcome, timeline, location.

## 6. Component inventory

Breadcrumb (hierarchy-aware) · stat tile · hero figure · map (choropleth + points) · network graph · data table (sortable, Kannada-safe) · filter bar (one row, above charts) · alert card (icon + label + status color) · confidence badge · evidence drawer · role/scope switcher · time-range control · empty / loading / error states.

## 7. Data visualization rules — non-negotiable

These come from an established viz method. Please don't relitigate them; they're load-bearing for accessibility and for not looking amateur.

**Form before color:**
- Single value → stat tile, never a one-bar bar chart
- Headline numbers → KPI row of stat tiles
- Magnitude low→high → bar, or heatmap for a grid → **sequential, one hue**
- Trend over time → line
- "This one moved" → **emphasis** (one hue + gray), not categorical
- Distinct series are the subject → categorical
- Part-to-whole → stacked bar

**Color by job:**
- **Sequential** (crime density, magnitude) = one hue, light→dark. Never a rainbow.
- **Diverging** (above/below baseline) = two hues + **neutral gray** midpoint. Never a hue at the midpoint.
- **Categorical** (crime heads) = fixed slot order, **never cycled**. Max 8; fold the tail into "Other" or facet into small multiples. A 9th generated hue is indistinguishable under colorblindness and breaks everything.
- **Status** (good / warning / serious / critical) = reserved. Never reused as "series 4". Always ships with icon + label.

**Hard rules:**
- **Never a dual-axis chart.** Two measures of different scale → two charts or index to a common base. This is the single most common chart mistake.
- Color follows the entity, never its rank — a filter that changes series count must not repaint the survivors.
- Legend present for ≥2 series (none for one — the title names it); ≤4 series also direct-labeled. Identity is never color-alone.
- Thin marks; 2px lines; ≥8px markers; 4px rounded data-ends anchored to baseline; 2px surface gap between adjacent/stacked fills; recessive grid and axes.
- Text wears text tokens, never the series color.
- Hover layer by default: crosshair + tooltip on line/area, per-mark tooltip on bar/dot/cell.
- A table view exists for every chart.
- **Dark mode is selected, not flipped** — its own steps validated against the dark surface.

**Palette:** a validated default is available and I'd start there rather than inventing one — but if you bring a KSP-appropriate palette (and an institutional navy/khaki register may well suit this better), it must be **run through the validator**, not eyeballed. The checks are lightness band, chroma floor, adjacent-pair colorblind separation (ΔE ≥ 12), and contrast. Tell me the palette and I'll run it.

**Typeface:** system sans throughout, including the hero figure. No display or serif face. `tabular-nums` for table columns and axis ticks only; proportional figures for hero and stat-tile values.

## 8. States

Design all of them. Prototypes die in demos on unhandled states.

- **Loading** — precomputed reads are fast; skeletons, no spinners
- **Empty** — a station with no cases in range is normal, not an error
- **Low confidence** — resolution below threshold must look different from resolution above it
- **Error** — a failed Function call must not blank the screen mid-pitch
- **Dense** — 40+ stations, 50+ network nodes. Design for the worst case, not the tidy one.

## 9. What the pitch needs from the design

Seven minutes. The design must carry this arc without narration:

1. "This is your force" → org-chart view, recognisable in 3 seconds
2. "This is where crime is" → hotspot map, calibrated to KSP's own published numbers
3. "Your database has no person ID" → the problem, stated visually
4. "We found this ring anyway" → the four name variants collapsing into one person, across three stations
5. "And here's how we know" → confidence + precision/recall on screen
6. "Here's what we can't do yet, and why" → honest gaps, roadmapped

Step 4 is the moment. If one screen gets disproportionate design effort, it's that one.

## 10. Deliverables

- Desktop-first (1440px). Officers use desktops. Mobile is not scored.
- Light **and** dark, both selected deliberately.
- Component states as §8.
- Tokens as CSS custom properties (roles, not raw hex) — the frontend consumes these directly.
- Kannada string-width sanity check on nav, labels, and table headers.

## 11. Out of scope for 26 July

Say so in the roadmap rather than faking it: financial link analysis (no transaction table exists in the schema — unbuildable), MO analysis (needs NLP over `BriefFacts`), full Kannada localisation, voice.
