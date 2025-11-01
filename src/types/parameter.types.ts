/**
 * Parameter definition for API endpoints
 */
export interface Parameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required?: boolean;
  default?: any;
}
