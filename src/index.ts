import type { Context } from "elysia";

// Export core classes
export { ApiNote } from "./core";

// Export types
export type {
  Config,
  CustomMiddleware,
  Parameter,
  ResponseDefinition,
  DocumentedRouteInput,
} from "./types";

// Export Context type from Elysia
export type { Context };

/**
 * Factory function to create a new ApiNote instance with automatic middleware setup
 * 
 * This function creates and returns a fully configured ApiNote instance with JWT authentication,
 * CORS middleware, and OpenAPI documentation support. It's the recommended way to initialize
 * the API framework.
 * 
 * @param config - Configuration object containing API metadata and settings
 * @param config.title - The title of the API displayed in documentation
 * @param config.description - A description of the API's purpose and capabilities
 * @param config.version - Semantic version string (e.g., "1.0.0")
 * @param config.host - The host address (default: "localhost")
 * @param config.basePath - The base path for all routes (default: "/")
 * @param config.customMiddleware - Optional array of custom middleware functions
 * @param jwtSecret - Optional secret key for JWT token signing and verification (default: "default-secret-key")
 * 
 * @returns A configured ApiNote instance ready to register routes and start serving
 * 
 * @example
 * ```typescript
 * import { newApiNote } from 'notelink';
 * 
 * const api = newApiNote({
 *   title: 'My API',
 *   description: 'A REST API built with NoteLink',
 *   version: '1.0.0',
 *   host: 'localhost:3000',
 *   basePath: '/api/v1'
 * }, 'my-secret-key');
 * 
 * // Register routes...
 * api.documentedRoute({
 *   method: 'GET',
 *   path: '/users',
 *   handler: async (ctx) => ({ users: [] })
 * });
 * 
 * // Start server
 * await api.listen(3000);
 * ```
 */
import { ApiNote } from "./core";
import type { Config } from "./types";

export function newApiNote(config: Config, jwtSecret?: string): ApiNote {
  return new ApiNote(config, jwtSecret);
}

/**
 * Default export
 */
export default ApiNote;
