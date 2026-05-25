export type UserRole = "CLIENT" | "LAWYER" | "ADMIN";

export interface UserResponse {
  id: string;
  keycloakId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  keycloakId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
}
