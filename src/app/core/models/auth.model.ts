import { Role } from '../interfaces/role.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string; // No viene cuando mustChangePassword es true (no se abre sesión)
  type?: string;
  role?: Role[] | any;
  email?: string;
  name?: string;
  userId?: number;
  message?: string;
  status?: string;
  /** true si ingresó con una contraseña temporal vigente y debe cambiarla. */
  mustChangePassword?: boolean;

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

/** Respuesta simple del backend: { message } */
export interface MessageResponse {
  message: string;
}