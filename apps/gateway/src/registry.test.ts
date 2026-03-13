/**
 * Tests for registryHandler — service registry endpoint.
 */
import { describe, it, expect, vi } from "vitest";
import { registryHandler } from "./registry.js";
import type { ServiceDefinition } from "./server.js";

describe("registryHandler", () => {
  function makeService(
    name: string,
    prefix: string,
    upstream: string,
  ): ServiceDefinition {
    return { name, prefix, upstream, description: `${name} service` };
  }

  function makeMockRes() {
    return { json: vi.fn() };
  }

  it("returns service list with name, prefix, upstream, description", () => {
    const services = [
      makeService("chat", "/chat", "http://localhost:5173"),
      makeService("teams", "/teams", "http://localhost:5175"),
    ];

    const handler = registryHandler(services, 8080);
    const res = makeMockRes();
    handler({} as never, res as never);

    const body = res.json.mock.calls[0][0];
    expect(body.services).toHaveLength(2);
    expect(body.services[0]).toEqual({
      name: "chat",
      prefix: "/chat",
      upstream: "http://localhost:5173",
      description: "chat service",
    });
  });

  it("includes gateway info with port and mode", () => {
    const handler = registryHandler([], 9090);
    const res = makeMockRes();
    handler({} as never, res as never);

    const body = res.json.mock.calls[0][0];
    expect(body.gateway).toEqual({
      port: 9090,
      mode: "reverse-proxy",
    });
  });

  it("returns empty services array when none registered", () => {
    const handler = registryHandler([], 8080);
    const res = makeMockRes();
    handler({} as never, res as never);

    const body = res.json.mock.calls[0][0];
    expect(body.services).toEqual([]);
  });
});
