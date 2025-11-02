import { jwt } from "@elysiajs/jwt";
import type { Elysia } from "elysia";

/**
 * Configures JWT (JSON Web Token) middleware for the Elysia application
 * 
 * This function integrates the @elysiajs/jwt plugin to enable JWT-based authentication
 * throughout the API. Once configured, the middleware:
 * 
 * Provides:
 * - JWT token signing: Create tokens for authentication
 * - JWT token verification: Validate incoming tokens
 * - Automatic payload decoding: Extract user data from tokens
 * - Context enhancement: Adds `jwt` object to all route contexts
 * 
 * Context Methods Available:
 * - context.jwt.sign(payload): Create a signed JWT token
 * - context.jwt.verify(token): Verify and decode a JWT token
 * 
 * Security Notes:
 * - The jwtSecret should be a strong, random string
 * - Store the secret securely (environment variables recommended)
 * - Never commit secrets to version control
 * - Rotate secrets periodically in production
 * 
 * Token Format:
 * Tokens should be sent in the Authorization header as:
 * Authorization: Bearer <token>
 * 
 * @param app - The Elysia application instance to configure
 * @param jwtSecret - Secret key used for signing and verifying JWT tokens
 *                    Must be the same across all instances for distributed systems
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupJwtMiddleware } from './middleware/jwt.middleware';
 * 
 * const app = new Elysia();
 * setupJwtMiddleware(app, process.env.JWT_SECRET || 'dev-secret');
 * 
 * // Now in routes:
 * app.post('/login', async ({ jwt, body }) => {
 *   // Verify credentials...
 *   const token = await jwt.sign({
 *     userId: user.id,
 *     email: user.email,
 *     exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
 *   });
 *   return { token };
 * });
 * 
 * app.get('/profile', async ({ jwt, request }) => {
 *   const authHeader = request.headers.get('Authorization');
 *   const token = authHeader?.substring(7); // Remove 'Bearer '
 *   const payload = await jwt.verify(token);
 *   return { user: payload };
 * });
 * ```
 */
export function setupJwtMiddleware(app: Elysia, jwtSecret: string): void {
  app.use(
    jwt({
      name: "jwt",
      secret: jwtSecret,
    }),
  );
}