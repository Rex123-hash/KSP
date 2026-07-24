import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
app.use(cors());
app.use(express.json());
const root = path.dirname(fileURLToPath(import.meta.url));
const data = path.join(root, "data");

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "ksp-catalyst-api", provider: "Zoho Catalyst AppSail" }));
app.use("/api", express.static(data, { extensions: ["json"] }));
app.use((_req, res) => res.status(404).json({ error: "endpoint not found" }));

const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000;
app.listen(port, "0.0.0.0", () => console.log(`KSP Catalyst API listening on ${port}`));
