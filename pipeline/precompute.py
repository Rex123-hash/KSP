"""
Analytics precompute — turns the case data into the flat tables the dashboard
reads. Everything here is computed from CaseMaster / ChargesheetDetails, not
hand-set: KPIs, hotspot points, crime-head shares, the trend line, and per-zone
volume + a simple predictive risk score.
"""

import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta

import reference_data as R


def _d(s):
    return datetime.fromisoformat(s)


def precompute(conn):
    cur = conn.cursor()

    cases = cur.execute("""
        SELECT cm.CaseMasterID, cm.CrimeRegisteredDate, cm.IncidentFromDate,
               cm.InfoReceivedPSDate, cm.latitude, cm.longitude, cm.PoliceStationID,
               cm.CrimeMajorHeadID, cm.CrimeMinorHeadID, cm.CaseStatusID,
               cs.cstype
        FROM CaseMaster cm
        LEFT JOIN ChargesheetDetails cs ON cs.CaseMasterID = cm.CaseMasterID
    """).fetchall()

    total = len(cases)
    reg_dates = [_d(c[1]) for c in cases]
    period_end = max(reg_dates)
    period_start = min(reg_dates)

    cur_start = period_end - timedelta(days=60)
    prev_start = period_end - timedelta(days=120)

    def in_window(dt, start, end):
        return start <= dt <= end

    cur_cases = [c for c, d in zip(cases, reg_dates) if in_window(d, cur_start, period_end)]
    prev_cases = [c for c, d in zip(cases, reg_dates) if in_window(d, prev_start, cur_start)]

    # ---- KPIs ---------------------------------------------------------------
    def clearance(rows):
        # Detection rate: chargesheeted out of cases that reached a disposition
        # (A/B/C). Dividing by total would understate it, since recent cases are
        # still under investigation and not yet disposed.
        disposed = [r for r in rows if r[10]]
        a = sum(1 for r in rows if r[10] == "A")
        return (a / len(disposed) * 100) if disposed else 0.0

    def undetected(rows):
        return sum(1 for r in rows if r[10] == "C")

    def avg_delay(rows):
        ds = []
        for r in rows:
            try:
                ds.append((_d(r[1]) - _d(r[2])).total_seconds() / 86400)
            except Exception:
                pass
        return sum(ds) / len(ds) if ds else 0.0

    def weekly_spark(rows, weeks=9):
        buckets = [0] * weeks
        for r in rows:
            d = _d(r[1])
            wk = (period_end - d).days // 7
            if 0 <= wk < weeks:
                buckets[weeks - 1 - wk] += 1
        return buckets

    def pct_delta(cur_v, prev_v):
        if not prev_v:
            return 0.0
        return (cur_v - prev_v) / prev_v * 100

    kpis = []

    cur_total, prev_total = len(cur_cases), len(prev_cases)
    d = pct_delta(cur_total, prev_total)
    kpis.append(("total-cases", "Total Cases", f"{cur_total:,}",
                 f"{abs(d):.1f}%", "up" if d >= 0 else "down", "good",
                 weekly_spark(cur_cases)))

    cr_cur, cr_prev = clearance(cur_cases), clearance(prev_cases)
    d = cr_cur - cr_prev
    kpis.append(("clearance-rate", "Clearance Rate", f"{cr_cur:.1f}%",
                 f"{abs(d):.1f}%", "up" if d >= 0 else "down", "good",
                 weekly_spark(cur_cases)))

    ud_cur, ud_prev = undetected(cur_cases), undetected(prev_cases)
    d = pct_delta(ud_cur, ud_prev)
    kpis.append(("cases-undetected", "Cases Undetected", f"{ud_cur:,}",
                 f"{abs(d):.1f}%", "down" if d <= 0 else "up",
                 "good" if d <= 0 else "bad",
                 weekly_spark(cur_cases)))

    dl_cur, dl_prev = avg_delay(cur_cases), avg_delay(prev_cases)
    d = dl_cur - dl_prev
    kpis.append(("reporting-delay", "Avg. Reporting Delay", f"{dl_cur:.1f} days",
                 f"{abs(d):.1f}", "down" if d <= 0 else "up",
                 "good" if d <= 0 else "bad", weekly_spark(cur_cases)))

    # Alerts computed below (needs zone spikes) — placeholder, filled after
    cur.execute("DELETE FROM KpiSnapshot")
    for k in kpis:
        cur.execute("INSERT INTO KpiSnapshot VALUES (?,?,?,?,?,?,?)",
                    (k[0], k[1], k[2], k[3], k[4], k[5], json.dumps(k[6])))

    # ---- Crime-head shares --------------------------------------------------
    head_names = {hid: g for hid, g in R.CRIME_HEADS}
    head_counts = Counter(c[7] for c in cases)
    tones = ["var(--brand-green-800)", "var(--brand-green-600)", "var(--seq-400)",
             "var(--brand-gold-500)", "#5b53b8", "var(--line-grid)"]
    cur.execute("DELETE FROM CrimeHeadShare")
    ordered = head_counts.most_common()
    for seq, (hid, cnt) in enumerate(ordered):
        pct = round(cnt / total * 100, 1)
        cur.execute("INSERT INTO CrimeHeadShare VALUES (?,?,?,?)",
                    (head_names.get(hid, "Other"), pct, cnt, seq))

    # ---- Trend line: last 21 weeks, current vs previous-year-ish window -----
    weeks = 21
    cur_line = [0] * weeks
    prev_line = [0] * weeks
    for c, dt in zip(cases, reg_dates):
        wk = (period_end - dt).days // 7
        if 0 <= wk < weeks:
            cur_line[weeks - 1 - wk] += 1
        elif weeks <= wk < weeks * 2:
            prev_line[weeks * 2 - 1 - wk] += 1
    cur.execute("DELETE FROM TrendPoint")
    for i in range(weeks):
        label = (period_end - timedelta(days=(weeks - 1 - i) * 7)).strftime("%d %b")
        cur.execute("INSERT INTO TrendPoint VALUES (?,?,?,?)",
                    (i, label, cur_line[i], prev_line[i]))

    # ---- Zones (Bengaluru stations) + risk ----------------------------------
    unit_names = dict(cur.execute("SELECT UnitID, UnitName FROM Unit").fetchall())
    blr_station_ids = set(
        r[0] for r in cur.execute(
            "SELECT UnitID FROM Unit WHERE TypeID=4").fetchall())
    zone_counts = Counter(c[6] for c in cases if c[6] in blr_station_ids)

    # recent-vs-baseline spike per zone for risk %
    def zone_recent(station):
        recent = sum(1 for c, d in zip(cases, reg_dates)
                     if c[6] == station and (period_end - d).days <= 14)
        baseline = sum(1 for c, d in zip(cases, reg_dates)
                       if c[6] == station and 14 < (period_end - d).days <= 70) / 4
        return recent, baseline

    zone_rows = []
    for station, cnt in zone_counts.most_common():
        recent, baseline = zone_recent(station)
        spike = (recent - baseline) / baseline * 100 if baseline else 0
        risk_pct = max(10, min(95, int(40 + spike)))
        level = "High" if risk_pct >= 65 else "Medium" if risk_pct >= 40 else "Low"
        zone_rows.append((unit_names.get(station, f"Unit {station}"), cnt, risk_pct, level))

    total_zone = sum(z[1] for z in zone_rows) or 1
    cur.execute("DELETE FROM ZoneStat")
    for name, cnt, risk_pct, level in zone_rows:
        cur.execute("INSERT INTO ZoneStat VALUES (?,?,?,?,?)",
                    (name, cnt, round(cnt / total_zone * 100, 1), level, risk_pct))

    # active alerts = zones at High/Medium risk
    active_alerts = sum(1 for z in zone_rows if z[3] in ("High", "Medium"))
    cur.execute("INSERT INTO KpiSnapshot VALUES (?,?,?,?,?,?,?)",
                ("active-alerts", "Active Alerts", str(active_alerts),
                 str(sum(1 for z in zone_rows if z[3] == "High")), "up", "bad",
                 json.dumps(weekly_spark(cur_cases))))

    # ---- Hotspot points -----------------------------------------------------
    cur.execute("DELETE FROM HotspotPoint")
    hid = 0
    for c in cases:
        if c[4] is None:
            continue
        hid += 1
        hour = _d(c[2]).hour
        cur.execute("INSERT INTO HotspotPoint VALUES (?,?,?,?,?,?)",
                    (hid, c[4], c[5], 1.0, hour, c[7]))

    conn.commit()
    return {
        "kpis": len(kpis) + 1,
        "zones": len(zone_rows),
        "hotspot_points": hid,
        "period": [period_start.date().isoformat(), period_end.date().isoformat()],
    }
