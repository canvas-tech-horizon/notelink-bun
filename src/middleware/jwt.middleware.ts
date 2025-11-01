import { jwt } from "@elysiajs/jwt";
import type { Elysia } from "elysia";

/**
 * Set up JWT middleware
 */
export function setupJwtMiddleware(app: Elysia, jwtSecret: string): void {
  app.use(
    jwt({
      name: "jwt",
      secret: jwtSecret,
    }),
  );
}
