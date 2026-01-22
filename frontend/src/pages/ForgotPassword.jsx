import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Backend URL (Port 5000)
      const response = await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });

      setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen mail kutunuzu kontrol edin.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu. Kullanıcı bulunamadı veya sunucu hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-width-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Şifremi Unuttum</h2>
          <p className="text-slate-400">Hesabınıza erişmek için e-posta adresinizi girin.</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 rounded-xl text-center text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2 text-left">
              E-posta Adresi
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="ornek@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
