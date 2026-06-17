import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject({ ...error, message });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
};

export const uploadAPI = {
  uploadDocuments: (formData, onProgress) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }),
};

export const itineraryAPI = {
  generate: (data)   => api.post('/itinerary/generate', data),
  getAll:   (params) => api.get('/itinerary', { params }),
  getStats: ()       => api.get('/itinerary/stats'),
  getOne:   (id)     => api.get(`/itinerary/${id}`),
  update:   (id, d)  => api.put(`/itinerary/${id}`, d),
  remove:   (id)     => api.delete(`/itinerary/${id}`),
};

export const shareAPI = {
  getByShareId: (shareId) => api.get(`/share/${shareId}`),
};

export default api;
