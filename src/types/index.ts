import { Role } from '@prisma/client';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface CreateMovieDTO {
  title: string;
  synopsis?: string;
  year: number;
  poster?: string;
  trailer?: string;
  active?: boolean;
}

export interface UpdateMovieDTO {
  title?: string;
  synopsis?: string;
  year?: number;
  poster?: string;
  trailer?: string;
  active?: boolean;
}

export interface CreateReviewDTO {
  rating: number;
  text?: string;
  userId: string;
  movieId: string;
}

export interface UpdateReviewDTO {
  rating?: number;
  text?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Auth DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface ForgotPasswordResponse {
  message: string;
  token?: string;
}