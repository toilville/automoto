import type { Request, Response } from "express";
import type { ServiceDefinition } from "./server.js";

interface ServiceInfo {
  name: string;
  prefix: string;
  upstream: string;
  description: string;
}

interface RegistryResponse {
  services: ServiceInfo[];
  gateway: {
    port: number;
    mode: string;
  };
}

export function registryHandler(services: ServiceDefinition[], port: number) {
  return (_req: Request, res: Response): void => {
    const response: RegistryResponse = {
      services: services.map((svc) => ({
        name: svc.name,
        prefix: svc.prefix,
        upstream: svc.upstream,
        description: svc.description,
      })),
      gateway: {
        port,
        mode: "reverse-proxy",
      },
    };

    res.json(response);
  };
}
