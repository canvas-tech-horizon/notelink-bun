import type { ResponseDefinition } from "../types/response.types";
import {
  convertToOpenAPISchema,
  convertSchemaDefinitionToOpenAPI,
} from "./schema.utils";

/**
 * Converts route response definitions to OpenAPI response objects for documentation
 * 
 * This function transforms simplified response definitions into the full OpenAPI response
 * specification format required for API documentation. It handles:
 * 
 * Input Formats:
 * - String descriptions: { "200": "Success" }
 * - ResponseDefinition objects: { "200": { description: "Success", schema: {...} } }
 * - Mixed formats in the same responses object
 * 
 * Schema Priority:
 * 1. Schema from individual response definition (highest priority)
 * 2. Global schemasResponse parameter for success codes (200, 201)
 * 3. Generic object schema (default)
 * 
 * Response Structure:
 * Each status code is transformed into an OpenAPI response object with:
 * - description: Human-readable response description
 * - content: Media type definitions (application/json)
 * - schema: JSON schema for the response body
 * 
 * @param responses - Map of status codes to descriptions or ResponseDefinition objects
 * @param schemasResponse - Optional global schema for success responses (200, 201)
 * 
 * @returns OpenAPI responses object keyed by status code
 * 
 * @example
 * ```typescript
 * // String format
 * buildOpenAPIResponses({
 *   '200': 'Success',
 *   '404': 'Not found',
 *   '500': 'Server error'
 * });
 * // Returns: {
 * //   '200': { description: 'Success', content: { 'application/json': { schema: { type: 'object' } } } },
 * //   '404': { description: 'Not found', content: { 'application/json': { schema: { type: 'object' } } } },
 * //   '500': { description: 'Server error', content: { 'application/json': { schema: { type: 'object' } } } }
 * // }
 * 
 * // With response-specific schemas
 * buildOpenAPIResponses({
 *   '200': {
 *     description: 'User retrieved successfully',
 *     schema: { id: 'number', name: 'string', email: 'string' }
 *   },
 *   '404': 'User not found'
 * });
 * 
 * // With global schema for success responses
 * buildOpenAPIResponses(
 *   {
 *     '200': 'Success',
 *     '400': 'Bad request'
 *   },
 *   { id: 'number', name: 'string' } // Applied to 200 response only
 * );
 * ```
 */
export function buildOpenAPIResponses(
  responses: Record<string, string | ResponseDefinition>,
  schemasResponse?: any,
): Record<string, any> {
  const openAPIResponses: Record<string, any> = {};

  for (const [statusCode, response] of Object.entries(responses)) {
    let description: string;
    let schema: any = null;

    // Handle both string and object response formats
    if (typeof response === "string") {
      description = response;
    } else {
      description = response.description;
      schema = response.schema;
    }

    const responseObj: any = {
      description: description,
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    };

    // Priority: use schema from response definition, then schemasResponse
    if (schema) {
      // Convert schema definition to OpenAPI format
      responseObj.content["application/json"].schema =
        convertSchemaDefinitionToOpenAPI(schema);
    } else if (schemasResponse) {
      // Fallback to schemasResponse for success status codes
      if (statusCode === "200" || statusCode === "201") {
        console.log("schemasResponse:", schemasResponse);
        responseObj.content["application/json"].schema =
          convertToOpenAPISchema(schemasResponse);
      }
    }

    openAPIResponses[statusCode] = responseObj;
  }

  return openAPIResponses;
}
