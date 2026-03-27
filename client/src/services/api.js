import axios from "axios";


const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL 

});

// Attach JWT from localStorage (key: 'token') if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore (e.g., SSR or inaccessible storage)
  }
  return config;
});

export default api;
