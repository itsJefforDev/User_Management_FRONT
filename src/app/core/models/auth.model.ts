import { Role } from '../interfaces/role.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type?: string;
  role?: Role[] | any;
  email?: string;
  name?: string;
  userId?: number;
  message?: string;
  status?: string;

  user?: {
    id?: number | string;
    email: string;
    name: string;
    role: Role[] | any;
    status?: string;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id?: number | string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  role?: string;
  name?: string;
}
