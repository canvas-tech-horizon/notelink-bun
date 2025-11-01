import { t } from "elysia";
import type { Parameter } from "../types/parameter.types";

/**
 * Check if a value is a valid TypeBox schema
 */
export function isTypeBoxSchema(value: any): boolean {
  return (
    value && typeof value === "object" && typeof value.Check === "function"
  );
}

/**
 * Build parameter schema using TypeBox for validation
 */
export function buildTypeBoxSchema(params: Parameter[]): any {
  const properties: Record<string, any> = {};

  params.forEach((param) => {
    let typeSchema: any;

    // Map parameter types to TypeBox types
    switch (param.type) {
      case "string":
        typeSchema = t.String({ description: param.description });
        break;
      case "number":
        typeSchema = t.Number({ description: param.description });
        break;
      case "boolean":
        typeSchema = t.Boolean({ description: param.description });
        break;
      case "array":
        typeSchema = t.Array(t.Any(), { description: param.description });
        break;
      case "object":
        typeSchema = t.Object({}, { description: param.description });
        break;
      default:
        typeSchema = t.Any({ description: param.description });
    }

    // Wrap optional parameters with t.Optional
    // Parameters are optional if: not explicitly required OR has a default value
    if (!param.required || param.default !== undefined) {
      properties[param.name] = t.Optional(typeSchema);
    } else {
      properties[param.name] = typeSchema;
    }
  });

  // Build TypeBox Object schema
  return t.Object(properties);
}

/**
 * Convert schemasResponse to OpenAPI schema format
 */
export function convertToOpenAPISchema(schemasResponse: any): any {
  // If it's a TypeBox schema, use it directly
  if (isTypeBoxSchema(schemasResponse)) {
    return schemasResponse;
  }

  console.log(typeof schemasResponse);

  // If it's an array, infer array schema
  if (Array.isArray(schemasResponse)) {
    return {
      type: "array",
      items: {
        type: "object",
      },
    };
  }

  // If it's a plain object, try to infer schema from its structure
  if (schemasResponse && typeof schemasResponse === "object") {
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(schemasResponse)) {
      if (value === null || value === undefined) {
        properties[key] = { type: "string" };
      } else if (typeof value === "number") {
        properties[key] = { type: "number" };
      } else if (typeof value === "boolean") {
        properties[key] = { type: "boolean" };
      } else if (Array.isArray(value)) {
        properties[key] = { type: "array", items: { type: "object" } };
      } else if (typeof value === "object") {
        properties[key] = { type: "object" };
      } else {
        properties[key] = { type: "string" };
      }
    }

    return {
      type: "object",
      properties,
    };
  }

  // Default fallback
  return {
    type: "object",
  };
}

/**
 * Convert schema definition (e.g., {"id": "number", "name": "string"}) to OpenAPI schema
 * Supports nested objects
 */
export function convertSchemaDefinitionToOpenAPI(
  schemaDefinition: Record<string, any>,
): any {
  const properties: Record<string, any> = {};

  for (const [key, type] of Object.entries(schemaDefinition)) {
    // Handle nested objects
    if (typeof type === "object" && !Array.isArray(type)) {
      properties[key] = {
        type: "object",
        properties: convertSchemaDefinitionToOpenAPI(type).properties,
      };
    } else if (typeof type === "string") {
      switch (type.toLowerCase()) {
        case "number":
          properties[key] = { type: "number" };
          break;
        case "string":
          properties[key] = { type: "string" };
          break;
        case "boolean":
          properties[key] = { type: "boolean" };
          break;
        case "array":
          properties[key] = { type: "array", items: { type: "object" } };
          break;
        case "object":
          properties[key] = { type: "object" };
          break;
        default:
          properties[key] = { type: "string" };
      }
    }
  }

  return {
    type: "object",
    properties,
  };
}

/**
 * Convert plain schema definition to TypeBox schema for Elysia validation
 * Supports nested objects and various type formats
 */
export function convertSchemaToTypeBox(schema: any): any {
  // If already a TypeBox schema, return as-is
  if (isTypeBoxSchema(schema)) {
    return schema;
  }

  // Handle plain objects with property definitions like {"id": "number", "name": "string"}
  if (schema && typeof schema === "object" && !Array.isArray(schema)) {
    const properties: Record<string, any> = {};

    for (const [key, type] of Object.entries(schema)) {
      // Handle nested objects
      if (typeof type === "object" && !Array.isArray(type)) {
        properties[key] = convertSchemaToTypeBox(type);
      } else if (typeof type === "string") {
        // Convert string type definitions to TypeBox
        switch (type.toLowerCase()) {
          case "number":
            properties[key] = t.Number();
            break;
          case "string":
            properties[key] = t.String();
            break;
          case "boolean":
            properties[key] = t.Boolean();
            break;
          case "array":
            properties[key] = t.Array(t.Any());
            break;
          case "object":
            properties[key] = t.Object({});
            break;
          default:
            properties[key] = t.String();
        }
      } else {
        // For any other type, use t.Any()
        properties[key] = t.Any();
      }
    }

    return t.Object(properties);
  }

  // Default fallback
  return t.Any();
}
