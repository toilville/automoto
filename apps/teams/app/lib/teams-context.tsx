/**
 * Teams SDK initialization & context provider.
 *
 * Initializes the Microsoft Teams JS SDK, retrieves the Teams context
 * (user info, theme, locale), and exposes it to the React tree.
 *
 * Must be called client-side only (the Teams SDK requires a browser).
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Teams SDK types — imported dynamically to avoid SSR issues
type TeamsContext = {
  /** Teams theme: "default" | "dark" | "contrast" */
  theme: string;
  /** User's display name (if available) */
  userDisplayName?: string;
  /** User's AAD Object ID */
  userObjectId?: string;
  /** User's UPN (email) */
  userPrincipalName?: string;
  /** Teams locale (e.g. "en-us") */
  locale?: string;
  /** The entity/sub-entity ID of the tab */
  entityId?: string;
  /** Channel or chat ID */
  channelId?: string;
  /** Team ID */
  teamId?: string;
  /** Whether the SDK initialized successfully */
  initialized: boolean;
  /** Any initialization error */
  error?: string;
};

const DEFAULT_CONTEXT: TeamsContext = {
  theme: "default",
  initialized: false,
};

const TeamsContextReact = createContext<TeamsContext>(DEFAULT_CONTEXT);

export interface TeamsProviderProps {
  children: ReactNode;
}

/**
 * Wraps children in a Teams context provider.
 * Initializes the Teams SDK and provides user/theme info to descendants.
 *
 * Safe to render on the server — initialization is skipped during SSR.
 */
export function TeamsProvider({ children }: TeamsProviderProps) {
  const [ctx, setCtx] = useState<TeamsContext>(DEFAULT_CONTEXT);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import to avoid SSR issues — Teams SDK requires DOM
        const teams = await import("@microsoft/teams-js");

        await teams.app.initialize();
        const teamsCtx = await teams.app.getContext();

        if (cancelled) return;

        setCtx({
          theme: teamsCtx.app.theme ?? "default",
          userDisplayName: teamsCtx.user?.displayName,
          userObjectId: teamsCtx.user?.id,
          userPrincipalName: teamsCtx.user?.userPrincipalName,
          locale: teamsCtx.app.locale,
          entityId: teamsCtx.page?.id,
          channelId: teamsCtx.channel?.id,
          teamId: teamsCtx.team?.internalId,
          initialized: true,
        });

        // Apply theme to body for CSS variable overrides
        document.body.setAttribute("data-teams-theme", teamsCtx.app.theme ?? "default");

        // Listen for theme changes
        teams.app.registerOnThemeChangeHandler((newTheme: string) => {
          document.body.setAttribute("data-teams-theme", newTheme);
          setCtx((prev) => ({ ...prev, theme: newTheme }));
        });
      } catch (err) {
        if (cancelled) return;
        // Not running inside Teams — fall back gracefully
        console.info("[Teams] SDK initialization skipped (not in Teams context):", err);
        setCtx({
          theme: "default",
          initialized: true,
          error: "Not running inside Microsoft Teams",
        });
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeamsContextReact.Provider value={ctx}>
      {children}
    </TeamsContextReact.Provider>
  );
}

/**
 * Read the current Teams context.
 * Returns default values if not inside TeamsProvider or if SDK failed to init.
 */
export function useTeamsContext(): TeamsContext {
  return useContext(TeamsContextReact);
}

/**
 * Maps a Teams theme name to a Fluent UI theme token set.
 * Used in root.tsx to apply the correct Fluent theme.
 */
export function teamsThemeToFluentTheme(teamsTheme: string) {
  switch (teamsTheme) {
    case "dark":
      return "dark" as const;
    case "contrast":
      return "contrast" as const;
    default:
      return "light" as const;
  }
}
