import type { Elysia } from "elysia";

/**
 * Custom middleware function type
 */
export type CustomMiddleware = (app: Elysia) => void | Promise<void>;

/**
 * Configuration for the API documentation
 */
export interface Config {
  title: string;
  description: string;
  version: string;
  host?: string;
  basePath?: string;
  customMiddleware?: CustomMiddleware[];
}
