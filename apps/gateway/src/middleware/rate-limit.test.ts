/**
 * Tests for rateLimitMiddleware — IP-based rate limiting.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimitMiddleware } from "./rate-limit.js";

describe("rateLimitMiddleware", () => {
  function makeReq(ip = "127.0.0.1") {
    return {
      ip,
      socket: { remoteAddress: ip },
    };
  }

  function makeRes() {
    const headers: Record<string, string> = {};
    return {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn((key: string, val: string) => {
        headers[key] = val;
      }),
      _headers: headers,
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls next() when under the limit", () => {
    const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 });
    const next = vi.fn();

    middleware(makeReq() as never, makeRes() as never, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 429 when over the limit", () => {
    const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 2 });
    const req = makeReq();

    // First 2 requests should pass
    for (let i = 0; i < 2; i++) {
      middleware(req as never, makeRes() as never, vi.fn());
    }

    // Third request should be blocked
    const res = makeRes();
    const next = vi.fn();
    middleware(req as never, res as never, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    const body = res.json.mock.calls[0][0];
    expect(body.error).toBe("Too Many Requests");
  });

  it("sets X-RateLimit-* headers", () => {
    const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 10 });
    const res = makeRes();

    middleware(makeReq() as never, res as never, vi.fn());

    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", 10);
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 9);
    expect(res.setHeader).toHaveBeenCalledWith(
      "X-RateLimit-Reset",
      expect.any(Number),
    );
  });

  it("tracks different IPs separately", () => {
    const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 1 });

    // IP A — first request
    middleware(makeReq("1.2.3.4") as never, makeRes() as never, vi.fn());

    // IP A — blocked
    const resA = makeRes();
    middleware(makeReq("1.2.3.4") as never, resA as never, vi.fn());
    expect(resA.status).toHaveBeenCalledWith(429);

    // IP B — allowed
    const nextB = vi.fn();
    middleware(makeReq("5.6.7.8") as never, makeRes() as never, nextB);
    expect(nextB).toHaveBeenCalled();
  });

  it("resets after window expires", () => {
    const middleware = rateLimitMiddleware({ windowMs: 1000, maxRequests: 1 });
    const req = makeReq();

    // First request passes
    middleware(req as never, makeRes() as never, vi.fn());

    // Second blocked
    const res1 = makeRes();
    middleware(req as never, res1 as never, vi.fn());
    expect(res1.status).toHaveBeenCalledWith(429);

    // Advance past window
    vi.advanceTimersByTime(1100);

    // Should pass again
    const next = vi.fn();
    middleware(req as never, makeRes() as never, next);
    expect(next).toHaveBeenCalled();
  });

  it("decrements remaining count with each request", () => {
    const middleware = rateLimitMiddleware({ windowMs: 60000, maxRequests: 5 });
    const req = makeReq();

    for (let i = 0; i < 3; i++) {
      middleware(req as never, makeRes() as never, vi.fn());
    }

    const res = makeRes();
    middleware(req as never, res as never, vi.fn());

    // 4th request: remaining = 5 - 4 = 1
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", 1);
  });
});
