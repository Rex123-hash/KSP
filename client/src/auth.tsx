import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, writeGet } from "./api";

/**
 * Real session state, resolved server-side.
 *
 * The client never asserts who it is. It asks /session, and the function derives
 * identity from the Catalyst auth cookie and scope from the Unit.ParentUnit tree
 * (architecture.md §6). Everything here is display state for what the server
 * already decided.
 *
 * When the write service is unreachable — local dev without `catalyst serve`, or
 * a build deployed before the function — `reachable` is false and the app keeps
 * its previous read-only behaviour rather than breaking.
 */

export type SessionUser = {
  email: string;
  name: string;
  rank: string;
  rankId: number;
  unitId: number;
  unitName: string;
  designation: string | null;
  role: string;
  level: string | null;
  scopeLabel: string;
  breadcrumb: string[];
  scopeUnitIds: number[];
  scopeSize: number;
};

type SessionResponse = {
  authenticated: boolean;
  user?: SessionUser;
  unmapped?: string | null;
};

type AuthState = {
  loading: boolean;
  reachable: boolean;
  authenticated: boolean;
  user: SessionUser | null;
  /** Signed in with Catalyst but with no matching officer record. */
  unmapped: string | null;
  refresh: () => Promise<void>;
  signOut: () => void;
};

const INITIAL: AuthState = {
  loading: true,
  reachable: false,
  authenticated: false,
  user: null,
  unmapped: null,
  refresh: async () => {},
  signOut: () => {},
};

const AuthContext = createContext<AuthState>(INITIAL);

/** The Catalyst Web SDK, present only when served from Catalyst hosting. */
type CatalystWebSDK = {
  auth?: {
    signIn?: (elementId: string, config?: Record<string, unknown>) => void;
    signOut?: (redirectUrl?: string) => void;
  };
};
declare global {
  interface Window {
    catalyst?: CatalystWebSDK;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    loading: true,
    reachable: false,
    authenticated: false,
    user: null as SessionUser | null,
    unmapped: null as string | null,
  });

  const refresh = useCallback(async () => {
    try {
      const s = await writeGet<SessionResponse>("/session");
      setState({
        loading: false,
        reachable: true,
        authenticated: Boolean(s.authenticated),
        user: s.user ?? null,
        unmapped: s.unmapped ?? null,
      });
    } catch (err) {
      // "unreachable" means no backend; any other error means the backend is
      // there but refused us — either way there is no authenticated session.
      const reachable = !(err instanceof ApiError && err.code === "unreachable");
      setState({
        loading: false,
        reachable,
        authenticated: false,
        user: null,
        unmapped: null,
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signOut = useCallback(() => {
    const target = `${window.location.origin}${import.meta.env.BASE_URL}index.html#/login`;

    // The Web SDK is injected by the login screen, so it is normally ABSENT
    // wherever Sign Out actually lives (the Settings page). Without loading it
    // first we would clear local state while the Catalyst session cookie
    // survived — and the very next /session call would sign the user straight
    // back in, which reads as "logging out logs me in again".
    void loadCatalystSdk().then((ok) => {
      if (ok && window.catalyst?.auth?.signOut) {
        window.catalyst.auth.signOut(target);
        return;
      }
      // No SDK reachable (local dev): drop local state and show the login screen.
      // The server session, if any, is untouched — nothing else can end it here.
      setState({
        loading: false,
        reachable: false,
        authenticated: false,
        user: null,
        unmapped: null,
      });
      window.location.href = target;
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({ ...state, refresh, signOut }),
    [state, refresh, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/**
 * Load the Catalyst Web SDK on demand (the login screen only).
 * Resolves false when the scripts are unavailable — i.e. running outside
 * Catalyst hosting — so the caller can show an honest message instead of hanging.
 */
export function loadCatalystSdk(): Promise<boolean> {
  if (window.catalyst?.auth?.signIn) return Promise.resolve(true);

  const inject = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error(src)));
        return;
      }
      const el = document.createElement("script");
      el.src = src;
      el.async = false;
      el.addEventListener("load", () => {
        el.dataset.loaded = "true";
        resolve();
      });
      el.addEventListener("error", () => reject(new Error(src)));
      document.head.appendChild(el);
    });

  // Version pinned to what this project's console emits (Authentication → Setup).
  return inject("https://static.zohocdn.com/catalyst/sdk/js/4.6.2/catalystWebSDK.js")
    .then(() => inject("/__catalyst/sdk/init.js"))
    .then(() => Boolean(window.catalyst?.auth?.signIn))
    .catch(() => false);
}
