/**
 * How server.js behaves when launched vs imported.  Run: node --test server/
 *
 * server.js does double duty: `node server.js` must serve the API, while
 * export-static.mjs imports the same module and runs its own listener. A guard
 * at the bottom of the file separates the two, and it has to be right on both
 * POSIX and Windows — a guard that never matches fails silently, exiting 0
 * without opening a port or logging anything.
 *
 * These spawn real subprocesses because that is the only place the distinction
 * exists: `process.argv[1]` inside this test file says nothing about it.
 */

import test from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile, rm } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = join(__dirname, "server.js");
const STARTUP_TIMEOUT_MS = 20000;

/** An unused port, so the test never collides with a running dev server. */
const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.once("error", reject);
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Poll until the API answers, or give up. Returns the parsed health payload. */
async function waitForHealth(port, child) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `server exited with code ${child.exitCode} before serving a request; ` +
          `stdout: ${JSON.stringify(child.stdoutText)} stderr: ${JSON.stringify(child.stderrText)}`
      );
    }
    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      if (res.ok) return res.json();
    } catch {
      // not up yet
    }
    await sleep(150);
  }
  throw new Error(`server did not answer within ${STARTUP_TIMEOUT_MS}ms`);
}

function launch(file, port) {
  const child = spawn(process.execPath, [file], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(port) },
  });
  child.stdoutText = "";
  child.stderrText = "";
  child.stdout.on("data", (d) => (child.stdoutText += d));
  child.stderr.on("data", (d) => (child.stderrText += d));
  return child;
}

test("`node server.js` starts listening and serves the API", async () => {
  const port = await freePort();
  const child = launch(SERVER, port);
  try {
    const health = await waitForHealth(port, child);
    assert.strictEqual(health.ok, true);
    assert.ok(health.cases > 0, "health should report the case count");
    assert.match(child.stdoutText, new RegExp(`KSP API on http://localhost:${port}`));
  } finally {
    child.kill();
  }
});

test("importing server.js does not open a listener, so the static exporter can drive it", async () => {
  // export-static.mjs imports { app } and calls app.listen() itself. If the
  // module listened on import, that process would never exit on its own.
  const probe = join(__dirname, `.import-probe.${process.pid}.mjs`);
  await writeFile(
    probe,
    'import { app } from "./server.js";\n' +
      'if (typeof app.listen !== "function") { console.error("no app export"); process.exit(3); }\n' +
      'console.log("imported");\n'
  );
  try {
    const child = launch(probe, await freePort());
    const code = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("importing server.js kept the process alive — it opened a listener"));
      }, STARTUP_TIMEOUT_MS);
      child.once("exit", (c) => {
        clearTimeout(timer);
        resolve(c);
      });
      child.once("error", reject);
    });
    assert.strictEqual(code, 0, `import probe failed: ${child.stderrText}`);
    assert.match(child.stdoutText, /imported/);
    assert.doesNotMatch(child.stdoutText, /KSP API on/, "import must not start the server");
  } finally {
    await rm(probe, { force: true });
  }
});
