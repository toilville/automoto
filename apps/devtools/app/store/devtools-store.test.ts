import { describe, it, expect, beforeEach } from "vitest";
import {
  getDevToolsStore,
  getDevToolsState,
  resetDevToolsStore,
  type DevToolsEvent,
  type RequestLogEntry,
  type ConsoleEntry,
} from "./devtools-store.js";

function makeEvent(overrides: Partial<DevToolsEvent> = {}): DevToolsEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    elapsed: 100,
    event: { type: "chunk", chunk: "hello" },
    channel: "web",
    requestId: "req-1",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<RequestLogEntry> = {}): RequestLogEntry {
  return {
    id: `req-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    channel: "web",
    request: { message: "hi" },
    events: [],
    ...overrides,
  };
}

function makeConsoleEntry(overrides: Partial<ConsoleEntry> = {}): ConsoleEntry {
  return {
    id: `con-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    level: "info",
    source: "test",
    message: "test message",
    ...overrides,
  };
}

describe("devtools-store", () => {
  beforeEach(() => {
    resetDevToolsStore();
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = getDevToolsState();
      expect(state.selectedChannel).toBe("web");
      expect(state.activeTab).toBe("events");
      expect(state.events).toEqual([]);
      expect(state.requests).toEqual([]);
      expect(state.consoleEntries).toEqual([]);
      expect(state.adapters).toEqual([]);
      expect(state.selectedEventId).toBeNull();
      expect(state.selectedRequestId).toBeNull();
    });

    it("has correct default settings", () => {
      const { settings } = getDevToolsState();
      expect(settings.autoScroll).toBe(true);
      expect(settings.maxEvents).toBe(5000);
      expect(settings.showTimestamps).toBe(true);
      expect(settings.gatewayUrl).toBe("http://localhost:3100");
    });

    it("has correct default filters", () => {
      const { filters } = getDevToolsState();
      expect(filters.eventTypes).toEqual([]);
      expect(filters.searchQuery).toBe("");
      expect(filters.selectedRequestId).toBeNull();
    });
  });

  describe("channel management", () => {
    it("setSelectedChannel updates channel", () => {
      getDevToolsState().setSelectedChannel("teams");
      expect(getDevToolsState().selectedChannel).toBe("teams");
    });

    it("setSelectedChannel logs a console entry", () => {
      getDevToolsState().setSelectedChannel("slack");
      const entries = getDevToolsState().consoleEntries;
      expect(entries.length).toBe(1);
      expect(entries[0].message).toContain("Channel switched to: slack");
      expect(entries[0].level).toBe("info");
      expect(entries[0].source).toBe("devtools");
    });

    it("setAdapters replaces the adapter list", () => {
      const adapters = [
        { type: "web" as const, name: "Web", supportsStreaming: true },
        { type: "teams" as const, name: "Teams", supportsStreaming: false },
      ];
      getDevToolsState().setAdapters(adapters);
      expect(getDevToolsState().adapters).toEqual(adapters);
    });
  });

  describe("tab management", () => {
    it("setActiveTab updates the active tab", () => {
      getDevToolsState().setActiveTab("console");
      expect(getDevToolsState().activeTab).toBe("console");
    });
  });

  describe("events", () => {
    it("addEvent appends to the events array", () => {
      const evt = makeEvent();
      getDevToolsState().addEvent(evt);
      expect(getDevToolsState().events).toHaveLength(1);
      expect(getDevToolsState().events[0]).toEqual(evt);
    });

    it("ring buffer trims when exceeding maxEvents", () => {
      getDevToolsState().setSettings({ maxEvents: 3 });
      const events = Array.from({ length: 5 }, (_, i) =>
        makeEvent({ id: `evt-${i}` }),
      );
      for (const evt of events) {
        getDevToolsState().addEvent(evt);
      }
      const stored = getDevToolsState().events;
      expect(stored).toHaveLength(3);
      expect(stored[0].id).toBe("evt-2");
      expect(stored[2].id).toBe("evt-4");
    });

    it("clearEvents empties the array", () => {
      getDevToolsState().addEvent(makeEvent());
      getDevToolsState().addEvent(makeEvent());
      getDevToolsState().clearEvents();
      expect(getDevToolsState().events).toEqual([]);
    });
  });

  describe("requests", () => {
    it("addRequest appends a request", () => {
      const req = makeRequest({ id: "r1" });
      getDevToolsState().addRequest(req);
      expect(getDevToolsState().requests).toHaveLength(1);
      expect(getDevToolsState().requests[0].id).toBe("r1");
    });

    it("updateRequest merges partial update by id", () => {
      getDevToolsState().addRequest(makeRequest({ id: "r1" }));
      getDevToolsState().updateRequest("r1", { status: 200, durationMs: 150 });
      const req = getDevToolsState().requests[0];
      expect(req.status).toBe(200);
      expect(req.durationMs).toBe(150);
      expect(req.channel).toBe("web"); // unchanged
    });

    it("updateRequest does not affect other requests", () => {
      getDevToolsState().addRequest(makeRequest({ id: "r1" }));
      getDevToolsState().addRequest(makeRequest({ id: "r2" }));
      getDevToolsState().updateRequest("r1", { status: 500 });
      expect(getDevToolsState().requests[0].status).toBe(500);
      expect(getDevToolsState().requests[1].status).toBeUndefined();
    });

    it("clearRequests empties the array", () => {
      getDevToolsState().addRequest(makeRequest());
      getDevToolsState().clearRequests();
      expect(getDevToolsState().requests).toEqual([]);
    });
  });

  describe("console entries", () => {
    it("addConsoleEntry appends an entry", () => {
      const entry = makeConsoleEntry({ message: "hello" });
      getDevToolsState().addConsoleEntry(entry);
      expect(getDevToolsState().consoleEntries).toHaveLength(1);
      expect(getDevToolsState().consoleEntries[0].message).toBe("hello");
    });

    it("console ring buffer trims at 2000", () => {
      for (let i = 0; i < 2005; i++) {
        getDevToolsState().addConsoleEntry(makeConsoleEntry({ id: `c-${i}` }));
      }
      const entries = getDevToolsState().consoleEntries;
      expect(entries).toHaveLength(2000);
      expect(entries[0].id).toBe("c-5");
    });

    it("clearConsole empties the array", () => {
      getDevToolsState().addConsoleEntry(makeConsoleEntry());
      getDevToolsState().clearConsole();
      expect(getDevToolsState().consoleEntries).toEqual([]);
    });
  });

  describe("filters", () => {
    it("setFilters merges partial updates", () => {
      getDevToolsState().setFilters({ searchQuery: "hello" });
      expect(getDevToolsState().filters.searchQuery).toBe("hello");
      expect(getDevToolsState().filters.eventTypes).toEqual([]); // unchanged
    });

    it("setFilters can update eventTypes", () => {
      getDevToolsState().setFilters({ eventTypes: ["chunk", "done"] });
      expect(getDevToolsState().filters.eventTypes).toEqual(["chunk", "done"]);
    });
  });

  describe("settings", () => {
    it("setSettings merges partial updates", () => {
      getDevToolsState().setSettings({ autoScroll: false });
      expect(getDevToolsState().settings.autoScroll).toBe(false);
      expect(getDevToolsState().settings.maxEvents).toBe(5000); // unchanged
    });
  });

  describe("selection", () => {
    it("setSelectedEventId updates selection", () => {
      getDevToolsState().setSelectedEventId("evt-42");
      expect(getDevToolsState().selectedEventId).toBe("evt-42");
    });

    it("setSelectedRequestId updates selection", () => {
      getDevToolsState().setSelectedRequestId("req-7");
      expect(getDevToolsState().selectedRequestId).toBe("req-7");
    });

    it("selection can be cleared with null", () => {
      getDevToolsState().setSelectedEventId("evt-1");
      getDevToolsState().setSelectedEventId(null);
      expect(getDevToolsState().selectedEventId).toBeNull();
    });
  });

  describe("subscribe", () => {
    it("notifies listeners on state change", () => {
      const store = getDevToolsStore();
      let callCount = 0;
      store.subscribe(() => callCount++);
      getDevToolsState().setActiveTab("network");
      expect(callCount).toBe(1);
    });

    it("unsubscribe stops notifications", () => {
      const store = getDevToolsStore();
      let callCount = 0;
      const unsub = store.subscribe(() => callCount++);
      getDevToolsState().setActiveTab("network");
      unsub();
      getDevToolsState().setActiveTab("console");
      expect(callCount).toBe(1);
    });
  });
});
