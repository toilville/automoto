/**
 * DevTools zustand store — Central state for the channel developer tools.
 *
 * Tracks: selected channel, event log, request/response log,
 * filters, and settings.
 */
import type {
  ChannelType,
  MSRStreamEvent,
  MSRAgentRequest,
  MSRAgentResponse,
} from "@msr/channel-adapter";

/* ── Types ────────────────────────────────────────────────── */

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  channel: ChannelType;
  /** Raw request body sent to gateway */
  request: MSRAgentRequest | Record<string, unknown>;
  /** Canonical response from gateway */
  response?: MSRAgentResponse | Record<string, unknown>;
  /** HTTP status code */
  status?: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Duration in ms */
  durationMs?: number;
  /** SSE events received during this request */
  events: DevToolsEvent[];
}

export interface DevToolsEvent {
  id: string;
  timestamp: number;
  /** Time since the request started (ms) */
  elapsed: number;
  /** The raw MSRStreamEvent (or local StreamEvent) */
  event: MSRStreamEvent | Record<string, unknown>;
  /** Which channel produced this event */
  channel: ChannelType;
  /** Request this event belongs to */
  requestId: string;
}

export interface ConsoleEntry {
  id: string;
  timestamp: number;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  data?: unknown;
}

export interface DevToolsFilters {
  eventTypes: string[];
  searchQuery: string;
  selectedRequestId: string | null;
}

export interface DevToolsSettings {
  autoScroll: boolean;
  maxEvents: number;
  showTimestamps: boolean;
  gatewayUrl: string;
}

export interface AdapterInfo {
  type: ChannelType;
  name: string;
  supportsStreaming: boolean;
}

export type DevToolsTab =
  | "events"
  | "protocol"
  | "network"
  | "console"
  | "adapters";

export interface DevToolsState {
  /* ── Channel ─────────────────────────────── */
  selectedChannel: ChannelType;
  adapters: AdapterInfo[];
  setSelectedChannel: (channel: ChannelType) => void;
  setAdapters: (adapters: AdapterInfo[]) => void;

  /* ── Active tab ──────────────────────────── */
  activeTab: DevToolsTab;
  setActiveTab: (tab: DevToolsTab) => void;

  /* ── Events ──────────────────────────────── */
  events: DevToolsEvent[];
  addEvent: (event: DevToolsEvent) => void;
  clearEvents: () => void;

  /* ── Requests ────────────────────────────── */
  requests: RequestLogEntry[];
  addRequest: (entry: RequestLogEntry) => void;
  updateRequest: (id: string, update: Partial<RequestLogEntry>) => void;
  clearRequests: () => void;

  /* ── Console ─────────────────────────────── */
  consoleEntries: ConsoleEntry[];
  addConsoleEntry: (entry: ConsoleEntry) => void;
  clearConsole: () => void;

  /* ── Filters ─────────────────────────────── */
  filters: DevToolsFilters;
  setFilters: (filters: Partial<DevToolsFilters>) => void;

  /* ── Settings ────────────────────────────── */
  settings: DevToolsSettings;
  setSettings: (settings: Partial<DevToolsSettings>) => void;

  /* ── Selection ───────────────────────────── */
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
}

/* ── Store factory (no zustand import at module level for SSR) ── */

let storeInstance: ReturnType<typeof createStoreImpl> | null = null;

function createStoreImpl() {
  // Dynamic import would be ideal, but for simplicity we use a plain object + listeners
  type Listener = () => void;
  const listeners = new Set<Listener>();

  let state: DevToolsState = {
    selectedChannel: "web",
    adapters: [],
    activeTab: "events",
    events: [],
    requests: [],
    consoleEntries: [],
    filters: {
      eventTypes: [],
      searchQuery: "",
      selectedRequestId: null,
    },
    settings: {
      autoScroll: true,
      maxEvents: 5000,
      showTimestamps: true,
      gatewayUrl: "http://localhost:3100",
    },
    selectedEventId: null,
    selectedRequestId: null,

    setSelectedChannel: (channel) => {
      setState({ selectedChannel: channel });
      addConsole("info", "devtools", `Channel switched to: ${channel}`);
    },
    setAdapters: (adapters) => setState({ adapters }),
    setActiveTab: (tab) => setState({ activeTab: tab }),

    addEvent: (event) => {
      setState((prev) => {
        const events = [...prev.events, event];
        // Ring buffer: trim if over max
        if (events.length > prev.settings.maxEvents) {
          events.splice(0, events.length - prev.settings.maxEvents);
        }
        return { events };
      });
    },
    clearEvents: () => setState({ events: [] }),

    addRequest: (entry) => {
      setState((prev) => ({ requests: [...prev.requests, entry] }));
    },
    updateRequest: (id, update) => {
      setState((prev) => ({
        requests: prev.requests.map((r) =>
          r.id === id ? { ...r, ...update } : r,
        ),
      }));
    },
    clearRequests: () => setState({ requests: [] }),

    addConsoleEntry: (entry) => {
      setState((prev) => {
        const entries = [...prev.consoleEntries, entry];
        if (entries.length > 2000) entries.splice(0, entries.length - 2000);
        return { consoleEntries: entries };
      });
    },
    clearConsole: () => setState({ consoleEntries: [] }),

    setFilters: (f) =>
      setState((prev) => ({ filters: { ...prev.filters, ...f } })),
    setSettings: (s) =>
      setState((prev) => ({ settings: { ...prev.settings, ...s } })),

    setSelectedEventId: (id) => setState({ selectedEventId: id }),
    setSelectedRequestId: (id) => setState({ selectedRequestId: id }),
  };

  function setState(
    partial: Partial<DevToolsState> | ((prev: DevToolsState) => Partial<DevToolsState>),
  ) {
    const update = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...update };
    listeners.forEach((l) => l());
  }

  function addConsole(level: ConsoleEntry["level"], source: string, message: string) {
    state.addConsoleEntry({
      id: `console-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      level,
      source,
      message,
    });
  }

  return {
    getState: () => state,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function getDevToolsStore() {
  if (!storeInstance) {
    storeInstance = createStoreImpl();
  }
  return storeInstance;
}

/** Reset store singleton (for testing) */
export function resetDevToolsStore(): void {
  storeInstance = null;
}
export function getDevToolsState(): DevToolsState {
  return getDevToolsStore().getState();
}
