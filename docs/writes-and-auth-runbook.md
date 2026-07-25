# Runbook — bringing writes & auth live

Everything in the codebase is done. What remains is Catalyst console setup and one deploy.
Design rationale lives in `docs/superpowers/specs/2026-07-25-writes-and-auth-design.md`.

Do the steps in order — step 1 involves email round-trips, so start it first.

---

## 1. Authentication (do this first — it involves email)

Catalyst console → **Authentication**:

1. Set the sign-in method to **Embedded**.
2. Add the app's hosted URL to the allowed / redirect domains:
   `https://ksp-crime-intelligence-60078249847.development.catalystserverless.in`
3. **Users → Add User** for the three demo officers below. Use addresses you can actually
   receive mail at — Catalyst emails a confirmation link, and an unconfirmed user cannot
   sign in. Confirm all three before demoing.

| # | Purpose | Suggested email | First / Last name |
|---|---|---|---|
| 1 | Station officer, **can** write to the featured case | `si.indiranagar@…` | Prakash / Rao |
| 2 | Senior officer, **refused** on the featured case | `asp.south@…` | Sharath / Kumar |
| 3 | State bureau, **can** write anywhere | `scrb@…` | SCRB / Bengaluru |

## 2. Data Store tables

Console → **Data Store** → create five tables in the **Development** environment.
Do **not** add `ROWID`, `CREATEDTIME`, `CREATORID`, `MODIFIEDTIME` — Catalyst adds those.

Column types and lengths are listed in §5 of the design spec. Summary:

| Table | Columns |
|---|---|
| `AppUser` | Email, DisplayName, RankID, RankName, UnitID, Designation, Role, Active |
| `CaseNote` | CaseMasterID, NoteText, AuthorEmail, AuthorName, AuthorUnitID |
| `CaseStatusChange` | CaseMasterID, FromStatusID, ToStatusID, Reason, AuthorEmail, AuthorName, AuthorUnitID |
| `UserProfile` | Email, Phone, PreferredLanguage, DisplayName |
| `AuditLog` | ActorEmail, ActorName, ActorUnitID, Action, EntityType, EntityID, Outcome, Detail |

`UnitID`, `RankID`, `CaseMasterID`, `*StatusID`, `ActorUnitID`, `AuthorUnitID` are **Number**;
`Active` is **Boolean**; everything else is **Text**.

## 3. Seed the three officer records

Console → Data Store → `AppUser` → add three rows. The `UnitID` values are what actually
grant scope, so they matter more than the names.

| Email | DisplayName | RankID | RankName | UnitID | Designation | Role | Active |
|---|---|---|---|---|---|---|---|
| *(user 1 email)* | Prakash Rao | 8 | Sub-Inspector | **22** | SHO | investigator | true |
| *(user 2 email)* | R. Sharath Kumar, IPS | 5 | ASP | **3** | Division Officer | supervisor | true |
| *(user 3 email)* | SCRB Bengaluru | 1 | DGP | **1** | State Bureau | policymaker | true |

Unit 22 = Indiranagar PS · Unit 3 = Bengaluru South Division · Unit 1 = Karnataka State Police.

**Why these three:** the featured case (the one Case Details renders) is at Indiranagar PS,
under Bengaluru East. So the SI can write to it, the SCRB can write to it, and the ASP —
despite outranking the SI — cannot, because South is a different branch of the command tree.
That contrast is the demo.

## 4. Deploy

The read API (AppSail `kspapi`) is **not** touched and does not need redeploying.

```bash
cd catalyst-app/functions/kspwrite && npm install
```

```bash
cd client && npm run build
```

```bash
cd catalyst-app && npx catalyst deploy --only functions,client
```

## 5. Verify, in this order

1. **Cookie reaches the function** — the single riskiest assumption in the design:
   open `https://<app-domain>/server/kspwrite/health` → `{"ok":true,"service":"kspwrite"}`.
   Then, signed out, `/server/kspwrite/session` → `{"authenticated":false}`.
   If `/health` 404s, the function did not deploy. Stop and fix that before anything else.
2. **Sign in as user 1 (SI)** → top bar shows their name and *Indiranagar PS*.
3. **Add a note** on Case / FIR Details → it persists and appears in the Case File timeline.
4. **Sign out, sign in as user 2 (ASP South)** → the case page shows the out-of-scope banner;
   Update Status is refused with *"…outside your command scope. The attempt has been recorded."*
5. **Sign in as user 3 (SCRB)** → the same status change succeeds.
6. **Audit Trail** → allowed rows and the refused row, with actor, unit, time and outcome.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `/session` returns `{"authenticated":false}` while signed in | Cookie not reaching the function | Confirm the app and function are on the same domain; check the browser sent a Catalyst cookie |
| `{"authenticated":false,"unmapped":"you@…"}` | Signed in, but no `AppUser` row for that email | Add the row (step 3); email must match exactly |
| Every write 403s | `UnitID` wrong in `AppUser` | Unit 22/3/1 as above — not the rank |
| Notes save but never appear | `CaseNote` column name mismatch | Column names are case-sensitive; match §5 exactly |
| Login area blank / "available only on the deployed app" | Web SDK didn't load | Expected on `localhost`; verify on the deployed URL |

## Regenerating the bundled lookups

If the pipeline regenerates the database, the function's lookup files must be rebuilt or the
case→station mapping goes stale:

```bash
node server/export-write-data.mjs
```

## What is deliberately not built

Password changes (delegated to Catalyst's reset flow — this app never handles a credential),
self-registration, note editing/deletion, and attachments.
