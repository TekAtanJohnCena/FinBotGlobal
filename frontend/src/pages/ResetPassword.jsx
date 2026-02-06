import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

/**
 * ResetPassword Component (Path Params Version)
 * Uses useParams for stable token extraction from the URL segment.
 */
const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Dynamic token extraction from URL path segment (/reset-password/:token)
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // 1. Token Check
        if (!token) {
            setError('Önemli: URL içerisinde geçerli bir token bulunamadı. Lütfen mailinizdeki linke tekrar tıklayın.');
            return;
        }

        // 2. Password Match Check
        if (password !== confirmPassword) {
            setError('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
            return;
        }

        setLoading(true);

        try {
            // Backend URL (App Runner)
            const API_URL = process.env.REACT_APP_API_URL || 'https://kabc8j4wap.us-east-1.awsapprunner.com';
            await axios.put(`${API_URL}/api/auth/resetpassword/${token}`, { password });

            setMessage('Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Şifre sıfırlama işlemi başarısız oldu. Linkin süresi dolmuş veya geçersiz olabilir.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-md w-full bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Yeni Şifre Belirle</h2>
                    <p className="text-slate-400">Güvenliğiniz için yeni bir şifre giriniz.</p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-center text-sm font-medium">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-6 p-4 bg-green-900/30 border border-green-800 text-green-400 rounded-xl text-center text-sm font-medium">
                        {message}
                    </div>
                )}

                {/* Form is always visible */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 text-left">
                            Yeni Şifre
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 text-left">
                            Yeni Şifre (Tekrar)
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Giriş sayfasına dön
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
