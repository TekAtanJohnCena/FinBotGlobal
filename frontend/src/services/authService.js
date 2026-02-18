import api from '../lib/api';

// Kayıt Olma İsteği
const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Giriş Yapma İsteği
const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// Çıkış Yapma
const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Even if API fails, clear local state
  }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Şu anki kullanıcıyı hafızadan getir
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Şifremi Unuttum İsteği
const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgotpassword', { email });
  return response.data;
};

// Şifreyi Sıfırlama İsteği
const resetPassword = async (token, password) => {
  const response = await api.put(`/auth/resetpassword/${token}`, { password });
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