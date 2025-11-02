import { t } from "elysia";
import type { Parameter } from "../types/parameter.types";

/**
 * Checks if a value is a valid TypeBox schema object
 * 
 * TypeBox schemas are objects created by the TypeBox library (via the `t` namespace)
 * that have a `Check` method used for runtime validation. This function helps distinguish
 * between:
 * - TypeBox schemas (e.g., t.String(), t.Object({}))
 * - Plain JavaScript objects (e.g., { name: 'string' })
 * 
 * @param value - Any value to check
 * 
 * @returns True if the value is a TypeBox schema, false otherwise
 * 
 * @example
 * ```typescript
 * import { t } from 'elysia';
 * 
 * isTypeBoxSchema(t.String()); // true
 * isTypeBoxSchema(t.Object({ name: t.String() })); // true
 * isTypeBoxSchema({ name: 'string' }); // false
 * isTypeBoxSchema('string'); // false
 * isTypeBoxSchema(null); // false
 * ```
 */
export function isTypeBoxSchema(value: any): boolean {
  return (
    value && typeof value === "object" && typeof value.Check === "function"
  );
}

/**
 * Builds a TypeBox schema from an array of parameter definitions for runtime validation
 * 
 * This function converts parameter definitions (query, path, or header parameters) into
 * a TypeBox Object schema that Elysia can use for automatic request validation. It handles:
 * 
 * Type Mapping:
 * - 'string' → t.String()
 * - 'number' → t.Number()
 * - 'boolean' → t.Boolean()
 * - 'array' → t.Array(t.Any())
 * - 'object' → t.Object({})
 * - Other types → t.Any()
 * 
 * Optional Parameters:
 * Parameters are made optional (wrapped with t.Optional) when:
 * - required is false OR
 * - default value is provided
 * 
 * Description Support:
 * - Parameter descriptions are preserved in the schema
 * - Used for OpenAPI documentation generation
 * 
 * @param params - Array of parameter definitions with type, name, and metadata
 * 
 * @returns TypeBox Object schema with all parameters as properties
 * 
 * @example
 * ```typescript
 * const schema = buildTypeBoxSchema([
 *   { name: 'search', type: 'string', in: 'query', required: false, description: 'Search term' },
 *   { name: 'page', type: 'number', in: 'query', required: true, description: 'Page number' },
 *   { name: 'active', type: 'boolean', in: 'query', default: true }
 * ]);
 * 
 * // Returns equivalent to:
 * // t.Object({
 * //   search: t.Optional(t.String({ description: 'Search term' })),
 * //   page: t.Number({ description: 'Page number' }),
 * //   active: t.Optional(t.Boolean({ description: undefined }))
 * // })
 * ```
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
 * Converts various schema formats to OpenAPI schema specification
 * 
 * This function handles multiple input formats and converts them to OpenAPI-compatible
 * schema objects that can be used in API documentation. It supports:
 * 
 * Input Formats:
 * - TypeBox schemas (returned as-is)
 * - Arrays (converted to array schema with object items)
 * - Plain objects (inferred from structure)
 * 
 * Type Inference:
 * When given a plain object, the function examines each property value to infer types:
 * - null/undefined → string
 * - number → number
 * - boolean → boolean
 * - Array → array with object items
 * - Object → object
 * - Other → string (default)
 * 
 * @param schemasResponse - Response schema in any supported format
 * 
 * @returns OpenAPI schema object with type and properties
 * 
 * @example
 * ```typescript
 * // TypeBox schema (passed through)
 * convertToOpenAPISchema(t.Object({ name: t.String() }));
 * // Returns: <TypeBox schema object>
 * 
 * // Array input
 * convertToOpenAPISchema([]);
 * // Returns: { type: 'array', items: { type: 'object' } }
 * 
 * // Plain object (inferred)
 * convertToOpenAPISchema({ 
 *   id: 123, 
 *   name: 'John', 
 *   active: true,
 *   tags: [],
 *   meta: {}
 * });
 * // Returns: {
 * //   type: 'object',
 * //   properties: {
 * //     id: { type: 'number' },
 * //     name: { type: 'string' },
 * //     active: { type: 'boolean' },
 * //     tags: { type: 'array', items: { type: 'object' } },
 * //     meta: { type: 'object' }
 * //   }
 * // }
 * ```
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
 * Converts simple schema definitions to OpenAPI schema format with support for nested objects
 * 
 * This function transforms a simple key-value schema definition (e.g., { "id": "number", "name": "string" })
 * into a proper OpenAPI schema object. It's designed for ease of use when defining schemas
 * without writing full OpenAPI specifications.
 * 
 * Supported Type Strings:
 * - "number" → { type: "number" }
 * - "string" → { type: "string" }
 * - "boolean" → { type: "boolean" }
 * - "array" → { type: "array", items: { type: "object" } }
 * - "object" → { type: "object" }
 * - Other → { type: "string" } (default)
 * 
 * Required Fields:
 * - Prepend `!` to the key name to mark it as required (e.g., "!name")
 * - Required fields are added to the schema's required array
 * 
 * Nested Objects:
 * When a property value is an object (not a string), it's treated as a nested schema
 * and recursively converted to OpenAPI format.
 * 
 * @param schemaDefinition - Object with property names as keys and type strings as values
 * 
 * @returns OpenAPI schema object with type, properties, and required array
 * 
 * @example
 * ```typescript
 * // Simple flat schema with required fields
 * convertSchemaDefinitionToOpenAPI({
 *   '!id': 'number',
 *   '!name': 'string',
 *   'active': 'boolean'
 * });
 * // Returns: {
 * //   type: 'object',
 * //   properties: {
 * //     id: { type: 'number' },
 * //     name: { type: 'string' },
 * //     active: { type: 'boolean' }
 * //   },
 * //   required: ['id', 'name']
 * // }
 * 
 * // Nested schema
 * convertSchemaDefinitionToOpenAPI({
 *   '!id': 'number',
 *   user: {
 *     '!name': 'string',
 *     'email': 'string'
 *   }
 * });
 * // Returns: {
 * //   type: 'object',
 * //   properties: {
 * //     id: { type: 'number' },
 * //     user: {
 * //       type: 'object',
 * //       properties: {
 * //         name: { type: 'string' },
 * //         email: { type: 'string' }
 * //       },
 * //       required: ['name']
 * //     }
 * //   },
 * //   required: ['id']
 * // }
 * ```
 */
export function convertSchemaDefinitionToOpenAPI(
  schemaDefinition: Record<string, any>,
): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, type] of Object.entries(schemaDefinition)) {
    // Check if the key has a '!' prefix indicating it's required
    const isRequired = key.startsWith('!');
    const cleanKey = isRequired ? key.slice(1) : key;
    
    if (isRequired) {
      required.push(cleanKey);
    }
    
    // Handle nested objects
    if (typeof type === "object" && !Array.isArray(type)) {
      properties[cleanKey] = {
        type: "object",
        properties: convertSchemaDefinitionToOpenAPI(type).properties,
      };
      // Add required array if nested object has required fields
      const nestedResult = convertSchemaDefinitionToOpenAPI(type);
      if (nestedResult.required && nestedResult.required.length > 0) {
        properties[cleanKey].required = nestedResult.required;
      }
    } else if (typeof type === "string") {
      switch (type.toLowerCase()) {
        case "number":
          properties[cleanKey] = { type: "number" };
          break;
        case "string":
          properties[cleanKey] = { type: "string" };
          break;
        case "boolean":
          properties[cleanKey] = { type: "boolean" };
          break;
        case "array":
          properties[cleanKey] = { type: "array", items: { type: "object" } };
          break;
        case "object":
          properties[cleanKey] = { type: "object" };
          break;
        default:
          properties[cleanKey] = { type: "string" };
      }
    }
  }

  const result: any = {
    type: "object",
    properties,
  };
  
  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

/**
 * Converts plain schema definitions to TypeBox schemas for Elysia validation
 * 
 * This function takes various schema formats and converts them to TypeBox schemas
 * that Elysia can use for runtime request/response validation. It provides a simplified
 * schema definition syntax while maintaining full validation capabilities.
 * 
 * Supported Input Formats:
 * 1. TypeBox schemas - Returned as-is
 * 2. Plain objects with string type definitions - Converted to TypeBox
 * 3. Nested objects - Recursively converted
 * 
 * Type String Mapping:
 * - "number" → t.Number()
 * - "string" → t.String()
 * - "boolean" → t.Boolean()
 * - "array" → t.Array(t.Any())
 * - "object" → t.Object({})
 * - Other → t.String() (default)
 * 
 * Required Fields:
 * - Prepend `!` to the key name to mark it as required (e.g., "!name")
 * - Keys without `!` are wrapped with t.Optional()
 * 
 * Nested Objects:
 * When a property value is an object (not a string), it's recursively converted
 * to a nested TypeBox Object schema.
 * 
 * Fallback Behavior:
 * - If the input doesn't match any known format, returns t.Any()
 * - This allows for maximum flexibility while providing validation
 * 
 * @param schema - Schema definition in any supported format
 * 
 * @returns TypeBox schema suitable for Elysia validation
 * 
 * @example
 * ```typescript
 * import { t } from 'elysia';
 * 
 * // Already a TypeBox schema (returned as-is)
 * convertSchemaToTypeBox(t.Object({ name: t.String() }));
 * // Returns: <original TypeBox schema>
 * 
 * // Simple flat schema with required fields
 * convertSchemaToTypeBox({
 *   '!id': 'number',      // required
 *   '!name': 'string',    // required
 *   'email': 'string',    // optional
 *   'active': 'boolean'   // optional
 * });
 * // Returns: t.Object({
 * //   id: t.Number(),
 * //   name: t.String(),
 * //   email: t.Optional(t.String()),
 * //   active: t.Optional(t.Boolean())
 * // })
 * 
 * // Nested schema
 * convertSchemaToTypeBox({
 *   '!id': 'number',
 *   profile: {
 *     '!name': 'string',
 *     'age': 'number'
 *   },
 *   tags: 'array'
 * });
 * // Returns: t.Object({
 * //   id: t.Number(),
 * //   profile: t.Optional(t.Object({
 * //     name: t.String(),
 * //     age: t.Optional(t.Number())
 * //   })),
 * //   tags: t.Optional(t.Array(t.Any()))
 * // })
 * 
 * // Unknown format
 * convertSchemaToTypeBox('unknown');
 * // Returns: t.Any()
 * ```
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
      // Check if the key has a '!' prefix indicating it's required
      const isRequired = key.startsWith('!');
      const cleanKey = isRequired ? key.slice(1) : key;
      
      let typeSchema: any;
      
      // Handle nested objects
      if (typeof type === "object" && !Array.isArray(type)) {
        typeSchema = convertSchemaToTypeBox(type);
      } else if (typeof type === "string") {
        // Convert string type definitions to TypeBox
        switch (type.toLowerCase()) {
          case "number":
            typeSchema = t.Number();
            break;
          case "string":
            typeSchema = t.String();
            break;
          case "boolean":
            typeSchema = t.Boolean();
            break;
          case "array":
            typeSchema = t.Array(t.Any());
            break;
          case "object":
            typeSchema = t.Object({});
            break;
          default:
            typeSchema = t.String();
        }
      } else {
        // For any other type, use t.Any()
        typeSchema = t.Any();
      }
      
      // Wrap with t.Optional if not required
      properties[cleanKey] = isRequired ? typeSchema : t.Optional(typeSchema);
    }

    return t.Object(properties);
  }

  // Default fallback
  return t.Any();
}
