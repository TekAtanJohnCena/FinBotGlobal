import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Backend adresimiz
});

// Her istekte (Request) çalışacak ayar:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Token var mı bak
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Varsa başlığa ekle
  }
  return config;
});

export default api;