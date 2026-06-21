import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiBase = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL: `${apiBase}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': 'university_sms_secure_token',
    'x-requested-with': 'XMLHttpRequest'
  },
  withCredentials: true // necessary for HttpOnly refresh cookies
});

// Request Interceptor: Attach access token if present
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically refresh JWT if expired
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        // If refreshing or logging in fails, log out and redirect
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint to get rotated access/refresh tokens
        const response = await axios.post(`${apiBase}/api/v1/auth/refresh`, {}, {
          headers: {
            'x-csrf-token': 'university_sms_secure_token',
            'x-requested-with': 'XMLHttpRequest'
          },
          withCredentials: true
        });

        const { accessToken, user } = response.data.data;
        useAuthStore.getState().setSession(accessToken, user);

        isRefreshing = false;
        processQueue(null, accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
