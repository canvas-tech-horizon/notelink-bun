/**
 * Example user response type
 */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

/**
 * Example user creation request
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Login request type
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response type
 */
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserResponse;
  message?: string;
}
