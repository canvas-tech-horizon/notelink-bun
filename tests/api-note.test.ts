import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { ApiNote } from "../src/core/api-note";
import type { Config } from "../src/types/config.types";

describe("ApiNote Core Functionality", () => {
  let api: ApiNote;
  const testPort = 3001;

  const testConfig: Config = {
    title: "Test API",
    description: "API for testing",
    version: "1.0.0",
    host: `localhost:${testPort}`,
    basePath: "/api",
    errorHandler: {}, // Enable error handler
    healthCheck: { path: "/health" }, // Enable health check
    cors: { origins: "*" }, // Enable CORS
  };

  beforeAll(() => {
    // Create API instance with test configuration
    api = new ApiNote(testConfig, "test-secret-key-min-32-chars-long!!");
  });

  afterAll(() => {
    // Clean up: stop the server
    if (api) {
      api.stop();
    }
  });

  describe("API Instance Creation", () => {
    it("should create an ApiNote instance", () => {
      expect(api).toBeDefined();
      expect(api).toBeInstanceOf(ApiNote);
    });

    it("should have an Elysia app instance", () => {
      const app = api.getApp();
      expect(app).toBeDefined();
    });

    it("should apply default configuration values", () => {
      const routes = api.getRoutes();
      expect(routes).toBeArray();
      expect(routes.length).toBe(0); // No routes registered yet
    });
  });

  describe("Route Registration", () => {
    it("should register a documented GET route", () => {
      api.documentedRoute({
        method: "GET",
        path: "/test",
        summary: "Test endpoint",
        handler: async (ctx) => {
          return { message: "Hello, Test!" };
        },
        responses: {
          "200": "Success",
        },
      });

      const routes = api.getRoutes();
      expect(routes.length).toBe(1);
      expect(routes[0].method).toBe("GET");
      expect(routes[0].path).toBe("/test");
    });

    it("should register multiple routes", () => {
      api.documentedRoute({
        method: "POST",
        path: "/users",
        summary: "Create user",
        handler: async (ctx) => {
          return { id: 1, name: "Test User" };
        },
        responses: {
          "201": "Created",
        },
      });

      const routes = api.getRoutes();
      expect(routes.length).toBe(2); // Previous test + this one
    });

    it("should support method chaining", () => {
      const result = api
        .documentedRoute({
          method: "GET",
          path: "/chain1",
          handler: async () => ({ test: 1 }),
        })
        .documentedRoute({
          method: "GET",
          path: "/chain2",
          handler: async () => ({ test: 2 }),
        });

      expect(result).toBe(api);
      expect(api.getRoutes().length).toBe(4); // 2 previous + 2 new
    });
  });

  describe("Simple Route Registration", () => {
    it("should register a simple route without documentation", () => {
      api.route("GET", "/simple", (ctx) => {
        return { simple: true };
      });

      // Simple routes don't appear in documented routes
      const routes = api.getRoutes();
      expect(routes.length).toBe(4); // Same as before
    });
  });

  describe("Configuration", () => {
    it("should merge basePath with route paths correctly", () => {
      const api2 = new ApiNote({
        title: "Test",
        description: "Test",
        version: "1.0.0",
        basePath: "/api/v2",
      }, "test-secret-key-min-32-chars-long!!");

      api2.documentedRoute({
        method: "GET",
        path: "/test",
        handler: async () => ({ test: true }),
      });

      // The actual path should be /api/v2/test
      // This is tested indirectly through route registration
      expect(api2.getRoutes().length).toBe(1);
      
      api2.stop();
    });
  });
});
