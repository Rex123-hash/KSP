/**
 * Static export: run the API in-process, fetch every endpoint, and write the
 * responses as static files into client/public/api/. The deployed SPA reads
 * these directly from Catalyst Web Client Hosting — no server-side runtime,
 * no native modules, no Data Store rewrite. The data is deterministic, so a
 * static snapshot is faithful.
 *
 * Run:  node export-static.mjs   (after the pipeline has built the DB)
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "client", "public", "api");
const PORT = 4199;
const BASE = `http://localhost:${PORT}/api`;

// GET endpoints -> <path>.json
const JSON_ENDPOINTS = [
  "meta", "kpis", "crime-heads", "hotspots", "zones",
  "command", "map", "trends", "resolution",
  "persons/featured", "cases/featured", "reports",
];

// Download kinds -> download/<kind>.csv
const CSV_KINDS = ["summary", "crime-heads", "zones", "trend"];

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const server = app.listen(PORT);
  await new Promise((r) => server.once("listening", r));

  let count = 0;
  for (const ep of JSON_ENDPOINTS) {
    const res = await fetch(`${BASE}/${ep}`);
    if (!res.ok) throw new Error(`${ep} -> ${res.status}`);
    const body = await res.text();
    const file = join(OUT, `${ep}.json`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body, "utf8");
    count++;
  }

  await mkdir(join(OUT, "download"), { recursive: true });
  for (const kind of CSV_KINDS) {
    const res = await fetch(`${BASE}/report/download?kind=${kind}`);
    if (!res.ok) throw new Error(`download ${kind} -> ${res.status}`);
    const body = await res.text();
    await writeFile(join(OUT, "download", `${kind}.csv`), body, "utf8");
    count++;
  }

  server.close();
  console.log(`Exported ${count} static files -> client/public/api/`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
