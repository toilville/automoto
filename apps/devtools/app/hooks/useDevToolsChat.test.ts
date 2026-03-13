import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDevToolsChat } from "./useDevToolsChat.js";
import { resetDevToolsStore, getDevToolsState } from "~/store/devtools-store.js";

/** Helper: create a ReadableStream from SSE lines */
function sseStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const payload = lines.map((l) => l + "\n").join("");
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    },
  });
}

function mockFetchOk(lines: string[]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/event-stream" }),
    body: sseStream(lines),
  });
}

function mockFetchError(status: number, body: Record<string, unknown>) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    headers: new Headers(),
    json: () => Promise.resolve(body),
  });
}

describe("useDevToolsChat", () => {
  beforeEach(() => {
    resetDevToolsStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with empty state", () => {
    const { result } = renderHook(() => useDevToolsChat("web"));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ignores blank messages", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("   ");
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it("assembles streaming chunk events into assistant message", async () => {
    globalThis.fetch = mockFetchOk([
      'data: {"type":"chunk","chunk":"Hel","id":"c0","index":0}',
      'data: {"type":"chunk","chunk":"lo!","id":"c1","index":1}',
      'data: {"type":"done","fullResponse":"Hello!"}',
    ]);

    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("hi");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("hi");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toBe("Hello!");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("logs request and events to the devtools store", async () => {
    globalThis.fetch = mockFetchOk([
      'data: {"type":"chunk","chunk":"ok","id":"c0","index":0}',
      'data: {"type":"done","fullResponse":"ok"}',
    ]);

    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("test");
    });

    const state = getDevToolsState();
    expect(state.requests).toHaveLength(1);
    expect(state.requests[0].status).toBe(200);
    expect(state.requests[0].channel).toBe("web");
    expect(state.events.length).toBeGreaterThanOrEqual(2);
    expect(state.consoleEntries.length).toBeGreaterThanOrEqual(2);
  });

  it("handles HTTP errors", async () => {
    globalThis.fetch = mockFetchError(500, { error: "Server exploded" });

    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("fail");
    });

    expect(result.current.error).toBe("Server exploded");
    expect(result.current.messages[1].content).toBe("Error: Server exploded");
    expect(result.current.isLoading).toBe(false);

    const state = getDevToolsState();
    const errorEntries = state.consoleEntries.filter((e) => e.level === "error");
    expect(errorEntries.length).toBeGreaterThanOrEqual(1);
  });

  it("clearMessages resets state", async () => {
    globalThis.fetch = mockFetchOk([
      'data: {"type":"chunk","chunk":"hey","id":"c0","index":0}',
      'data: {"type":"done","fullResponse":"hey"}',
    ]);

    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("hello");
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("handles text_delta event type", async () => {
    globalThis.fetch = mockFetchOk([
      'data: {"type":"text_delta","delta":"Hi ","id":"d0","index":0}',
      'data: {"type":"text_delta","delta":"there","id":"d1","index":1}',
      'data: {"type":"done","fullResponse":"Hi there"}',
    ]);

    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("greeting");
    });

    expect(result.current.messages[1].content).toBe("Hi there");
  });

  it("skips malformed SSE lines gracefully", async () => {
    globalThis.fetch = mockFetchOk([
      'data: {"type":"chunk","chunk":"ok","id":"c0","index":0}',
      "data: NOT_JSON",
      "some random line",
      'data: {"type":"done","fullResponse":"ok"}',
    ]);

    const { result } = renderHook(() => useDevToolsChat("web"));
    await act(async () => {
      await result.current.sendMessage("test");
    });

    expect(result.current.messages[1].content).toBe("ok");
    expect(result.current.error).toBeNull();
  });
});
