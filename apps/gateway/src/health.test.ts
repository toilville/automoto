/**
 * Tests for healthHandler — aggregated health check endpoint.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { healthHandler } from "./health.js";
import type { ServiceDefinition } from "./server.js";

describe("healthHandler", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeService(name: string, upstream: string): ServiceDefinition {
    return { name, prefix: `/${name}`, upstream, description: `${name} service` };
  }

  function makeMockRes() {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res;
  }

  it("returns healthy when all services are up", async () => {
    const services = [
      makeService("chat", "http://localhost:5173"),
      makeService("teams", "http://localhost:5175"),
    ];

    mockFetch.mockResolvedValue({ ok: true });

    const handler = healthHandler(services);
    const res = makeMockRes();
    await handler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe("healthy");
    expect(body.services.chat.status).toBe("up");
    expect(body.services.teams.status).toBe("up");
    expect(body.timestamp).toBeDefined();
  });

  it("returns unhealthy (503) when all services are down", async () => {
    const services = [makeService("chat", "http://localhost:5173")];

    mockFetch.mockRejectedValue(new Error("Connection refused"));

    const handler = healthHandler(services);
    const res = makeMockRes();
    await handler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe("unhealthy");
    expect(body.services.chat.status).toBe("down");
  });

  it("returns degraded when some services are up", async () => {
    const services = [
      makeService("chat", "http://localhost:5173"),
      makeService("teams", "http://localhost:5175"),
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("Connection refused"));

    const handler = healthHandler(services);
    const res = makeMockRes();
    await handler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe("degraded");
  });

  it("marks service down on non-OK HTTP response", async () => {
    const services = [makeService("chat", "http://localhost:5173")];

    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const handler = healthHandler(services);
    const res = makeMockRes();
    await handler({} as never, res as never);

    const body = res.json.mock.calls[0][0];
    expect(body.services.chat.status).toBe("down");
    expect(body.services.chat.error).toContain("503");
  });

  it("returns healthy with empty services list", async () => {
    const handler = healthHandler([]);
    const res = makeMockRes();
    await handler({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe("healthy");
  });

  it("fetches /health endpoint on each upstream", async () => {
    const services = [makeService("chat", "http://localhost:5173")];

    mockFetch.mockResolvedValue({ ok: true });

    const handler = healthHandler(services);
    await handler({} as never, makeMockRes() as never);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:5173/health",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
