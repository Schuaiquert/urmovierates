import axios, { AxiosError, AxiosInstance } from 'axios';
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

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error ?? error.message;
    if (typeof console !== 'undefined') console.error('API Error:', message);
    return Promise.reject(Object.assign(error, { userMessage: message }));
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
