import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiGet } from "./api";

/**
 * Session context — the signed-in officer, their scope, and the active date
 * range. Fetched once from /api/meta and shared across the shell (sidebar,
 * top bar) and pages, so identity/scope isn't hardcoded per component.
 */

export type Officer = {
  name: string;
  rank: string;
  scopeLabel: string;
  breadcrumb: string[];
  notifications: number;
};

type Meta = { officer: Officer; dateRange: string };

const FALLBACK: Meta = {
  officer: {
    name: "R. Sharath Kumar, IPS",
    rank: "ASP",
    scopeLabel: "Bengaluru South Division",
    breadcrumb: ["Karnataka", "Bengaluru City", "Bengaluru South Division"],
    notifications: 3,
  },
  dateRange: "—",
};

const MetaContext = createContext<Meta>(FALLBACK);

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta>(FALLBACK);
  useEffect(() => {
    apiGet<Meta>("/meta")
      .then(setMeta)
      .catch(() => setMeta(FALLBACK));
  }, []);
  return <MetaContext.Provider value={meta}>{children}</MetaContext.Provider>;
}

export const useMeta = () => useContext(MetaContext);
