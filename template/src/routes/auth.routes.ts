import { getCurrentUser, login } from "@/handlers/auth.handlers";
import type { ApiNote } from "@/types/api.types";

/**
 * Authentication Routes Module
 * Contains authentication-related route definitions
 */

/**
 * Register all authentication routes with the API
 */
export function registerAuthRoutes(api: ApiNote) {
    // Login route (public - no auth required)
    api.documentedRoute({
        method: "POST",
        path: "/v1/auth/login",
        description: "Authenticate user and receive JWT token",
        summary: "User login",
        handler: login,
        schemasRequest: {
            email: "string",
            password: "string",
        },
        responses: {
            200: {
                description: "Success - Returns JWT token and user data",
                schema: {
                    "success": "boolean",
                    "token": "string",
                    "user": {
                        "id": "number",
                        "name": "string",
                        "email": "string",
                    },
                },
            },
            400: {
                description: "Bad Request - Missing email or password",
            },
            401: {
                description: "Unauthorized - Invalid credentials",
            },
        },
        requiresAuth: false,
        tags: ["Authentication"],
    });

    // Protected route example (requires JWT)
    api.documentedRoute({
        method: "GET",
        path: "/v1/users/me",
        description: "Get current authenticated user",
        summary: "Get current user",
        handler: getCurrentUser,
        responses: {
            200: {
                description: "Success - Returns current user",
                schema: {
                    "id": "number",
                    "name": "string",
                    "email": "string",
                },
            },
            401: {
                description: "Unauthorized - Invalid or missing token",
            },
        },
        requiresAuth: true,
        tags: ["Users", "Authentication"],
    });
}
