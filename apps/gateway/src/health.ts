import type { Request, Response } from "express";
import type { ServiceDefinition } from "./server.js";

interface ServiceHealth {
  status: "up" | "down";
  latency?: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  services: Record<string, ServiceHealth>;
  timestamp: string;
}

async function checkService(service: ServiceDefinition): Promise<ServiceHealth> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  const start = Date.now();
  try {
    const res = await fetch(`${service.upstream}/health`, {
      signal: controller.signal,
    });
    const latency = Date.now() - start;

    if (res.ok) {
      return { status: "up", latency };
    }
    return { status: "down", error: `HTTP ${res.status}` };
  } catch (err) {
    const message =
      err instanceof Error ? err.message.replace("fetch failed", "").trim() || err.cause?.toString() || err.message : "Unknown error";
    return { status: "down", error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export function healthHandler(services: ServiceDefinition[]) {
  return async (_req: Request, res: Response): Promise<void> => {
    const results = await Promise.all(
      services.map(async (svc) => ({
        name: svc.name,
        health: await checkService(svc),
      }))
    );

    const serviceHealth: Record<string, ServiceHealth> = {};
    let upCount = 0;

    for (const { name, health } of results) {
      serviceHealth[name] = health;
      if (health.status === "up") upCount++;
    }

    let status: HealthResponse["status"];
    if (upCount === results.length) {
      status = "healthy";
    } else if (upCount === 0) {
      status = "unhealthy";
    } else {
      status = "degraded";
    }

    const statusCode = status === "unhealthy" ? 503 : 200;

    res.status(statusCode).json({
      status,
      services: serviceHealth,
      timestamp: new Date().toISOString(),
    } satisfies HealthResponse);
  };
}
