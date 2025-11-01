import { t, type Context } from "elysia";
import type { DocumentedRouteInput } from "../types/route.types";
import { buildTypeBoxSchema, isTypeBoxSchema, convertSchemaToTypeBox } from "../utils/schema.utils";
import { buildOpenAPIResponses } from "../utils/response.utils";

/**
 * Build route schema for documentation and validation
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
 * Wrap handler with authentication and error handling
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
