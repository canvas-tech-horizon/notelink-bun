/**
 * Authentication Handlers Module
 * Contains all authentication-related request handlers
 */

import type { Context } from "elysia";
import type { LoginRequest } from "@/types/user.types";
import { users, userCredentials } from "@/data/users.data";

/**
 * Handle user login
 */
export const login = async (context: Context) => {
  const { body } = context;
  const { email, password } = body as LoginRequest;

  // Validate input
  if (!email || !password) {
    context.set.status = 400;
    return {
      success: false,
      message: "Email and password are required",
    };
  }

  // Find user credentials
  const userCred = userCredentials.find((cred) => cred.email === email);
  if (!userCred || userCred.password !== password) {
    context.set.status = 401;
    return {
      success: false,
      message: "Invalid email or password",
    };
  }

  // Find user data
  const user = users.find((u) => u.email === email);
  if (!user) {
    context.set.status = 404;
    return {
      success: false,
      message: "User not found",
    };
  }

  // Generate JWT token
  const token = await (context as any).jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (context: Context) => {
  const user = (context as any).user;
  if (!user) {
    return {
      success: false,
      message: "User not authenticated",
    };
  }
  return {
    success: true,
    data: user,
  };
};
