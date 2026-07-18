import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CommandView } from "./routes/CommandView";
import { MapHotspots } from "./routes/MapHotspots";
import { PersonNetwork } from "./routes/PersonNetwork";
import { TrendsAlerts } from "./routes/TrendsAlerts";
import { CaseDetails } from "./routes/CaseDetails";
import { Login } from "./routes/Login";

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
