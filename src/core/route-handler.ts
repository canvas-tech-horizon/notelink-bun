import { t, type Context } from "elysia";
import type { DocumentedRouteInput } from "../types/route.types";
import { buildTypeBoxSchema, isTypeBoxSchema, convertSchemaToTypeBox } from "../utils/schema.utils";
import { buildOpenAPIResponses } from "../utils/response.utils";

/**
 * Builds a comprehensive Elysia route schema for validation and OpenAPI documentation
 * 
 * This function transforms a DocumentedRouteInput into an Elysia-compatible schema object
 * that includes:
 * - Query parameter validation (TypeBox schemas)
 * - Path parameter validation (TypeBox schemas)
 * - Header parameter validation (TypeBox schemas)
 * - Request body validation (TypeBox schemas with auto-conversion)
 * - Response documentation (OpenAPI format)
 * - OpenAPI metadata (summary, description, tags)
 * 
 * The function automatically handles:
 * - Type conversion from simple formats to TypeBox
 * - Parameter location routing (query, path, header)
 * - Body schema inference for POST/PUT/PATCH methods
 * - Response schema mapping to OpenAPI format
 * 
 * @param input - Documented route input containing all route metadata
 * @param input.method - HTTP method
 * @param input.path - Route path
 * @param input.summary - Brief description for OpenAPI
 * @param input.description - Detailed description for OpenAPI
 * @param input.tags - Tags for grouping in documentation
 * @param input.params - Parameter definitions (query, path, header)
 * @param input.schemasRequest - Request body schema
 * @param input.schemasResponse - Response body schema
 * @param input.responses - Response status codes and descriptions
 * 
 * @returns Elysia schema object with validation and documentation
 * 
 * @example
 * ```typescript
 * const schema = buildRouteSchema({
 *   method: 'POST',
 *   path: '/users/:id',
 *   summary: 'Update user',
 *   params: [
 *     { name: 'id', in: 'path', type: 'string', required: true },
 *     { name: 'filter', in: 'query', type: 'string', required: false }
 *   ],
 *   schemasRequest: { name: 'string', age: 'number' },
 *   responses: { '200': 'Success' }
 * });
 * // Returns: { detail: {...}, params: t.Object({...}), query: t.Object({...}), body: t.Object({...}) }
 * ```
 */
export function buildRouteSchema(input: DocumentedRouteInput): any {
  const schema: any = {
    detail: {
      summary:
        input.summary || input.description || `${input.method} ${input.path}`,
      description: input.description,
      tags: input.tags || [],
    },
  };

  // Add query parameters using TypeBox
  if (input.params) {
    const queryParams = input.params.filter((p) => p.in === "query");
    if (queryParams.length > 0) {
      schema.query = buildTypeBoxSchema(queryParams);
    }

    const pathParams = input.params.filter((p) => p.in === "path");
    if (pathParams.length > 0) {
      schema.params = buildTypeBoxSchema(pathParams);
    }

    const headerParams = input.params.filter((p) => p.in === "header");
    if (headerParams.length > 0) {
      schema.headers = buildTypeBoxSchema(headerParams);
    }
  }

  // Add request body schema
  if (input.schemasRequest) {
    if (isTypeBoxSchema(input.schemasRequest)) {
      // Use provided TypeBox schema for validation
      schema.body = input.schemasRequest;
    } else {
      // Convert plain object/schema to TypeBox schema
      schema.body = convertSchemaToTypeBox(input.schemasRequest);
    }
  } else if (["POST", "PUT", "PATCH"].includes(input.method)) {
    // For methods that typically have a body, add a permissive schema
    // This ensures body parsing works even without explicit validation
    schema.body = t.Any();
  }

  // Add responses documentation in OpenAPI format
  if (input.responses) {
    schema.detail.responses = buildOpenAPIResponses(
      input.responses,
      input.schemasResponse,
    );
  }

  return schema;
}

/**
 * Wraps a route handler with JWT authentication and error handling middleware
 * 
 * This function creates a middleware wrapper around the user's route handler that:
 * 
 * Authentication Flow (when requiresAuth is true):
 * 1. Extracts the Authorization header
 * 2. Validates the Bearer token format
 * 3. Verifies the JWT token signature and expiration
 * 4. Decodes the token payload and attaches it to context.user
 * 5. Returns 401 Unauthorized if any step fails
 * 
 * Error Handling:
 * - Catches all unhandled errors from the route handler
 * - Returns standardized 500 Internal Server Error responses
 * - Preserves error messages for debugging
 * 
 * Context Enhancement:
 * - Adds `user` property to context with decoded JWT payload
 * - Available in handler via: `(context as any).user`
 * 
 * @param input - Route configuration with handler and auth settings
 * @param input.handler - The actual route handler function
 * @param input.requiresAuth - Whether JWT authentication is required
 * 
 * @returns Wrapped handler function with authentication and error handling
 * 
 * @example
 * ```typescript
 * // Wrapped handler with authentication
 * const wrapped = wrapHandler({
 *   requiresAuth: true,
 *   handler: async (ctx) => {
 *     const user = (ctx as any).user; // Access decoded JWT payload
 *     return { message: `Hello, ${user.name}` };
 *   }
 * });
 * 
 * // Response when unauthorized:
 * // { error: "Unauthorized", message: "Missing or invalid token" }
 * 
 * // Response when token is invalid:
 * // { error: "Unauthorized", message: "Invalid or expired token" }
 * 
 * // Response when handler throws error:
 * // { error: "Internal Server Error", message: "Error description" }
 * ```
 */
export function wrapHandler(input: DocumentedRouteInput) {
  return async (context: Context) => {
    // Optional JWT authentication check
    if (input.requiresAuth) {
      const authHeader = context.request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        context.set.status = 401;
        return { error: "Unauthorized", message: "Missing or invalid token" };
      }

      // Verify JWT token validity
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      try {
        const payload = await (context as any).jwt.verify(token);
        if (!payload) {
          context.set.status = 401;
          return { error: "Unauthorized", message: "Invalid or expired token" };
        }
        // Attach decoded payload to context for use in handlers
        (context as any).user = payload;
      } catch (error) {
        context.set.status = 401;
        return {
          error: "Unauthorized",
          message: "Token verification failed",
        };
      }
    }

    try {
      return await input.handler(context);
    } catch (error) {
      context.set.status = 500;
      return {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}
