import axios from "axios";

const getBaseUrl = () => {
  // In development, use relative path so setupProxy.js forwards to localhost:5000
  if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL) {
    return '/api';
  }

  let url = process.env.REACT_APP_API_URL || 'https://kabc8j4wap.us-east-1.awsapprunner.com';
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

// ✅ Axios instance — cookies are sent automatically (withCredentials: true)
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// Backward compat: still send Bearer token if it exists in localStorage
// (will be removed once cookie system is fully adopted)
// ═══════════════════════════════════════════════════════════════
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — Silent 401 refresh + retry queue
//
// When a request fails with 401 (TOKEN_EXPIRED):
//   1. Pause all pending requests
//   2. Call POST /auth/refresh (sends refresh_token cookie)
//   3. On success: retry ALL queued requests
//   4. On failure: force logout
// ═══════════════════════════════════════════════════════════════
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // Success — pass through
  (response) => response,

  // Error handler
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 with TOKEN_EXPIRED code and avoid infinite loops
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry;

    if (!isTokenExpired) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return api(originalRequest);
      });
    }

    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshRes = await axios.post(
        `${getBaseUrl()}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      // If refresh returns updated user data, update localStorage
      if (refreshRes.data?.user) {
        localStorage.setItem("user", JSON.stringify(refreshRes.data.user));
      }

      // Refresh succeeded — retry all queued requests
      processQueue(null);

      // Retry the original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — force logout
      processQueue(refreshError);

      // Clear local state
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login (only if not already on login page)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
