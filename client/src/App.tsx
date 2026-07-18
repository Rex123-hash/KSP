import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CommandView } from "./routes/CommandView";
import { MapHotspots } from "./routes/MapHotspots";
import { PersonNetwork } from "./routes/PersonNetwork";
import { TrendsAlerts } from "./routes/TrendsAlerts";
import { CaseDetails } from "./routes/CaseDetails";
import { Reports } from "./routes/Reports";
import { Settings } from "./routes/Settings";
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

          <Route path="/trends" element={<TrendsAlerts />} />

          <Route path="/cases" element={<CaseDetails />} />

          <Route path="/reports" element={<Reports />} />

          <Route
            path="/downloads"
            element={
              <Placeholder
                title="Downloads"
                icon="arrow-down"
                body="Exported reports, case bundles, and generated PDFs collect here for retrieval. Wired once the export pipeline lands."
              />
            }
          />

          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
