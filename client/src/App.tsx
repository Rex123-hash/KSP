import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MetaProvider } from "./meta";
import { AppShell } from "./components/AppShell";
import { CommandView } from "./routes/CommandView";
import { MapHotspots } from "./routes/MapHotspots";
import { PersonNetwork } from "./routes/PersonNetwork";
import { TrendsAlerts } from "./routes/TrendsAlerts";
import { CaseDetails } from "./routes/CaseDetails";
import { Reports } from "./routes/Reports";
import { Downloads } from "./routes/Downloads";
import { Settings } from "./routes/Settings";
import { Login } from "./routes/Login";

export default function App() {
  return (
    <BrowserRouter>
      <MetaProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppShell />}>
          <Route index element={<CommandView />} />

          <Route path="/map" element={<MapHotspots />} />

          <Route path="/network" element={<PersonNetwork />} />

          <Route path="/trends" element={<TrendsAlerts />} />

          <Route path="/cases" element={<CaseDetails />} />

          <Route path="/reports" element={<Reports />} />

          <Route path="/downloads" element={<Downloads />} />

          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      </MetaProvider>
    </BrowserRouter>
  );
}
