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

// ---- Write layer ------------------------------------------------------------
/**
 * Writes go to the kspwrite Catalyst Function, which is served from the SAME
 * origin as this SPA. That is deliberate: the Catalyst session cookie is scoped
 * to the Web Client Hosting domain and would never reach the AppSail read API on
 * its own domain. `credentials: "include"` sends it; the server resolves identity
 * and scope from it and ignores anything we claim here.
 */
const WRITE_BASE = (import.meta.env.VITE_WRITE_BASE || "/server/kspwrite").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function writeRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${WRITE_BASE}${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Network failure / backend absent (e.g. local dev without `catalyst serve`).
    throw new ApiError(0, "unreachable", "Write service is unreachable.");
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // A non-JSON body means we hit hosting/an error page, not the function.
    throw new ApiError(res.status, "bad_response", "Unexpected response from the write service.");
  }

  const payload = (data ?? {}) as { error?: string; message?: string };
  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload.error || "error",
      payload.message || `Request failed (${res.status})`
    );
  }
  return data as T;
}

export const writeGet = <T,>(path: string) => writeRequest<T>("GET", path);
export const writePost = <T,>(path: string, body?: unknown) =>
  writeRequest<T>("POST", path, body ?? {});
export const writePut = <T,>(path: string, body?: unknown) =>
  writeRequest<T>("PUT", path, body ?? {});

// Live backend + dev serve the dynamic CSV endpoint; the static snapshot serves
// pre-exported CSV files.
export const downloadUrl = (kind: string) =>
  CATALYST_API
    ? `${CATALYST_API.replace(/\/$/, "")}/api/report/download?kind=${kind}`
    : STATIC
      ? `${BASE}api/download/${kind}.csv`
      : `/api/report/download?kind=${kind}`;
