import type { Request, Response, NextFunction } from "express";

export interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  service: string | null;
  upstream: string | null;
  status: number;
  duration: number;
}

export function loggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const { method, originalUrl } = req;

    // Extract matched service from custom header set by proxy setup
    const service = (req as unknown as Record<string, unknown>).__gatewayService as string | undefined;
    const upstream = (req as unknown as Record<string, unknown>).__gatewayUpstream as string | undefined;

    res.on("finish", () => {
      const duration = Date.now() - start;
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        method,
        path: originalUrl,
        service: service ?? null,
        upstream: upstream ?? null,
        status: res.statusCode,
        duration,
      };

      const statusIcon = entry.status >= 500 ? "✗" : entry.status >= 400 ? "⚠" : "✓";
      const serviceName = entry.service ?? "gateway";

      console.log(
        `${statusIcon} ${entry.method} ${entry.path} → ${serviceName} [${entry.status}] ${entry.duration}ms`
      );
    });

    next();
  };
}
