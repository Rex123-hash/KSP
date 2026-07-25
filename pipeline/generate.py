"""
Synthetic FIR generator — populates the schema with data calibrated to KSP's
published distributions, and records ground-truth person identity so the
entity-resolution step can be measured.

Deterministic (fixed seed): the dataset is identical on every build, so the
demo never shifts under the presenters.
"""

import math
import random
from datetime import date, datetime, timedelta

import reference_data as R

SEED = 20260718
N_TRUE_PERSONS = 1500
N_CASES = 5200
PERIOD_START = date(2025, 6, 1)
PERIOD_END = date(2026, 7, 17)


def _wpick(rng, items, weights):
    return rng.choices(items, weights=weights, k=1)[0]


def _jitter(rng, lat, lng, km=2.5):
    # ~1 deg lat ≈ 111 km; gaussian scatter around a point
    dlat = rng.gauss(0, km / 111.0)
    dlng = rng.gauss(0, km / (111.0 * math.cos(math.radians(lat))))
    return round(lat + dlat, 6), round(lng + dlng, 6)


def _rand_date(rng, start, end):
    delta = (end - start).days
    return start + timedelta(days=rng.randint(0, delta))


def build(conn):
    rng = random.Random(SEED)
    cur = conn.cursor()

    # ---- Reference / lookup -------------------------------------------------
    cur.execute("INSERT INTO State VALUES (?,?,?,1)", R.STATE)
    for did, name, _w in R.DISTRICTS:
        cur.execute("INSERT INTO District VALUES (?,?,1,1)", (did, name))
    cur.executemany("INSERT INTO CaseCategory VALUES (?,?)", R.CASE_CATEGORIES)
    cur.executemany("INSERT INTO GravityOffence VALUES (?,?)", R.GRAVITY)
    cur.executemany("INSERT INTO CaseStatusMaster VALUES (?,?)", R.CASE_STATUSES)
    cur.executemany("INSERT INTO OccupationMaster VALUES (?,?)", R.OCCUPATIONS)
    cur.executemany("INSERT INTO ReligionMaster VALUES (?,?)", R.RELIGIONS)
    cur.executemany("INSERT INTO CasteMaster VALUES (?,?)", R.CASTES)
    for tid, name, lvl, hier in R.UNIT_TYPES:
        cur.execute("INSERT INTO UnitType VALUES (?,?,?,?,1)", (tid, name, lvl, hier))
    for rid, name, hier in R.RANKS:
        cur.execute("INSERT INTO Rank VALUES (?,?,?,1)", (rid, name, hier))
    for did, name, sort in R.DESIGNATIONS:
        cur.execute("INSERT INTO Designation VALUES (?,?,?,1)", (did, name, sort))
    for code, desc, short in R.ACTS:
        cur.execute("INSERT INTO Act VALUES (?,?,?,1)", (code, desc, short))
    for hid, group in R.CRIME_HEADS:
        cur.execute("INSERT INTO CrimeHead VALUES (?,?,1)", (hid, group))
    for sid, hid, name, _w, _g, _a, _s in R.CRIME_SUBHEADS:
        cur.execute("INSERT INTO CrimeSubHead VALUES (?,?,?,?)", (sid, hid, name, sid))

    # Sections (IPC + BNS equivalents)
    sec_id = 1
    for _sid, _hid, _name, _w, _g, act, sec in R.CRIME_SUBHEADS:
        cur.execute("INSERT INTO Section VALUES (?,?,?,?,1)",
                    (sec_id, "IPC", sec, f"IPC Section {sec}"))
        sec_id += 1
        bns = R.IPC_TO_BNS.get(sec)
        if bns:
            cur.execute("INSERT INTO Section VALUES (?,?,?,?,1)",
                        (sec_id, "BNS", bns, f"BNS Section {bns}"))
            sec_id += 1

    # ---- Org tree: units ----------------------------------------------------
    unit_id = 1
    state_unit = unit_id
    cur.execute("INSERT INTO Unit VALUES (?,?,?,?,1,1,NULL,1)",
                (unit_id, "Karnataka State Police", 1, None))
    unit_id += 1

    blr_city_unit = unit_id
    cur.execute("INSERT INTO Unit VALUES (?,?,?,?,1,1,1,1)",
                (unit_id, "Bengaluru City Police", 2, state_unit))
    unit_id += 1

    division_units = {}
    for i, dname in enumerate(R.BENGALURU_DIVISIONS):
        division_units[i] = unit_id
        cur.execute("INSERT INTO Unit VALUES (?,?,?,?,1,1,1,1)",
                    (unit_id, dname, 3, blr_city_unit))
        unit_id += 1

    # Bengaluru stations (station_id -> (lat,lng,weight,division))
    stations = []  # (unit_id, lat, lng, weight, district_id)
    for name, div_idx, lat, lng, w in R.BENGALURU_STATIONS:
        cur.execute("INSERT INTO Unit VALUES (?,?,?,?,1,1,1,1)",
                    (unit_id, name, 4, division_units[div_idx]))
        stations.append((unit_id, lat, lng, w, 1))
        unit_id += 1

    # District-level units for other districts (one unit each, at centroid)
    district_units = {1: blr_city_unit}
    for did, name, w in R.DISTRICTS:
        if did == 1:
            continue
        cur.execute("INSERT INTO Unit VALUES (?,?,?,?,1,1,?,1)",
                    (unit_id, f"{name} District Police", 5, state_unit, did))
        district_units[did] = unit_id
        lat, lng = R.DISTRICT_CENTROID[did]
        stations.append((unit_id, lat, lng, w, did))
        unit_id += 1

    # ---- Courts -------------------------------------------------------------
    court_ids = []
    for i, cname in enumerate(R.COURTS, start=1):
        cur.execute("INSERT INTO Court VALUES (?,?,1,1,1)", (i, cname))
        court_ids.append(i)

    # ---- Employees (officers) ----------------------------------------------
    emp_id = 1
    officers_by_unit = {}
    all_units = [s[0] for s in stations]
    for u in all_units:
        officers_by_unit[u] = []
        for _ in range(rng.randint(2, 4)):
            rank = rng.choice([7, 8, 9])  # Inspector / SI / ASI
            desig = 5 if rank == 7 else 6
            fn = rng.choice(R.FIRST_NAMES_M)
            cur.execute(
                "INSERT INTO Employee VALUES (?,?,?,?,?,?,?,?,1,NULL,0,?)",
                (emp_id, 1, u, rank, desig, f"KGID{100000+emp_id}",
                 fn, "1985-01-01", "2015-06-01"))
            officers_by_unit[u].append(emp_id)
            emp_id += 1

    # ---- True person population (ground truth) ------------------------------
    # Each true person gets a UNIQUE canonical name, drawn without replacement
    # from the (first, surname) space. This is deliberate: with distinct
    # canonical names, a fuzzy name match signals a spelling variant of the same
    # person rather than a coincidental namesake (which name+age alone cannot
    # disambiguate — an honest limit of the schema).
    male_combos = [(f, s) for f in R.FIRST_NAMES_M for s in R.SURNAMES]
    female_combos = [(f, s) for f in R.FIRST_NAMES_F for s in R.SURNAMES]
    rng.shuffle(male_combos)
    rng.shuffle(female_combos)
    mi = fi = 0
    persons = []
    for pid in range(1, N_TRUE_PERSONS + 1):
        gender = 1 if rng.random() < 0.88 else 2  # offenders skew male
        if gender == 1:
            f, s = male_combos[mi]; mi += 1
        else:
            f, s = female_combos[fi]; fi += 1
        name = f"{f} {s}"
        persons.append({
            "id": pid, "name": name, "gender": gender,
            "age": rng.randint(18, 55),
            "variants": R.transliteration_variants(name),
        })

    # Repeat-offender propensity as a long tail: most persons offend once or
    # twice, a minority are repeat offenders, a few are prolific. Weighted draw
    # so no single person dominates (realistic, and keeps clusters varied).
    person_weights = []
    for _p in persons:
        roll = rng.random()
        if roll < 0.74:
            person_weights.append(1)     # one-off
        elif roll < 0.94:
            person_weights.append(4)     # repeat
        else:
            person_weights.append(9)     # prolific
    # Ring members are prolific by construction
    for k in range(5):
        person_weights[k] = 11

    def pick_offender():
        return rng.choices(persons, weights=person_weights, k=1)[0]

    # ---- Planted organized ring (across 3 South-division stations) ----------
    ring = persons[:5]
    ring_stations = [stations[0][0], stations[1][0], stations[2][0]]  # Jayanagar/JPNagar/Banashankari

    subhead_weights = [s[3] for s in R.CRIME_SUBHEADS]

    # ---- Cases --------------------------------------------------------------
    case_id = 0
    accused_id = 0
    complainant_id = 0
    victim_id = 0
    arrest_id = 0
    cs_id = 0
    # One FIR register per station per year, keyed (PoliceStationID, year).
    fir_serial = {}

    for _ in range(N_CASES):
        case_id += 1

        # Ring cases: a small planted slice (~45 cases) are the organized network
        is_ring = rng.random() < 0.0085
        if is_ring:
            station = rng.choice(ring_stations)
            st = next(s for s in stations if s[0] == station)
        else:
            st = _wpick(rng, stations, [s[3] for s in stations])
            station = st[0]
        lat, lng = _jitter(rng, st[1], st[2])
        district_id = st[4]

        sub = _wpick(rng, R.CRIME_SUBHEADS, subhead_weights)
        sub_id, head_id, sub_name, _w, gravity_ch, act, section = sub
        gravity_id = 1 if gravity_ch == "H" else 2

        incident_dt = _rand_date(rng, PERIOD_START, PERIOD_END)
        # time of day: property crime skews night, others daytime
        if sub_name in ("Burglary", "Theft", "Vehicle Theft", "Chain Snatching", "Robbery"):
            hour = _wpick(rng, list(range(24)),
                          [1,1,1,1,1,1,2,3,3,3,3,3,3,3,3,4,5,6,8,9,9,8,6,3])
        else:
            hour = _wpick(rng, list(range(24)),
                          [1,1,1,1,1,2,3,4,5,6,6,7,7,6,6,6,6,6,5,4,3,2,2,1])
        incident_ts = datetime(incident_dt.year, incident_dt.month, incident_dt.day,
                               hour, rng.randint(0, 59))
        delay_days = _wpick(rng, [0, 1, 2, 3, 5, 8], [40, 25, 15, 10, 6, 4])
        info_ts = incident_ts + timedelta(hours=rng.randint(1, 12))
        reg_ts = incident_ts + timedelta(days=delay_days, hours=rng.randint(0, 12))

        # Act version: BNS for the current era, IPC for a legacy minority
        use_bns = rng.random() < 0.7
        act_code = "BNS" if use_bns else "IPC"
        sec_code = R.IPC_TO_BNS.get(section, section) if use_bns else section

        # Status + clearance
        age_days = (PERIOD_END - incident_dt).days
        if age_days < 20:
            status = _wpick(rng, [1, 2], [30, 70])
        else:
            status = _wpick(rng, [2, 3, 4], [45, 40, 15])
        # chargesheet outcome
        if status in (3, 4):
            cstype = _wpick(rng, ["A", "B", "C"], [70, 12, 18])
        else:
            cstype = None

        cat_id = _wpick(rng, [1, 2, 3, 4], [88, 5, 4, 3])
        district4 = f"{district_id:04d}"
        station4 = f"{station:04d}"
        year = incident_dt.year
        # The serial IS the FIR number: drawn from the station's register for the
        # year, so CaseNo ("serial/year" in the UI) identifies one case within a
        # station — as a real FIR number does. It is deliberately not unique
        # statewide; two stations both hold an FIR 1/2026. CrimeNo embeds the same
        # serial so the two numbers on a case can never contradict each other.
        key = (station, year)
        fir_serial[key] = fir_serial.get(key, 0) + 1
        serial = fir_serial[key]
        crime_no = f"{cat_id}{district4}{station4}{year}{serial:05d}"
        case_no = f"{year}{serial:05d}"

        officer = rng.choice(officers_by_unit[station])
        court = rng.choice(court_ids) if status >= 3 else None

        brief = _brief_facts(rng, sub_name)

        cur.execute("""INSERT INTO CaseMaster VALUES
            (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (case_id, crime_no, case_no, reg_ts.isoformat(sep=" ", timespec="minutes"),
             officer, station, cat_id, gravity_id, head_id, sub_id, status, court,
             incident_ts.isoformat(sep=" ", timespec="minutes"),
             incident_ts.isoformat(sep=" ", timespec="minutes"),
             info_ts.isoformat(sep=" ", timespec="minutes"),
             lat, lng, brief))

        # Complainant
        complainant_id += 1
        cg = 1 if rng.random() < 0.6 else 2
        cn = f"{rng.choice(R.FIRST_NAMES_M if cg==1 else R.FIRST_NAMES_F)} {rng.choice(R.SURNAMES)}"
        cur.execute("INSERT INTO ComplainantDetails VALUES (?,?,?,?,?,?,?,?)",
            (complainant_id, case_id, cn, rng.randint(20, 65),
             rng.choice(R.OCCUPATIONS)[0], rng.choice(R.RELIGIONS)[0],
             rng.choice(R.CASTES)[0], cg))

        # Victims
        for _v in range(rng.randint(1, 2)):
            victim_id += 1
            vg = rng.choice([1, 2])
            vn = f"{rng.choice(R.FIRST_NAMES_M if vg==1 else R.FIRST_NAMES_F)} {rng.choice(R.SURNAMES)}"
            cur.execute("INSERT INTO Victim VALUES (?,?,?,?,?,'0')",
                        (victim_id, case_id, vn, rng.randint(18, 70), vg))

        # Accused — drawn from true persons, recorded as a name variant
        if is_ring:
            chosen = rng.sample(ring, k=rng.randint(2, 3))
        else:
            n_acc = _wpick(rng, [1, 2, 3], [70, 22, 8])
            chosen = [pick_offender() for _ in range(n_acc)]
            # de-dup by person id within a case
            seen = set(); uniq = []
            for p in chosen:
                if p["id"] not in seen:
                    seen.add(p["id"]); uniq.append(p)
            chosen = uniq

        for idx, person in enumerate(chosen, start=1):
            accused_id += 1
            recorded = rng.choice(person["variants"])
            age_noise = person["age"] + rng.randint(-2, 2)
            cur.execute("INSERT INTO Accused VALUES (?,?,?,?,?,?)",
                        (accused_id, case_id, recorded, age_noise,
                         person["gender"], f"A{idx}"))
            cur.execute("INSERT INTO GroundTruthIdentity VALUES (?,?)",
                        (accused_id, person["id"]))

            # Arrest for a fraction
            if rng.random() < 0.45:
                arrest_id += 1
                io = rng.choice(officers_by_unit[station])
                adate = (reg_ts + timedelta(days=rng.randint(1, 30))).date().isoformat()
                cur.execute("""INSERT INTO ArrestSurrender VALUES
                    (?,?,?,?,1,?,?,?,?,?,1,0)""",
                    (arrest_id, case_id, 1, adate, district_id, station, io,
                     court, accused_id))

        # Act-section association
        cur.execute("INSERT INTO ActSectionAssociation VALUES (?,?,?,1,1)",
                    (case_id, act_code, sec_code))

        # Chargesheet
        if cstype:
            cs_id += 1
            csdate = (reg_ts + timedelta(days=rng.randint(20, 90))).date().isoformat()
            cur.execute("INSERT INTO ChargesheetDetails VALUES (?,?,?,?,?)",
                        (cs_id, case_id, csdate, cstype, officer))

    conn.commit()
    return {
        "cases": case_id, "accused": accused_id, "true_persons": N_TRUE_PERSONS,
        "units": unit_id - 1, "employees": emp_id - 1,
        "ring_persons": [p["id"] for p in ring],
    }


def _brief_facts(rng, sub_name):
    mo = {
        "Theft": "Unknown accused committed theft of belongings from the premises.",
        "Robbery": "Accused threatened the complainant with a weapon and robbed valuables.",
        "Burglary": "Accused broke open the door during night hours and committed burglary.",
        "Vehicle Theft": "Two-wheeler parked outside was found stolen.",
        "Chain Snatching": "Accused on a motorcycle snatched the gold chain and fled.",
        "Assault": "Accused assaulted the complainant following a dispute.",
        "Hurt": "Accused caused hurt to the complainant during an altercation.",
        "Murder": "Deceased was found with injuries; investigation under progress.",
        "Attempt to Murder": "Accused attempted to cause death of the complainant.",
        "Harassment": "Complainant reported harassment by the accused.",
        "Dowry Offences": "Complaint of dowry harassment lodged.",
        "Cheating": "Accused cheated the complainant on a false promise.",
        "Criminal Breach of Trust": "Entrusted property was misappropriated by the accused.",
        "Public Nuisance": "Public nuisance reported in the locality.",
        "Trespass": "Accused trespassed into the complainant's property.",
    }
    return mo.get(sub_name, "Investigation in progress.")
