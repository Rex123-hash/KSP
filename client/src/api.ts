import { useEffect, useState } from "react";

/**
 * Tiny API layer. The backend is same-origin under /api (Vite proxies to the
 * Node server in dev; the Catalyst API Gateway serves it in production).
 */

// In dev, Vite proxies /api/<path> to the live Node server. In the production
// build (deployed to Catalyst Web Client Hosting) there is no server, so we
// read the pre-exported static snapshot at /api/<path>.json instead.
const STATIC = import.meta.env.PROD;

export async function apiGet<T>(path: string): Promise<T> {
  const url = STATIC ? `/api${path}.json` : `/api${path}`;
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

// Dev: dynamic CSV from the server. Prod: pre-exported static CSV file.
export const downloadUrl = (kind: string) =>
  STATIC ? `/api/download/${kind}.csv` : `/api/report/download?kind=${kind}`;
