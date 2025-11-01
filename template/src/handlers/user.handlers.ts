import type { CreateUserRequest, UserResponse } from "@/types/user.types";
import { users } from "@/data/users.data";
import type { Context } from "@/types/api.types";

/**
 * User Handlers Module
 * Contains all user-related request handlers
 */

/**
 * Get all users with optional limit
 */
export const getAllUsers = ({ query }: Context) => {
  const limit = query.limit
    ? parseInt(query.limit as string)
    : users.length;
  return {
    success: true,
    data: users.slice(0, limit),
    total: users.length,
  };
};

/**
 * Get a single user by ID
 */
export const getUserById = ({ params, set }: Context) => {
  const userId = parseInt(params.id as string);
  const user = users.find((u) => u.id === userId);

  if (!user) {
    set.status = 404;
    return { error: "User not found" };
  }

  return {
    success: true,
    data: user,
  };
};

/**
 * Create a new user
 */
export const createUser = ({ body, set }: Context) => {
  const requestBody = body as CreateUserRequest;

  // Validate input
  if (!requestBody.name || !requestBody.email || !requestBody.password) {
    set.status = 400;
    return { error: "Missing required fields: name, email, password" };
  }

  // Create new user
  const newUser: UserResponse = {
    id: users.length + 1,
    name: requestBody.name,
    email: requestBody.email,
  };

  users.push(newUser);
  set.status = 201;

  return {
    success: true,
    data: newUser,
  };
};

/**
 * Update an existing user
 */
export const updateUser = ({ params, body, set }: Context) => {
  const userId = parseInt(params.id as string);
  const updateData = body as Partial<UserResponse>;
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    set.status = 404;
    return { error: "User not found" };
  }

  // Update user
  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    id: userId, // Ensure ID doesn't change
  };

  return {
    success: true,
    data: users[userIndex],
  };
};

/**
 * Delete a user by ID
 */
export const deleteUser = ({ params, set }: Context) => {
  const userId = parseInt(params.id as string);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    set.status = 404;
    return { error: "User not found" };
  }

  // Remove user
  users.splice(userIndex, 1);

  return {
    success: true,
    message: "User deleted successfully",
  };
};
