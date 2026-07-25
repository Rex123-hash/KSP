# Demo script — 5 minutes

**KSP Crime Intelligence Platform · Datathon 2026 · Challenge 02**

Timed for a 5-minute submission video. Narration is written to be read aloud at a
normal pace — roughly 140 words per minute.

---

## Before you record

- [ ] Hard-refresh the app (`Ctrl+Shift+R`) so no stale bundle is cached.
- [ ] Sign **out**. The video should open on the login screen.
- [ ] Have all three passwords ready: `Ksp@Datathon2026` for every account.
- [ ] Close other tabs. The browser tab title and favicon are on screen the whole time.
- [ ] Record at 1920×1080. Zoom the browser to 100%.
- [ ] Add a note to a case **before** recording, then delete nothing — the Audit
      Trail should already have a row or two so it doesn't look empty at 4:10.

The single most common failure is talking over a page that hasn't loaded. Click,
**wait for the render**, then speak.

---

## 0:00 – 0:25 · The problem

**On screen:** Login page. Don't sign in yet. Let the branding sit.

> The Karnataka State Police State Crime Records Bureau collects crime records
> from over eleven hundred police stations. Today that analysis happens in
> Excel — siloed, manual, and reactive.
>
> We built a crime intelligence platform that does three things Excel can't:
> it shows where crime concentrates and when, it reconstructs who is connected
> to whom, and it records who did what to every case file.

---

## 0:25 – 1:15 · Spatiotemporal hotspots

**Action:** Sign in as `amaan.k2405@gmail.com`. Go to **Map & Hotspots**.

> This is five thousand two hundred FIRs across Bengaluru.

**Action:** Drag the time slider, then press **Play Animation**. Let it run ~8 seconds.

> The scrubber is the whole point. As the day advances, the clusters move.
> Property crime peaks in commercial zones in the afternoon; the night window
> shifts the concentration elsewhere. A static map averages that away — and
> averaging is exactly what loses you the deployment decision.

**Action:** Click the **View By** chip to switch from Heatmap to **Clusters**, then
the **Level** chip to go from Zone to District.

> The same data, counted rather than smeared. Zone granularity gives you roughly
> seven hundred clusters across the state; district level collapses that to
> fifty-eight. A gradient tells you where it's hot — a count tells you how many
> officers you need.

**Action:** Click **View Zone Details**.

> Drilling into a zone gives the station-level answer: the crime-head split, the
> peak window computed from actual incident hours, how far the cases have
> progressed, and the most recent FIRs.
>
> "Theft, forty percent of this zone, peaking nine to eleven PM" is not a
> statistic. It's a patrol roster.

**Action:** Close the panel.

---

## 1:15 – 2:00 · Criminal networks

**Action:** Go to **Person & Network**.

> The published schema has no person identity. Every accused row is bound to one
> case, so the same individual appears as a fresh record in every FIR — and
> across transliteration variants of their name.

**Action:** Point at the merged-variants list on the profile.

> We reconstruct identity across cases, then draw the co-accused links. These
> variants collapsed into one person, and that person's associates emerged from
> shared cases.
>
> Measured against ground truth: precision zero point nine three, recall zero
> point nine five, F1 zero point nine four three. We report the number because
> an entity-resolution system that can't be measured shouldn't be trusted.

---

## 2:00 – 3:30 · Role-based access — the centrepiece

> Everything so far is analysis. This is governance, and it's where most
> submissions stop at a role dropdown.

**Action:** Point at the sidebar scope card — *Indiranagar PS · Sub-Inspector · 1 unit*.

> I'm signed in as a Sub-Inspector at Indiranagar station. My authority is one
> station, and that isn't a setting — it comes from the command tree in the
> schema itself. `Unit.ParentUnit` is a self-referencing hierarchy. It *is* the
> police org chart.

**Action:** Go to **Case / FIR Details**. Click **Add Note**, type
`Verified CCTV footage with complainant.` and save. Wait for the toast.

> This case is in my station, so I can act on it. That note is now in Catalyst
> Data Store — a real write, in the case timeline.

**Action:** Sign out. Sign in as `amaank2405@gmail.com`. Return to **Case / FIR Details**.

> Now I'm an ASP commanding Bengaluru South Division. I **outrank** that
> Sub-Inspector.

**Action:** Point at the out-of-scope banner. Then click **Update Status**, pick a
status, click **Apply**. Let the refusal toast appear.

> And I'm refused. This case belongs to Indiranagar, in the East division. A
> higher rank in a different branch of the tree has no authority over it —
> because authority follows command position, not rank.
>
> The refusal was enforced on the server. The browser never decides this.

**Action:** Sign out. Sign in as `a.maank2405@gmail.com`. Repeat the status change.

> State bureau. Forty-four units in scope. Same action, now permitted.

---

## 3:30 – 4:10 · The audit trail

**Action:** Open **Audit Trail**.

> And here is why that matters. Every action, and every *refused* action, with
> the officer, their unit, the timestamp, and the outcome.

**Action:** Point at the red *Refused* row.

> A successful action proves nothing about access control — it would look
> identical if we'd never checked. A recorded refusal proves the check ran.
> That's the difference between claiming compliance and demonstrating it.

---

## 4:10 – 4:40 · Built on Catalyst

**Action:** Command View, or a slide listing services.

> Everything is deployed on Zoho Catalyst, using the mandated service for each
> capability: Web Client Hosting for the app, AppSail for the read API,
> Serverless Functions for the authenticated write layer, Data Store for
> persistence, and Catalyst Authentication for identity.
>
> One design note worth stating. The write layer is a Function rather than part
> of the read API, because Catalyst's session cookie is scoped to the hosting
> domain and never reaches the AppSail domain. Serving writes same-origin is
> what makes the session resolve server-side at all.

---

## 4:40 – 5:00 · Close

> The data is synthetic — no real records exist for this challenge — but it's
> schema-conformant by construction, so real SCRB extracts swap straight in.
> The pipeline is reproducible: two builds produce byte-identical data.
>
> Twenty-three tests cover the properties that matter, including that an unknown
> unit resolves to *empty* scope rather than global scope.
>
> Crime intelligence that shows you where to go, who's connected, and who
> touched the file. Thank you.

---

## If you have only 3 minutes

Cut in this order:

1. Person & Network (2:00 mark) — the F1 number can be a single sentence over the hotspot map.
2. The Catalyst services section — fold one line into the close.
3. The zone drilldown — keep the time animation; it carries the same argument faster.

**Never cut** the SI → ASP → SCRB sequence or the audit trail. That is the
submission's strongest claim and the hardest for a competitor to match.

---

## Questions judges are likely to ask

**"Would this work on real data?"**
The schema is conformant to the published ER diagram, so the generator can be
swapped for real extracts without touching queries. The read path is SQL over
that schema.

**"How do you know the entity resolution is right?"**
The generator emits ground-truth identities, and we score pairwise against them:
precision 0.934, recall 0.953, F1 0.943. Shown in-product on the Person page.

**"Is the access control real or cosmetic?"**
Enforced server-side on every mutation, derived from `Unit.ParentUnit`. The
client never asserts identity or scope, and the case's station comes from a
server-side map rather than the request body. Denials are audited — the demo
shows one.

**"What isn't finished?"**
Password changes are delegated to Catalyst rather than implemented. Document
upload is labelled in-product. Financial
transaction analysis has no schema support — there's no transaction table in the
ER diagram.
