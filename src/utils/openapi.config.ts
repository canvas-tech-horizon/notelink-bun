import { openapi } from "@elysiajs/openapi";
import type { Elysia } from "elysia";
import type { Config } from "../types/config.types";

/**
 * Configures and enables OpenAPI documentation with Scalar UI for the Elysia application
 * 
 * This function sets up comprehensive API documentation using the OpenAPI (Swagger) specification
 * and the Scalar documentation UI. It provides:
 * 
 * Features:
 * - Interactive API documentation at /doc-api
 * - JSON specification endpoint at /doc-api/json
 * - Scalar UI with custom theming
 * - Automatic route discovery and documentation
 * - Request/response examples
 * - Try-it-out functionality (client button hidden by default)
 * 
 * Scalar UI Customization:
 * - Theme: Mars (dark theme with purple accents)
 * - Toolbar: Hidden for cleaner interface
 * - Client Button: Hidden to simplify UI
 * - Custom CSS: Material design inspired with custom radius and colors
 * 
 * The documentation automatically includes:
 * - All routes registered with documentedRoute()
 * - Request/response schemas
 * - Parameter definitions
 * - Authentication requirements
 * - Status codes and descriptions
 * 
 * @param app - The Elysia application instance to configure
 * @param config - API configuration containing title, description, and version
 * @param config.title - The API title displayed in documentation
 * @param config.description - Detailed API description
 * @param config.version - Semantic version string (e.g., "1.0.0")
 * 
 * @returns {void}
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { setupOpenAPI } from './utils/openapi.config';
 * 
 * const app = new Elysia();
 * setupOpenAPI(app, {
 *   title: 'E-commerce API',
 *   description: 'REST API for managing products and orders',
 *   version: '2.0.0'
 * });
 * 
 * // Documentation now available at:
 * // http://localhost:PORT/doc-api
 * // http://localhost:PORT/doc-api/json
 * ```
 */
export function setupOpenAPI(app: Elysia, config: Config): void {
  app.use(
    openapi({
      path: "/doc-api",
      documentation: {
        info: {
          title: config.title,
          description: config.description,
          version: config.version,
        },
        servers: [],
        tags: [],
      },
      scalar: {
        showToolbar: "never",
        theme: "mars",
        url: "doc-api/json",
        hideClientButton: true,
        customCss: `
          :root {
            --scalar-font: ui-sans-serif, system-ui;
            --scalar-radius: 14px;
            --scalar-primary: 265 84% 54%; /* h s l */
          }
          [data-theme="dark"] {
            --scalar-background-1: 230 15% 10%;
            --scalar-text-1: 0 0% 98%;
          }
        `,
      },
    }),
  );
}
