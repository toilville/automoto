/**
 * Tests for loggingMiddleware — request/response logging.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loggingMiddleware } from "./logging.js";

describe("loggingMiddleware", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeReq(overrides?: Partial<{ method: string; originalUrl: string }>) {
    return {
      method: overrides?.method ?? "GET",
      originalUrl: overrides?.originalUrl ?? "/api/test",
      __gatewayService: undefined as string | undefined,
      __gatewayUpstream: undefined as string | undefined,
    };
  }

  function makeRes() {
    const listeners: Record<string, (() => void)[]> = {};
    return {
      statusCode: 200,
      on: vi.fn((event: string, cb: () => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      }),
      _fire(event: string) {
        for (const cb of listeners[event] || []) cb();
      },
    };
  }

  it("calls next() immediately", () => {
    const middleware = loggingMiddleware();
    const next = vi.fn();

    middleware(makeReq() as never, makeRes() as never, next);
    expect(next).toHaveBeenCalled();
  });

  it("logs on response finish event", () => {
    const middleware = loggingMiddleware();
    const req = makeReq({ method: "GET", originalUrl: "/api/health" });
    const res = makeRes();

    middleware(req as never, res as never, vi.fn());
    expect(consoleSpy).not.toHaveBeenCalled();

    // Trigger finish
    res._fire("finish");
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("includes method, path, and status in log message", () => {
    const middleware = loggingMiddleware();
    const req = makeReq({ method: "POST", originalUrl: "/api/v1/web" });
    const res = makeRes();
    res.statusCode = 201;

    middleware(req as never, res as never, vi.fn());
    res._fire("finish");

    const logMsg = consoleSpy.mock.calls[0][0];
    expect(logMsg).toContain("POST");
    expect(logMsg).toContain("/api/v1/web");
    expect(logMsg).toContain("201");
  });

  it("shows ✓ for successful responses", () => {
    const middleware = loggingMiddleware();
    const res = makeRes();
    res.statusCode = 200;

    middleware(makeReq() as never, res as never, vi.fn());
    res._fire("finish");

    expect(consoleSpy.mock.calls[0][0]).toContain("✓");
  });

  it("shows ⚠ for 4xx responses", () => {
    const middleware = loggingMiddleware();
    const res = makeRes();
    res.statusCode = 404;

    middleware(makeReq() as never, res as never, vi.fn());
    res._fire("finish");

    expect(consoleSpy.mock.calls[0][0]).toContain("⚠");
  });

  it("shows ✗ for 5xx responses", () => {
    const middleware = loggingMiddleware();
    const res = makeRes();
    res.statusCode = 500;

    middleware(makeReq() as never, res as never, vi.fn());
    res._fire("finish");

    expect(consoleSpy.mock.calls[0][0]).toContain("✗");
  });

  it("includes gateway service name when tagged", () => {
    const middleware = loggingMiddleware();
    const req = makeReq();
    req.__gatewayService = "chat";
    const res = makeRes();

    middleware(req as never, res as never, vi.fn());
    res._fire("finish");

    expect(consoleSpy.mock.calls[0][0]).toContain("chat");
  });

  it("defaults to 'gateway' when no service tag", () => {
    const middleware = loggingMiddleware();
    const res = makeRes();

    middleware(makeReq() as never, res as never, vi.fn());
    res._fire("finish");

    expect(consoleSpy.mock.calls[0][0]).toContain("gateway");
  });
});
