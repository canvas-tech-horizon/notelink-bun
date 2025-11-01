import type { UserResponse } from "@/types/user.types";
import type { ApiNote } from "@/types/api.types";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from "@/handlers/users.handlers";

/**
 * User Routes Module
 * Contains all user-related route definitions
 */

/**
 * Register all user routes with the API
 */
export function registerUserRoutes(api: ApiNote) {
    // Document GET /v1/users route
    api.documentedRoute({
        method: "GET",
        path: "/v1/users",
        description: "Get a list of all users",
        summary: "List users",
        responses: {
            200: {
                description: "Success - Returns array of users",
                schema: {
                    "id": "number",
                    "name": "string",
                    "email": "string",
                    "map": {
                        "latlong": "string",
                        "details": "string"
                    }
                },
            },
            401: {
                description: "Unauthorized - Invalid or missing token",
            },
            500: {
                description: "Internal Server Error",
            },
        },
        handler: getAllUsers,
        params: [
            {
                name: "limit",
                in: "query",
                type: "number",
                description: "Maximum number of users to return",
                required: false,
            },
        ],
        tags: ["Users"],
    });

    // Document GET /v1/users/:id route
    api.documentedRoute({
        method: "GET",
        path: "/v1/users/:id",
        description: "Get a single user by ID",
        summary: "Get user",
        responses: {
            200: {
                description: "Success - Returns user object",
                schema: {
                    "id": "number",
                    "name": "string",
                    "email": "string",
                },
            },
            404: {
                description: "Not Found - User does not exist",
            },
            401: {
                description: "Unauthorized",
            },
        },
        handler: getUserById,
        params: [
            {
                name: "id",
                in: "path",
                type: "number",
                description: "User ID",
                required: true,
            },
        ],
        tags: ["Users"],
    });

    // Document POST /v1/users route
    api.documentedRoute({
        method: "POST",
        path: "/v1/users",
        description: "Create a new user",
        summary: "Create user",
        responses: {
            201: {
                description: "Created - Returns newly created user",
                schema: {
                    "success": "boolean",
                    "data": {
                        "id": "number",
                        "name": "string",
                        "email": "string"
                    }
                },
            },
            400: {
                description: "Bad Request - Invalid input",
                schema: {
                    "error": "string"
                }
            },
            401: {
                description: "Unauthorized",
            },
        },
        handler: createUser,
        schemasRequest: {
            "name": "string",
            "email": "string",
            "password": "string",
        },
        tags: ["Users"],
    });

    // Document PUT /v1/users/:id route
    api.documentedRoute({
        method: "PUT",
        path: "/v1/users/:id",
        description: "Update an existing user",
        summary: "Update user",
        responses: {
            200: {
                description: "Success - Returns updated user",
                schema: {
                    "id": "number",
                    "name": "string",
                    "email": "string",
                },
            },
            404: {
                description: "Not Found - User does not exist",
            },
            400: {
                description: "Bad Request - Invalid input",
            },
        },
        handler: updateUser,
        params: [
            {
                name: "id",
                in: "path",
                type: "number",
                description: "User ID",
                required: true,
            },
        ],
        schemasRequest: {
            "name": "string",
            "email": "string",
            "password": "string",
        } as Partial<UserResponse>,
        tags: ["Users"],
    });

    // Document DELETE /v1/users/:id route
    api.documentedRoute({
        method: "DELETE",
        path: "/v1/users/:id",
        description: "Delete a user",
        summary: "Delete user",
        responses: {
            200: {
                description: "Success - User deleted",
            },
            404: {
                description: "Not Found - User does not exist",
            },
        },
        handler: deleteUser,
        params: [
            {
                name: "id",
                in: "path",
                type: "number",
                description: "User ID",
                required: true,
            },
        ],
        tags: ["Users"],
    });
}

