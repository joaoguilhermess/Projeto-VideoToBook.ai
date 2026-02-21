import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

// Video endpoints
export const videoAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/videos'),
  get: (id: number) => api.get(`/videos/${id}`),
  delete: (id: number) => api.delete(`/videos/${id}`),
};

// Book endpoints
export const bookAPI = {
  create: (title: string, transcription_ids: number[], numberOfChapters?: number) =>
    api.post('/books', { title, transcription_ids, numberOfChapters }),
  list: () => api.get('/books'),
  get: (id: number) => api.get(`/books/${id}`),
  delete: (id: number) => api.delete(`/books/${id}`),
  getStats: () => api.get('/books/stats'),
};

export default api;
