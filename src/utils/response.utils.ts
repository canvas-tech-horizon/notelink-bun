import type { ResponseDefinition } from "../types/response.types";
import {
  convertToOpenAPISchema,
  convertSchemaDefinitionToOpenAPI,
} from "./schema.utils";

/**
 * Convert simple response format to OpenAPI response objects
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
