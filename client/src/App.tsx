import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CommandView } from "./routes/CommandView";
import { MapHotspots } from "./routes/MapHotspots";
import { PersonNetwork } from "./routes/PersonNetwork";
import { Login } from "./routes/Login";
import { Placeholder } from "./routes/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppShell />}>
          <Route index element={<CommandView />} />

          <Route path="/map" element={<MapHotspots />} />

          <Route path="/network" element={<PersonNetwork />} />

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
