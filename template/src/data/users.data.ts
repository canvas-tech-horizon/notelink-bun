import type { UserResponse } from "@/types/user.types";

/**
 * User credentials for demo purposes
 */
export const userCredentials = [
  { email: "john@example.com", password: "password123" },
  { email: "jane@example.com", password: "password123" },
];

/**
 * In-memory user storage (for demo purposes)
 */
export const users: UserResponse[] = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];
