import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
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

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Folders API
export const foldersAPI = {
  getFolders: (parentId = null) => api.get('/folders', { params: { parentId } }),
  getFolderTree: () => api.get('/folders/tree'),
  createFolder: (folderData) => api.post('/folders', folderData),
  renameFolder: (id, name) => api.put(`/folders/${id}`, { name }),
  deleteFolder: (id) => api.delete(`/folders/${id}`),
};

// Files API
export const filesAPI = {
  getFiles: (params = {}) => api.get('/files', { params }),
  uploadFiles: (formData, onUploadProgress) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  downloadFile: (id) => {
    return api.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
  },
  getFilePreview: (id) => {
    return api.get(`/files/${id}/preview`, {
      responseType: 'blob',
    });
  },
  renameFile: (id, name) => api.put(`/files/${id}/rename`, { name }),
  moveFile: (id, folderId) => api.put(`/files/${id}/move`, { folderId }),
  deleteFile: (id) => api.delete(`/files/${id}`),
};

export default api;