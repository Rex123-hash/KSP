# Access control and case-file writes

**KSP Crime Intelligence Platform · Datathon 2026 · Challenge 02**

How an officer signs in, how the system decides what they are allowed to touch,
and how every action — permitted or refused — is recorded.

This is the design behind framework item 10, *"Secure Role-Based Access &
Governance — role-based access for investigators, analysts, supervisors and
policymakers; secure handling of sensitive data with audit logs and
traceability."*

---

## 1. The idea

A crime record system has to answer a question most dashboards ignore: **who is
allowed to change this file, and how would anyone prove it later?**

A role dropdown does not answer it. Neither does a login that everyone shares.
What answers it is authority derived from the force's own structure, enforced on
the server, and written to a log that includes the attempts that were *refused*.

That is what this part of the platform does.

## 2. Authority comes from the command tree

The published KSP schema contains a table, `Unit`, whose `ParentUnit` column
points at another row in the same table. That self-reference **is** the police
command hierarchy:

```
Karnataka State Police              ← State bureau: all 44 units
└── Bengaluru City Police
    ├── Bengaluru South Division    ← ASP: this division and its stations
    │   ├── Jayanagar PS
    │   ├── JP Nagar PS
    │   └── …
    └── Bengaluru East Division
        └── Indiranagar PS          ← Sub-Inspector: one station
```

When an officer signs in, the system resolves them to a unit, and their
authority is **the subtree beneath that unit**. A Sub-Inspector at a station
commands one station. An ASP commands a division and every station under it. The
State Crime Records Bureau commands everything.

Access control is therefore not a feature bolted onto the data — it falls out of
the data model. Nothing needs to be configured per user beyond *where they are
posted*.

### The consequence worth demonstrating

Because authority follows **position**, not **rank**, an ASP for Bengaluru South
cannot act on a case in Bengaluru East — even though that ASP outranks the
Sub-Inspector who can. Different branch of the tree, no authority.

The demo shows exactly this, and the test suite asserts it
(`catalyst-app/functions/kspwrite/scope.test.js`, *"command position, not rank,
decides access to the featured case"*).

## 3. What an officer can do

| Action | Effect |
|---|---|
| Add note | Appends an investigation note to the case file |
| Update status | Records a status change with a reason |
| Close case | Records a move to *Closed* |
| Edit profile | Updates the officer's own contact details and language |

All four persist to the database and appear in the case's timeline. Each also
writes a row to the audit log.

**Passwords are deliberately not handled by this platform.** Sign-in is Catalyst
Authentication; the application has no password field anywhere and never sees a
credential. Password resets go through Catalyst's own flow.

## 4. How a write is checked

Every request that changes something follows the same five steps, all on the
server:

```
1. Resolve the session          →  which officer is this, from the auth cookie
2. Look up their posting        →  unit and rank from their officer record
3. Locate the case's station    →  from a server-side map, never from the request
4. Test command scope           →  is that station inside their subtree?
5. Write, then record the audit →  including when the answer was "no"
```

Three properties make this trustworthy rather than decorative:

**The browser never states who it is.** Identity and unit are read from the
session on every single request. A modified request body cannot widen anyone's
authority.

**The case's station is never taken from the request.** It is looked up in a
`case → station` map held by the server. An officer naming an arbitrary case
number still cannot reach outside their own command.

**Refusals are recorded.** A denied action returns an error *and* writes an audit
row marked `deny`. This matters more than it first appears: a successful action
looks identical whether or not the check ran. A recorded refusal is positive
evidence that it did.

## 5. What is stored

Five tables, all small:

| Table | Holds |
|---|---|
| `AppUser` | Which officer each sign-in maps to — unit, rank, designation, role |
| `CaseNote` | Investigation notes, with author and unit |
| `CaseStatusChange` | Status transitions, with reason, author and unit |
| `UserProfile` | Officer contact details and language preference |
| `AuditLog` | Every action and every refusal: actor, unit, target, outcome, detail |

Case records themselves are **never modified**. Notes and status changes are
recorded separately and layered over the original record when it is displayed,
so the underlying FIR data stays exactly as filed — the same principle as an
append-only case diary.

## 6. Why the write service is separate from the read service

A practical constraint shaped the architecture, and it is worth stating plainly
because it is the kind of thing that silently breaks a submission.

The application is served from one internet domain and the read API from
another. The sign-in session is held in a cookie belonging to the *application's*
domain, and browsers will not send that cookie to a different domain. Any design
that posted changes straight to the read API would arrive with no identity
attached, and the server could not tell who was asking.

So the write service is deployed as a serverless function published under the
**same domain as the application**. The session travels with every request, and
the server can resolve the officer with no tokens to manage in the browser.

A second benefit: the read path was never modified while all of this was added.

```
Browser
  ├── reads  ─────────►  Read API        (case data, analytics, hotspots)
  └── writes ─────────►  Write service   (same domain — session arrives intact)
                            ├── Authentication   who you are
                            ├── Database         notes, status, audit
                            └── Command tree     what you may touch
```

## 7. When something is refused

The interface is explicit rather than silent. A case outside the officer's
command shows a banner saying so before they try anything. If they try anyway,
they are told plainly that the attempt has been recorded — and it appears in the
Audit Trail with their name against it.

Signed out, or if the write service is unreachable, the actions state that they
are unavailable instead of appearing to succeed. Nothing ever reports a save that
did not happen.

## 8. Verified behaviour

The following are covered by automated tests rather than asserted here:

- An officer whose posting cannot be resolved gets **no** authority, not global
  authority — the safe direction to fail.
- A station officer is refused on a case belonging to a different division.
- A division officer is refused on a case in a sibling division, regardless of
  rank.
- Every case in the dataset maps to a station that exists in the command tree.

## 9. Deliberate limits

- Password changes are handled by Catalyst, not implemented here.
- Notes cannot be edited or deleted once recorded — an audit trail that can be
  rewritten is not an audit trail.
- Document attachments are not supported.
- Officer accounts are created by an administrator; there is no self-registration.
