import { Role } from '@prisma/client';

export interface UpdateMeDTO {
  name?: string;
  email?: string;
  password?: string;
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
  userId: number;
  movieId: number;
}

export interface UpdateReviewDTO {
  rating?: number;
  text?: string;
  /** Apenas informativo: nunca persistido a partir de input de usuário
   *  comum. Usado internamente pelo service para registrar moderação. */
  deletionReason?: string;
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
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface ForgotPasswordResponse {
  message: string;
  token?: string;
}