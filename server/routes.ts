import type { Express } from "express";
import { createServer, type Server } from "node:http";

export async function registerRoutes(app: Express): Promise<Server> {
  // TODO: add API routes when needed.
  const httpServer = createServer(app);

  return httpServer;
}
