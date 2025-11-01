import type { Elysia } from "elysia";

/**
 * Set up CORS middleware for the root app
 */
export function setupCorsMiddleware(app: Elysia): void {
  app.onBeforeHandle(({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] =
      "GET, POST, PUT, DELETE, PATCH, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization";
  });
}
