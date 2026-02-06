import axios from "axios";

// ✅ Production'da backend farklı domain'de olabilir
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'https://kabc8j4wap.us-east-1.awsapprunner.com/api',
  withCredentials: true, // ✅ PROD için zorunlu (cookie-based auth)
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
