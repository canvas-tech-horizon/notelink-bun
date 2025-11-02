import { Elysia, type Context } from "elysia";
import type { Config } from "../types/config.types";
import type { DocumentedRouteInput } from "../types/route.types";
import { setupJwtMiddleware, setupCorsMiddleware } from "../middleware";
import { setupOpenAPI } from "../utils";
import { buildRouteSchema, wrapHandler } from "./route-handler";

/**
 * Main ApiNote class for creating documented, type-safe REST APIs with Elysia
 * 
 * ApiNote provides a high-level abstraction over Elysia to create well-documented REST APIs
 * with built-in JWT authentication, CORS support, automatic OpenAPI documentation generation,
 * and type-safe request/response validation. It simplifies the process of building production-ready
 * APIs by handling common middleware setup, schema validation, and documentation automatically.
 * 
 * @class
 * @example
 * ```typescript
 * const api = new ApiNote({
 *   title: 'Todo API',
 *   description: 'A simple todo management API',
 *   version: '1.0.0',
 *   host: 'localhost:8080'
 * }, 'jwt-secret-key');
 * 
 * api.documentedRoute({
 *   method: 'GET',
 *   path: '/todos',
 *   summary: 'List all todos',
 *   handler: async (ctx) => ({ todos: [] }),
 *   responses: {
 *     '200': 'Success'
 *   }
 * });
 * 
 * await api.listen(8080);
 * ```
 */
export class ApiNote {
  private app: Elysia;
  private config: Config;
  private jwtSecret: string;
  private routes: DocumentedRouteInput[] = [];

  /**
   * Creates a new ApiNote instance with the specified configuration
   * 
   * Initializes the Elysia application, sets up middleware (JWT, CORS, custom),
   * and configures OpenAPI documentation. The constructor automatically applies
   * default values for host and basePath if not provided.
   * 
   * @param config - Configuration object for the API
   * @param config.title - API title for documentation
   * @param config.description - API description for documentation
   * @param config.version - Semantic version of the API
   * @param config.host - Host address (default: "localhost")
   * @param config.basePath - Base path for all routes (default: "/")
   * @param config.customMiddleware - Optional custom middleware array
   * @param jwtSecret - Secret key for JWT operations (default: "default-secret-key")
   * 
   * @example
   * ```typescript
   * const api = new ApiNote({
   *   title: 'User Service',
   *   description: 'Microservice for user management',
   *   version: '2.1.0',
   *   basePath: '/api/v2'
   * });
   * ```
   */
  constructor(config: Config, jwtSecret: string = "default-secret-key") {
    this.config = {
      ...config,
      host: config.host || "localhost",
      basePath: config.basePath || "/",
    };
    this.jwtSecret = jwtSecret;
    this.app = new Elysia();

    this.setupMiddleware();
    setupOpenAPI(this.app, this.config);
  }

  /**
   * Sets up all middleware for the Elysia application
   * 
   * This private method is called during construction to configure essential middleware
   * in the following order:
   * 1. JWT middleware for authentication token handling
   * 2. CORS middleware for cross-origin requests
   * 3. Custom middleware provided in the configuration
   * 
   * @private
   * @returns {void}
   */
  private setupMiddleware() {
    setupJwtMiddleware(this.app, this.jwtSecret);
    setupCorsMiddleware(this.app);

    // Apply custom middleware if provided
    if (this.config.customMiddleware && this.config.customMiddleware.length > 0) {
      for (const middleware of this.config.customMiddleware) {
        middleware(this.app);
      }
    }
  }

  /**
   * Registers a documented route with automatic validation, authentication, and OpenAPI generation
   * 
   * This is the primary method for adding routes to your API. It handles:
   * - Request validation (query params, path params, headers, body)
   * - Response documentation and schema validation
   * - JWT authentication when requiresAuth is true
   * - Automatic OpenAPI/Swagger documentation generation
   * - Type-safe request/response handling with TypeBox schemas
   * 
   * @param input - Complete route definition with documentation
   * @param input.method - HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
   * @param input.path - Route path (e.g., "/users/:id")
   * @param input.handler - Async function to handle the request
   * @param input.summary - Short summary for API documentation
   * @param input.description - Detailed description of the endpoint
   * @param input.tags - Array of tags for grouping in documentation
   * @param input.params - Array of parameter definitions (query, path, header)
   * @param input.schemasRequest - Request body schema (TypeBox or plain object)
   * @param input.schemasResponse - Response body schema for documentation
   * @param input.responses - Response status codes and descriptions
   * @param input.requiresAuth - Whether JWT authentication is required
   * 
   * @returns The ApiNote instance for method chaining
   * 
   * @example
   * ```typescript
   * api.documentedRoute({
   *   method: 'POST',
   *   path: '/users',
   *   summary: 'Create a new user',
   *   description: 'Creates a new user account with the provided information',
   *   tags: ['Users'],
   *   schemasRequest: {
   *     name: 'string',
   *     email: 'string',
   *     age: 'number'
   *   },
   *   handler: async (ctx) => {
   *     const body = ctx.body;
   *     return { id: 1, ...body };
   *   },
   *   responses: {
   *     '201': 'User created successfully',
   *     '400': 'Invalid input'
   *   },
   *   requiresAuth: true
   * }).documentedRoute({
   *   method: 'GET',
   *   path: '/users/:id',
   *   params: [{
   *     name: 'id',
   *     in: 'path',
   *     type: 'string',
   *     required: true
   *   }],
   *   handler: async (ctx) => ({ user: { id: ctx.params.id } })
   * });
   * ```
   */
  public documentedRoute(input: DocumentedRouteInput): ApiNote {
    this.routes.push(input);

    const fullPath = `${this.config.basePath}${input.path}`.replace(
      /\/\//g,
      "/",
    );
    const method = input.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head";

    const schema = buildRouteSchema(input);
    const wrappedHandler = wrapHandler(input);

    // Register route based on method
    switch (method) {
      case "get":
        this.app.get(fullPath, wrappedHandler, schema);
        break;
      case "post":
        this.app.post(fullPath, wrappedHandler, schema);
        break;
      case "put":
        this.app.put(fullPath, wrappedHandler, schema);
        break;
      case "delete":
        this.app.delete(fullPath, wrappedHandler, schema);
        break;
      case "patch":
        this.app.patch(fullPath, wrappedHandler, schema);
        break;
      case "options":
        this.app.options(fullPath, wrappedHandler, schema);
        break;
      case "head":
        this.app.head(fullPath, wrappedHandler, schema);
        break;
    }

    return this;
  }

  /**
   * Registers a simple route without automatic documentation or validation
   * 
   * Use this method when you need to add a route that doesn't require OpenAPI documentation
   * or automatic validation. This is useful for:
   * - Quick prototyping
   * - Internal endpoints that don't need documentation
   * - Custom endpoints with manual validation
   * 
   * Note: Routes added with this method won't appear in the OpenAPI documentation
   * and won't have automatic request/response validation.
   * 
   * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
   * @param path - Route path relative to basePath (e.g., "/health")
   * @param handler - Function to handle the request, receives Elysia Context
   * 
   * @returns The ApiNote instance for method chaining
   * 
   * @example
   * ```typescript
   * api.route('GET', '/health', (ctx) => {
   *   return { status: 'ok', timestamp: Date.now() };
   * }).route('POST', '/webhook', async (ctx) => {
   *   await processWebhook(ctx.body);
   *   return { received: true };
   * });
   * ```
   */
  public route(
    method: DocumentedRouteInput["method"],
    path: string,
    handler: (context: Context) => any,
  ) {
    const fullPath = `${this.config.basePath}${path}`.replace(/\/\//g, "/");
    const methodLower = method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"
      | "options"
      | "head";

    switch (methodLower) {
      case "get":
        this.app.get(fullPath, handler,{detail: { hide: true } });
        break;
      case "post":
        this.app.post(fullPath, handler,{detail: { hide: true } });
        break;
      case "put":
        this.app.put(fullPath, handler,{detail: { hide: true } });
        break;
      case "delete":
        this.app.delete(fullPath, handler,{detail: { hide: true } });
        break;
      case "patch":
        this.app.patch(fullPath, handler,{detail: { hide: true } });
        break;
      case "options":
        this.app.options(fullPath, handler,{detail: { hide: true } });
        break;
      case "head":
        this.app.head(fullPath, handler,{detail: { hide: true } });
        break;
    }

    return this;
  }

  /**
   * Retrieves all registered documented routes
   * 
   * Returns an array of all routes that were added using the documentedRoute() method.
   * This is useful for:
   * - Debugging route configurations
   * - Generating custom documentation
   * - Testing route registration
   * - Analyzing API structure
   * 
   * Note: Routes added with route() method are not included in this list.
   * 
   * @returns Array of documented route definitions
   * 
   * @example
   * ```typescript
   * const routes = api.getRoutes();
   * console.log(`Total documented routes: ${routes.length}`);
   * routes.forEach(route => {
   *   console.log(`${route.method} ${route.path} - ${route.summary}`);
   * });
   * ```
   */
  public getRoutes(): DocumentedRouteInput[] {
    return this.routes;
  }

  /**
   * Gets direct access to the underlying Elysia application instance
   * 
   * This method provides access to the raw Elysia app for advanced use cases where
   * you need to:
   * - Add custom Elysia plugins
   * - Access low-level Elysia features
   * - Integrate with other Elysia middleware
   * - Customize error handling at the Elysia level
   * 
   * Warning: Direct manipulation of the Elysia app may bypass ApiNote's built-in
   * features and documentation generation. Use with caution.
   * 
   * @returns The Elysia application instance
   * 
   * @example
   * ```typescript
   * const elysiaApp = api.getApp();
   * 
   * // Add custom Elysia plugin
   * elysiaApp.use(customPlugin());
   * 
   * // Add custom error handler
   * elysiaApp.onError((error) => {
   *   console.error('Custom error handler:', error);
   *   return { error: error.message };
   * });
   * ```
   */
  public getApp(): Elysia {
    return this.app;
  }

  /**
   * Starts the HTTP server and begins listening for requests
   * 
   * This method initializes the server and binds it to the specified port. It performs
   * the following actions:
   * - Determines the listening port from config.host, parameter, or defaults to 8080
   * - Sets up global error handling
   * - Starts the Elysia server
   * - Displays server information including network addresses
   * - Shows available network interfaces (Wi-Fi and Ethernet)
   * - Prints the API documentation URL
   * 
   * Port resolution priority:
   * 1. Port specified in config.host (e.g., "localhost:3000")
   * 2. Port parameter passed to listen()
   * 3. Default port 8080
   * 
   * @param port - Optional port number to listen on (overridden by config.host port)
   * 
   * @returns Promise that resolves when the server starts successfully
   * @throws Error if the server fails to start (e.g., port already in use)
   * 
   * @example
   * ```typescript
   * // Listen on specific port
   * await api.listen(3000);
   * 
   * // Listen on default port (8080)
   * await api.listen();
   * 
   * // With error handling
   * try {
   *   await api.listen(8080);
   *   console.log('Server started successfully');
   * } catch (error) {
   *   console.error('Failed to start server:', error);
   * }
   * ```
   */
  public listen(port?: number): Promise<void> {
    const hostParts = (this.config.host || 'localhost').split(':');
    const hostPortNum = hostParts.length > 1 && hostParts[1] ? parseInt(hostParts[1], 10) : undefined;
    const listenPort = hostPortNum ?? port ?? 8080;

    return new Promise((resolve, reject) => {
      try {
        this.app.onError(({ code, error, request }) => {
          console.error('[onError]', code, request.method, request.url, error)
          const message = error instanceof Error ? error.message : String(error);
          return new Response(JSON.stringify({ code, message }), { status: 400 })
        });
        this.app.listen(listenPort, () => {
          console.log('🚀 Server is Running - Network Information');
          console.log('');
          console.log(`📡 Host:  http://${this.config.host}`);

          // print ip addresses of the machine and ports (Wi-Fi and Ethernet only)
          const os = require("os");
          const networkInterfaces = os.networkInterfaces();
          const foundInterfaces: string[] = [];

          for (const name of Object.keys(networkInterfaces)) {
            const nameLower = name.toLowerCase();
            // Only show Wi-Fi and Ethernet interfaces
            if (nameLower.includes('wi-fi') || nameLower.includes('ethernet') ||
              nameLower.includes('wifi') || nameLower.includes('eth')) {
              const ifaceList = networkInterfaces[name] || [];
              for (const iface of ifaceList) {
                if (iface.family === 'IPv4' && !iface.internal) {
                  foundInterfaces.push(`🌍 ${name + ":".padEnd(1)} http://${iface.address}:${listenPort}`);
                }
              }
            }
          }

          if (foundInterfaces.length > 0) {
            foundInterfaces.forEach(iface => console.log(iface));
          }

          console.log('');
          console.log('📚 API Documentation: /doc-api');

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Gracefully stops the HTTP server and closes all connections
   * 
   * This method shuts down the Elysia server, stopping it from accepting new connections
   * and closing existing ones. Use this for:
   * - Graceful shutdown procedures
   * - Testing cleanup
   * - Application termination
   * - Hot reloading
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Graceful shutdown on SIGTERM
   * process.on('SIGTERM', () => {
   *   console.log('Shutting down gracefully...');
   *   api.stop();
   *   process.exit(0);
   * });
   * 
   * // Testing cleanup
   * afterAll(() => {
   *   api.stop();
   * });
   * ```
   */
  public stop(): void {
    this.app.stop();
  }
}
