import axios from 'axios';

// Backend adresin (Backend 5000 portunda çalışıyorsa)
const API_URL = 'http://localhost:5000/api/auth';

// Kayıt Olma İsteği
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);

  // Eğer backend token dönerse onu kaydedelim (Opsiyonel, genelde login'de olur)
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Giriş Yapma İsteği
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);

  // Backend'den gelen token ve kullanıcı verisini tarayıcı hafızasına (Local Storage) atıyoruz
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Çıkış Yapma (Sadece hafızayı temizler)
const logout = () => {
  localStorage.removeItem('user');
};

// Şu anki kullanıcıyı hafızadan getir
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
}

// Şifremi Unuttum İsteği
const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/forgotpassword`, { email });
  return response.data;
};

// Şifreyi Sıfırlama İsteği
const resetPassword = async (token, password) => {
  const response = await axios.put(`${API_URL}/resetpassword/${token}`, { password });
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword
};

export default authService;