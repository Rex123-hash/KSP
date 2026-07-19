import { useEffect, useState } from "react";

/**
 * Tiny API layer. The backend is same-origin under /api (Vite proxies to the
 * Node server in dev; the Catalyst API Gateway serves it in production).
 */

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
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

export const downloadUrl = (kind: string) => `/api/report/download?kind=${kind}`;
