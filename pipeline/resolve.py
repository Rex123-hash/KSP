"""
Entity resolution — infer person identity across FIRs.

The schema has no person key: each Accused row is bound to one case. The same
human recurs under transliteration variants of their name. This reconstructs
persons by blocking + fuzzy name match + age consistency, then measures itself
against the generator's ground truth (precision / recall / F1).

Pure stdlib. Jaro-Winkler is implemented locally to avoid a dependency.
"""

import re
from collections import Counter, defaultdict

NAME_SIM_THRESHOLD = 0.90
AGE_TOLERANCE = 3


def _norm(name):
    n = name.lower().strip()
    n = re.sub(r"[.\-]", " ", n)
    n = re.sub(r"\s+", " ", n)
    return n


def _key(name):
    """Space-stripped matching key so 'Ravi Kumar' and 'Ravikumar' align."""
    return re.sub(r"[^a-z]", "", name.lower())


def name_similarity(ka, kb):
    """
    Similarity that requires BOTH the first-name region and the surname region
    to agree. Plain Jaro-Winkler over-weights the shared prefix, so two distinct
    people with the same first name ('Venkatesh Nayak' vs 'Venkatesh Achar')
    score falsely high. Taking the min of forward JW (prefix-weighted) and
    reverse JW (suffix-weighted) forces the surname to match too.
    """
    fwd = jaro_winkler(ka, kb)
    rev = jaro_winkler(ka[::-1], kb[::-1])
    return min(fwd, rev)


def jaro(s1, s2):
    if s1 == s2:
        return 1.0
    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
    md = max(len1, len2) // 2 - 1
    md = max(md, 0)
    s1m = [False] * len1
    s2m = [False] * len2
    matches = 0
    for i in range(len1):
        lo = max(0, i - md)
        hi = min(i + md + 1, len2)
        for j in range(lo, hi):
            if not s2m[j] and s1[i] == s2[j]:
                s1m[i] = s2m[j] = True
                matches += 1
                break
    if matches == 0:
        return 0.0
    t = 0
    k = 0
    for i in range(len1):
        if s1m[i]:
            while not s2m[k]:
                k += 1
            if s1[i] != s2[k]:
                t += 1
            k += 1
    t /= 2
    return (matches / len1 + matches / len2 + (matches - t) / matches) / 3


def jaro_winkler(s1, s2, p=0.1):
    j = jaro(s1, s2)
    prefix = 0
    for a, b in zip(s1, s2):
        if a == b:
            prefix += 1
        else:
            break
        if prefix == 4:
            break
    return j + prefix * p * (1 - j)


class _UF:
    def __init__(self, n):
        self.p = list(range(n))

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[ra] = rb


def resolve(conn):
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID FROM Accused"
    ).fetchall()

    idx = {r[0]: i for i, r in enumerate(rows)}
    norm = [_norm(r[2]) for r in rows]
    keys = [_key(r[2]) for r in rows]

    uf = _UF(len(rows))

    # Blocking: same gender + first two characters of the matching key. Variants
    # preserve the leading characters (ravikumar / ravikumara all start "ra"),
    # so true variants share a block while blocks stay small.
    blocks = defaultdict(list)
    for i, r in enumerate(rows):
        blocks[(r[4], keys[i][:2])].append(i)

    pair_sims = []  # (i, j, sim) kept for confidence scoring
    for members in blocks.values():
        m = len(members)
        for a in range(m):
            i = members[a]
            for b in range(a + 1, m):
                j = members[b]
                if abs((rows[i][3] or 0) - (rows[j][3] or 0)) > AGE_TOLERANCE:
                    continue
                sim = name_similarity(keys[i], keys[j])
                if sim >= NAME_SIM_THRESHOLD:
                    uf.union(i, j)
                    pair_sims.append((i, j, sim))

    # Clusters
    clusters = defaultdict(list)
    for i in range(len(rows)):
        clusters[uf.find(i)].append(i)

    # Confidence per cluster = mean intra-cluster pair similarity (cohesion)
    cluster_sims = defaultdict(list)
    for i, j, sim in pair_sims:
        cluster_sims[uf.find(i)].append(sim)

    # ---- Write ResolvedPerson + PersonCaseLink ------------------------------
    cur.execute("DELETE FROM ResolvedPerson")
    cur.execute("DELETE FROM PersonCaseLink")
    cur.execute("DELETE FROM PersonAssociation")

    rp_id = 0
    accused_to_person = {}
    person_cases = defaultdict(set)
    person_members = {}
    for root, members in clusters.items():
        rp_id += 1
        names = [rows[i][2] for i in members]
        # Canonical = the cleanest display form: prefer a spaced name without the
        # doubled-a transliteration artifact, then the most frequent among those.
        freq = Counter(names)

        def clean_score(n):
            s = 0
            if " " in n:
                s += 3
            if not re.search(r"a{2,}$", n):
                s += 2
            if not n.endswith("a"):
                s += 1
            return (s, freq[n])

        canonical = max(names, key=clean_score)
        genders = [rows[i][4] for i in members]
        ages = [rows[i][3] for i in members if rows[i][3]]
        sims = cluster_sims.get(root, [])
        confidence = round(sum(sims) / len(sims), 3) if sims else 1.0
        age_est = round(sum(ages) / len(ages)) if ages else None
        cur.execute(
            "INSERT INTO ResolvedPerson VALUES (?,?,?,?,?,?,?)",
            (rp_id, canonical, Counter(genders).most_common(1)[0][0],
             age_est, len(members), 0, confidence))
        cn = _key(canonical)
        person_members[rp_id] = members
        for i in members:
            accused_to_person[rows[i][0]] = rp_id
            person_cases[rp_id].add(rows[i][1])
            link_conf = round(name_similarity(keys[i], cn), 3)
            cur.execute(
                "INSERT INTO PersonCaseLink VALUES (?,?,?,?,?)",
                (rp_id, rows[i][0], rows[i][1], rows[i][2], link_conf))

    # Risk score: repeat count + heinous involvement, scaled 0..100
    heinous_cases = set(
        r[0] for r in cur.execute(
            "SELECT CaseMasterID FROM CaseMaster WHERE GravityOffenceID=1").fetchall())
    for rp, cases in person_cases.items():
        heinous = len(cases & heinous_cases)
        raw = len(cases) * 12 + heinous * 10
        cur.execute("UPDATE ResolvedPerson SET RiskScore=?, CaseCount=? WHERE ResolvedPersonID=?",
                    (min(99, raw), len(cases), rp))

    # ---- Associations: co-accused in the same case --------------------------
    case_persons = defaultdict(set)
    for rp, cases in person_cases.items():
        for c in cases:
            case_persons[c].add(rp)
    assoc = defaultdict(lambda: {"shared": 0})
    for c, ppl in case_persons.items():
        ppl = sorted(ppl)
        for a in range(len(ppl)):
            for b in range(a + 1, len(ppl)):
                assoc[(ppl[a], ppl[b])]["shared"] += 1
    for (a, b), d in assoc.items():
        conf = round(min(0.95, 0.55 + 0.12 * d["shared"]), 2)
        cur.execute("INSERT INTO PersonAssociation VALUES (?,?,?,?,?)",
                    (a, b, conf, "co-accused", d["shared"]))

    # ---- Metrics vs ground truth (pairwise) ---------------------------------
    gt = dict(cur.execute("SELECT AccusedMasterID, TruePersonID FROM GroundTruthIdentity").fetchall())

    def pairs_within(groups):
        return sum(n * (n - 1) // 2 for n in groups.values())

    # predicted positive: pairs within each resolved cluster
    pred_groups = Counter(accused_to_person.values())
    predicted_pos = pairs_within(pred_groups)

    # actual positive: pairs within each true person
    true_groups = Counter(gt.values())
    actual_pos = pairs_within(true_groups)

    # true positive: within each cluster, pairs that share a true id
    tp = 0
    for members in person_members.values():
        true_counts = Counter(gt[rows[i][0]] for i in members)
        tp += pairs_within(true_counts)

    precision = tp / predicted_pos if predicted_pos else 0.0
    recall = tp / actual_pos if actual_pos else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0

    cur.execute("DELETE FROM ResolutionMetrics")
    cur.execute("INSERT INTO ResolutionMetrics VALUES (1,?,?,?,?,?,?)",
                (round(precision, 4), round(recall, 4), round(f1, 4),
                 predicted_pos, len(true_groups), rp_id))

    conn.commit()
    return {
        "resolved_persons": rp_id,
        "true_persons": len(true_groups),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }
