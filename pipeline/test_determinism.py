"""
The build must be byte-identical on every run.  Run: python -m unittest -v

generate.py promises "Deterministic (fixed seed): the dataset is identical on
every build, so the demo never shifts under the presenters." A seeded Random is
not enough on its own: anything the generator draws from must also be ordered
the same way every run. Iterating a set of strings is not — CPython salts string
hashing per process (PYTHONHASHSEED), so set order changes between runs even
though the contents do not. A single-process test cannot see that, so these
tests compare across subprocesses started with different hash seeds.
"""

import os
import subprocess
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SEEDS = ("0", "1", "2", "12345")


def _run_under_seed(seed, snippet):
    """Evaluate a snippet in a fresh interpreter with a given hash seed."""
    env = dict(os.environ, PYTHONHASHSEED=seed, PYTHONPATH=HERE)
    out = subprocess.run(
        [sys.executable, "-c", snippet],
        cwd=HERE, env=env, capture_output=True, text=True,
    )
    if out.returncode != 0:
        raise AssertionError(f"subprocess failed under PYTHONHASHSEED={seed}:\n{out.stderr}")
    return out.stdout.strip()


class TransliterationVariantsAreOrdered(unittest.TestCase):
    def test_variant_order_does_not_depend_on_the_hash_seed(self):
        # The generator picks a recorded spelling with rng.choice(variants), so a
        # run-dependent ORDER silently changes which name lands in every Accused
        # row — and with it the whole entity-resolution result.
        snippet = (
            "import reference_data as R;"
            "print('|'.join(R.transliteration_variants('Ravi Kumar')));"
            "print('|'.join(R.transliteration_variants('Lakshmi Gowda')))"
        )
        results = {seed: _run_under_seed(seed, snippet) for seed in SEEDS}
        distinct = set(results.values())
        self.assertEqual(
            len(distinct), 1,
            "transliteration_variants() ordering varies with PYTHONHASHSEED:\n"
            + "\n".join(f"  seed {s}: {r}" for s, r in results.items()),
        )

    def test_variants_are_unique_and_non_empty(self):
        import reference_data as R

        for name in ("Ravi Kumar", "Lakshmi Gowda", "Shanthappa Naik", "Anand"):
            variants = R.transliteration_variants(name)
            self.assertIn(name, variants, f"{name} should include its own canonical form")
            self.assertEqual(len(variants), len(set(variants)), f"{name} produced duplicates")
            self.assertTrue(all(v.strip() for v in variants))


class GeneratedDataIsReproducible(unittest.TestCase):
    def test_two_builds_under_different_hash_seeds_agree(self):
        # The end-to-end guarantee: same seed in, same database out. Compares the
        # fingerprints that any run-order drift would disturb — the recorded
        # accused names, the case numbering, and the resolution outcome.
        snippet = (
            "import os, sqlite3, tempfile, hashlib, build, sys;"
            "out = os.path.join(tempfile.mkdtemp(), 'k.db');"
            "sys.argv = ['build.py', '--out', out];"
            "f = open(os.devnull, 'w'); real = sys.stdout; sys.stdout = f;"
            "build.main();"
            "sys.stdout = real;"
            "c = sqlite3.connect(out);"
            "h = lambda q: hashlib.sha256(repr(c.execute(q).fetchall()).encode()).hexdigest()[:16];"
            "print('accused', h('SELECT AccusedMasterID, AccusedName, AgeYear FROM Accused ORDER BY AccusedMasterID'));"
            "print('cases  ', h('SELECT CaseMasterID, CrimeNo, CaseNo, PoliceStationID FROM CaseMaster ORDER BY CaseMasterID'));"
            "print('persons', h('SELECT ResolvedPersonID, CanonicalName, CaseCount, Confidence FROM ResolvedPerson ORDER BY ResolvedPersonID'))"
        )
        results = {seed: _run_under_seed(seed, snippet) for seed in ("0", "1")}
        self.assertEqual(
            results["0"], results["1"],
            "a rebuild under a different hash seed produced different data:\n"
            + "\n".join(f"  seed {s}:\n{r}" for s, r in results.items()),
        )


if __name__ == "__main__":
    unittest.main()
