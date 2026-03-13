/**
 * analytics.ts — App-level analytics singleton.
 *
 * Instantiates the AnalyticsManager with the appropriate provider(s)
 * based on environment variables. Import this from root.tsx and pass
 * the manager to <AnalyticsProvider>.
 *
 * Environment variables:
 *   VITE_APPINSIGHTS_INSTRUMENTATION_KEY — 1DS instrumentation key
 *   VITE_APPINSIGHTS_CONNECTION_STRING   — App Insights connection string
 *   VITE_ANALYTICS_PROVIDER             — "1ds" | "appinsights" | "both" (default "1ds")
 */
import {
  AnalyticsManager,
  OneDSProvider,
  AppInsightsProvider,
  ConsoleProvider,
  NoopProvider,
  type AnalyticsProvider as IAnalyticsProvider,
} from "@msr/analytics";

function getEnv(name: string): string | undefined {
  try {
    return import.meta.env[name] as string | undefined;
  } catch {
    return undefined;
  }
}

function buildProviders(): IAnalyticsProvider[] {
  const mode = getEnv("VITE_ANALYTICS_PROVIDER") ?? "1ds";
  const isDev = getEnv("MODE") === "development";

  // In development without opt-in, use console logger
  if (isDev && getEnv("VITE_TELEMETRY_IN_DEV") !== "true") {
    return [new ConsoleProvider()];
  }

  // SSR — return noop (real providers are browser-only)
  if (typeof window === "undefined") {
    return [new NoopProvider()];
  }

  const providers: IAnalyticsProvider[] = [];

  if (mode === "1ds" || mode === "both") {
    providers.push(new OneDSProvider({ autoInit: false }));
  }

  if (mode === "appinsights" || mode === "both") {
    providers.push(new AppInsightsProvider({ mode: "browser" }));
  }

  return providers.length > 0 ? providers : [new NoopProvider()];
}

let _analytics: AnalyticsManager | null = null;

/**
 * Get the singleton AnalyticsManager. Creates it on first call.
 * Call `initializeAnalytics()` once in root.tsx to set up the SDK(s).
 */
export function getAnalytics(): AnalyticsManager {
  if (!_analytics) {
    _analytics = new AnalyticsManager({
      providers: buildProviders(),
      disableInDev: true,
    });
  }
  return _analytics;
}

/**
 * Initialize the analytics SDKs. Call once from root.tsx client entry
 * or from a useEffect in the root component.
 */
export function initializeAnalytics(): AnalyticsManager {
  const analytics = getAnalytics();
  analytics.initialize({
    instrumentationKey: getEnv("VITE_APPINSIGHTS_INSTRUMENTATION_KEY"),
    connectionString: getEnv("VITE_APPINSIGHTS_CONNECTION_STRING"),
  });
  return analytics;
}
