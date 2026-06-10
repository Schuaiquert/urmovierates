import axios, { AxiosError, AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_KEY, API_KEY_HEADER } from '@/lib/api-config';
import type { ApiResponse, AuthPayload, Movie, Review, ReviewStats, User, Genre } from '@/types';

export interface MovieCreateInput {
  title: string;
  year?: number;
  synopsis?: string;
  poster?: string;
  trailer?: string;
  duration?: number;
  active?: boolean;
  genres: { name: string }[];
}

export type MovieUpdateInput = Partial<MovieCreateInput>;

/**
 * Custom error shape attached to every rejected AxiosError. All hooks/pages
 * read `err.userMessage` and `err.code` from this — see mapApiErrorToUserMessage
 * below for the friendly-message mapping.
 */
export interface ApiError extends AxiosError<{ error?: string; code?: string }> {
  userMessage: string;
  code?: string;
  httpStatus?: number;
}

/**
 * Map a backend error response to a user-facing Portuguese string.
 * Keeps messages consistent across all consumers (hooks, pages, modals).
 */
function mapApiErrorToUserMessage(
  status: number | undefined,
  code: string | undefined,
  fallback: string,
): string {
  if (status === 401 && code === 'API_KEY_MISSING') {
    return 'Configuração inválida: a chave da API não foi enviada. Contate o suporte.';
  }
  if (status === 403 && code === 'API_KEY_FORBIDDEN') {
    return 'Chave da API inválida. Verifique a configuração do servidor.';
  }
  if (status === 401 && code === 'AUTH_MISSING') {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (status === 401) {
    return 'Credenciais inválidas.';
  }
  if (status === 403) {
    return 'Você não tem permissão para essa ação.';
  }
  if (status === 404) {
    return 'Recurso não encontrado.';
  }
  if (status && status >= 500) {
    return 'Erro no servidor. Tente novamente em alguns instantes.';
  }
  if (status === 0 || status === undefined) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return fallback;
}

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Skip header injection during SSR — no localStorage, and we want the
  // contract to be the same as the original code (which also skipped).
  if (typeof window === 'undefined') return config;

  // Axios v1 normalizes headers via AxiosHeaders; use the helper to avoid the
  // deprecated `config.headers[xxx] = ...` pattern and keep casing consistent.
  const headers = AxiosHeaders.from(config.headers);

  // 1) X-API-Key — every protected route needs this. Public routes
  //    (login/register/refresh/forgot-password/reset-password/health, /,
  //    api-docs) ignore it, so sending it always is harmless.
  if (API_KEY) headers.set(API_KEY_HEADER, API_KEY);

  // 2) Authorization — only when a JWT is present in localStorage.
  const token = window.localStorage.getItem('token');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: ApiError) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const backendMessage = data?.error ?? error.message;
    const code = data?.code;

    const userMessage = mapApiErrorToUserMessage(status, code, backendMessage);

    if (typeof console !== 'undefined') {
      console.error('[api]', status, code ?? '-', backendMessage);
    }

    return Promise.reject(
      Object.assign(error, {
        userMessage,
        code,
        httpStatus: status,
      }),
    );
  },
);

export const moviesAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Movie[]>>('/movies', { params }),
  getById: (id: string) => api.get<ApiResponse<Movie>>(`/movies/${id}`),
  create: (data: MovieCreateInput) => api.post<ApiResponse<Movie>>('/movies', data),
  update: (id: string, data: MovieUpdateInput) => api.put<ApiResponse<Movie>>(`/movies/${id}`, data),
  remove: (id: string) => api.delete(`/movies/${id}`),
  getGenres: () => api.get<ApiResponse<Genre[]>>('/movies/genres'),
  getYears: () => api.get<ApiResponse<number[]>>('/movies/years'),
};

export const reviewsAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Review[]>>('/reviews', { params }),
  getByMovie: (movieId: string) =>
    api.get<ApiResponse<Review[]>>(`/reviews/movies/${movieId}`),
  getMovieStats: (movieId: string) =>
    api.get<ApiResponse<ReviewStats>>(`/reviews/movies/${movieId}/stats`),
  create: (data: Partial<Review>) => api.post<ApiResponse<Review>>('/reviews', data),
  update: (id: string, data: Partial<Review>) => api.put<ApiResponse<Review>>(`/reviews/${id}`, data),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

export const usersAPI = {
  getAll: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<User[]>>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
};

export const favoritesAPI = {
  getUserFavorites: (params: Record<string, unknown> = {}) =>
    api.get<ApiResponse<Movie[]>>('/favorites', { params }),
  getStatus: (movieIds: string[]) =>
    api.get<ApiResponse<Record<string, boolean>>>('/favorites/status', {
      params: { movieIds: movieIds.join(',') },
    }),
  add: (movieId: string) => api.post(`/favorites/${movieId}`),
  remove: (movieId: string) => api.delete(`/favorites/${movieId}`),
  toggle: (movieId: string) =>
    api.post<ApiResponse<{ favorited: boolean }>>(`/favorites/${movieId}/toggle`),
};

export const authAPI = {
  register: (data: { name?: string; email: string; password: string }) =>
    api.post<ApiResponse<User>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthPayload>>('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  updateMe: (data: Partial<User>) => api.put<ApiResponse<User>>('/auth/me', data),
  deleteMe: () => api.delete('/auth/me'),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

export default api;

// Dispatch a window event whenever a request is rejected with 401 AUTH_MISSING.
// The AuthProvider listens for this and forces a logout + redirect to /login.
// Kept as a separate response interceptor so the message-mapping pass runs first
// and this one only observes.
if (typeof window !== 'undefined') {
  api.interceptors.response.use(
    (r) => r,
    (error: ApiError) => {
      if (
        error.response?.status === 401 &&
        error.response?.data?.code === 'AUTH_MISSING'
      ) {
        window.dispatchEvent(new CustomEvent('app:auth-expired'));
      }
      return Promise.reject(error);
    },
  );
}
