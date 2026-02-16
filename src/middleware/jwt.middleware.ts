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
 * - The jwtSecret should be a strong, random string (minimum 32 characters recommended)
 * - Store the secret securely (environment variables recommended)
 * - Never commit secrets to version control
 * - Rotate secrets periodically in production
 * - Use a cryptographically secure random generator for production secrets
 * 
 * Token Format:
 * Tokens should be sent in the Authorization header as:
 * Authorization: Bearer <token>
 * 
 * Security Standards Compliance:
 * - RFC 7519 (JSON Web Token)
 * - ISO/IEC 25010:2023 Security.Confidentiality
 * - OWASP Authentication Best Practices
 * 
 * @param app - The Elysia application instance to configure
 * @param jwtSecret - Secret key used for signing and verifying JWT tokens
 *                    Must be the same across all instances for distributed systems
 * 
 * @returns {void}
 * 
 * @throws {Error} If jwtSecret is the insecure default value in production
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupJwtMiddleware } from './middleware/jwt.middleware';
 * 
 * const app = new Elysia();
 * 
 * // Production: Always use environment variables
 * setupJwtMiddleware(app, process.env.JWT_SECRET!);
 * 
 * // Development: Use secure secret (never use default!)
 * setupJwtMiddleware(app, process.env.JWT_SECRET || 'dev-secret-minimum-32-chars-long');
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
  // Security validation: Check for insecure default secret
  if (jwtSecret === "default-secret-key") {
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage =
      "⚠️  CRITICAL SECURITY WARNING: Using default JWT secret 'default-secret-key' is insecure!\n" +
      "   This makes your application vulnerable to authentication bypass attacks.\n" +
      "   Please set a strong, unique JWT secret using:\n" +
      "   - Environment variable: JWT_SECRET=your-secure-random-secret\n" +
      "   - Or pass a secure secret to newApiNote(config, 'your-secure-secret')\n" +
      "   Generate a secure secret: openssl rand -base64 32";

    if (isProduction) {
      // In production, throw an error to prevent startup with insecure configuration
      throw new Error(errorMessage);
    } else {
      // In development, log a prominent warning
      console.error("\n" + "=".repeat(80));
      console.error(errorMessage);
      console.error("=".repeat(80) + "\n");
    }
  }

  // Validate secret strength
  if (jwtSecret.length < 32) {
    console.warn(
      `⚠️  JWT Secret Warning: Secret is only ${jwtSecret.length} characters. ` +
      `Recommendation: Use at least 32 characters for enhanced security.`
    );
  }

  app.use(
    jwt({
      name: "jwt",
      secret: jwtSecret,
    }),
  );
}