import axios from "axios";

const getBaseUrl = () => {
  let url = process.env.REACT_APP_API_URL || 'https://kabc8j4wap.us-east-1.awsapprunner.com';
  // Remove trailing slash if exists
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // Append /api only if not already present
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

// ✅ Production'da backend farklı domain'de olabilir
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // ✅ PROD için zorunlu (cookie-based auth)
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
