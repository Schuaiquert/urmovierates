import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message
    console.error('API Error:', message)
    return Promise.reject({ ...error, userMessage: message })
  }
)

export const moviesAPI = {
  getAll: (params = {}) => api.get('/movies', { params }),
  getById: (id) => api.get(`/movies/${id}`),
  create: (data) => api.post('/movies', data),
  update: (id, data) => api.put(`/movies/${id}`, data),
  delete: (id) => api.delete(`/movies/${id}`),
  getGenres: () => api.get('/movies/genres'),
  getYears: () => api.get('/movies/years'),
}

export const reviewsAPI = {
  getAll: (params = {}) => api.get('/reviews', { params }),
  getByMovie: (movieId) => api.get(`/reviews/movies/${movieId}`),
  getMovieStats: (movieId) => api.get(`/reviews/movies/${movieId}/stats`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
}

export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
}

export const favoritesAPI = {
  getUserFavorites: (params = {}) => api.get('/favorites', { params }),
  getStatus: (movieIds) => api.get('/favorites/status', { params: { movieIds: movieIds.join(',') } }),
  add: (movieId) => api.post(`/favorites/${movieId}`),
  remove: (movieId) => api.delete(`/favorites/${movieId}`),
  toggle: (movieId) => api.post(`/favorites/${movieId}/toggle`),
}

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  deleteMe: () => api.delete('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

export default api
