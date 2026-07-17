import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CommandView } from "./routes/CommandView";
import { Login } from "./routes/Login";
import { Placeholder } from "./routes/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppShell />}>
          <Route index element={<CommandView />} />

          <Route
            path="/map"
            element={
              <Placeholder
                title="Map & Hotspots"
                icon="map-pin"
                body="Full-screen geospatial view with district drilldown to station level, time-of-day layering for spatiotemporal clusters, and crime-head filtering."
              />
            }
          />

          <Route
            path="/network"
            element={
              <Placeholder
                title="Person & Network"
                icon="network"
                body="Resolves accused records into people across cases, then maps the associations between them. The database has no person ID — this screen is where that gets solved, and shown."
              />
            }
          />

          <Route
            path="/trends"
            element={
              <Placeholder
                title="Trends & Alerts"
                icon="alert"
                body="Spike detection against district and crime-head baselines, anomaly call-outs, and seasonality."
              />
            }
          />

          <Route
            path="/cases"
            element={
              <Placeholder
                title="Case / FIR Details"
                icon="file-text"
                body="The evidence layer: parties, acts and sections, status, court, chargesheet outcome, and timeline for a single FIR."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
