"""
Build the whole database end to end:
  schema -> generate synthetic data -> resolve identities -> precompute analytics

Run:  python build.py            (writes ../data/ksp.db)
      python build.py --out X    (custom path)

Deterministic — same DB every run.
"""

import argparse
import os
import sqlite3
import sys
import time

import generate
import resolve
import precompute

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.join(HERE, "..", "data", "generated", "ksp.db")
SCHEMA = os.path.join(HERE, "schema.sql")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if os.path.exists(out):
        os.remove(out)

    conn = sqlite3.connect(out)
    with open(SCHEMA, encoding="utf-8") as f:
        conn.executescript(f.read())

    t0 = time.time()
    print("1/3  generating synthetic FIRs against the schema ...")
    g = generate.build(conn)
    print(f"     cases={g['cases']:,}  accused={g['accused']:,}  "
          f"true_persons={g['true_persons']:,}  units={g['units']}  "
          f"officers={g['employees']}")

    print("2/3  resolving person identities ...")
    r = resolve.resolve(conn)
    print(f"     resolved={r['resolved_persons']:,} from {r['true_persons']:,} true "
          f"persons  |  precision={r['precision']:.3f}  recall={r['recall']:.3f}  "
          f"f1={r['f1']:.3f}")

    print("3/3  precomputing analytics ...")
    p = precompute.precompute(conn)
    print(f"     kpis={p['kpis']}  zones={p['zones']}  "
          f"hotspot_points={p['hotspot_points']:,}  period={p['period'][0]}..{p['period'][1]}")

    conn.close()
    print(f"\nDONE in {time.time()-t0:.1f}s  ->  {out}")


if __name__ == "__main__":
    sys.path.insert(0, HERE)
    main()
