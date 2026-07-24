import { useEffect, useState } from "react";

/**
 * Tiny API layer. The backend is same-origin under /api (Vite proxies to the
 * Node server in dev; the Catalyst API Gateway serves it in production).
 */

// Three modes:
//  - CATALYST_API set  -> hit a live Catalyst API (Functions/AppSail) at that URL
//  - production build   -> read the static snapshot under <base>api/<path>.json
//  - dev                -> Vite proxies /api/<path> to the local Node server
// BASE_URL is "/" in dev and "/app/" in the Catalyst deploy, so static paths
// resolve correctly under the hosting subpath.
const STATIC = import.meta.env.PROD;
const BASE = import.meta.env.BASE_URL;
const CATALYST_API = import.meta.env.VITE_CATALYST_API_URL || "";

export async function apiGet<T>(path: string): Promise<T> {
  const url = CATALYST_API
    ? `${CATALYST_API.replace(/\/$/, "")}/api${path}`
    : STATIC
      ? `${BASE}api${path}.json`
      : `${BASE}api${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

/** Fetch-on-mount hook with loading + error state. */
export function useApi<T>(path: string): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let live = true;
    setState({ data: null, loading: true, error: null });
    apiGet<T>(path)
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((e) =>
        live && setState({ data: null, loading: false, error: String(e.message || e) })
      );
    return () => {
      live = false;
    };
  }, [path]);

  return state;
}

// Dev: dynamic CSV from the server. Prod/static: pre-exported CSV under <base>.
export const downloadUrl = (kind: string) =>
  CATALYST_API
    ? `${CATALYST_API.replace(/\/$/, "")}/api/download/${kind}.csv`
    : STATIC
      ? `${BASE}api/download/${kind}.csv`
      : `/api/report/download?kind=${kind}`;
