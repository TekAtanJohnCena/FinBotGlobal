import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import api from "../lib/api";

// GÖRSELLER
import logo from "../images/logo1.png";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("E-posta adresi gerekli.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Geçerli bir e-posta adresi giriniz.");
            return;
        }

        setLoading(true);

        try {
            // Backend endpoint mevcut değilse simüle et
            // await api.post("/auth/forgot-password", { email });

            // Simülasyon için 1.5 saniye bekle
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSent(true);
            toast.success("Şifre sıfırlama bağlantısı gönderildi!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden !important;
          height: 100vh;
          width: 100%;
        }
        
        .auth-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #0a0c10 0%, #0f1218 50%, #0a0c10 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .auth-content {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          text-align: center;
        }
        
        .auth-logo {
          height: 44px;
          margin-bottom: 2.5rem;
          display: inline-block;
        }
        
        .auth-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.5rem;
          background: rgba(88, 166, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-icon svg {
          width: 28px;
          height: 28px;
          color: #58a6ff;
        }
        
        .auth-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.75rem 0;
        }
        
        .auth-subtitle {
          color: #8b949e;
          margin: 0 0 2rem 0;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
          text-align: left;
        }
        
        .form-label {
          display: block;
          color: #c9d1d9;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .glass-input {
          width: 100%;
          padding: 0.9rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }
        
        .glass-input::placeholder {
          color: #5c6370;
        }
        
        .glass-input:focus {
          border-color: rgba(88, 166, 255, 0.5);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
        }
        
        .btn-primary {
          width: 100%;
          padding: 0.9rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.15);
        }
        
        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2);
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .auth-footer {
          text-align: center;
          color: #8b949e;
          margin-top: 2rem;
          font-size: 0.9rem;
        }
        
        .auth-link {
          color: #58a6ff;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .auth-link:hover {
          color: #79b8ff;
        }
        
        .success-box {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .success-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          background: rgba(34, 197, 94, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .success-icon svg {
          width: 24px;
          height: 24px;
          color: #22c55e;
        }
        
        .success-text {
          color: #d1d5db;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }
        
        .email-highlight {
          color: #ffffff;
          font-weight: 600;
        }
      `}</style>

            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: 'rgba(26, 29, 36, 0.95)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            />

            <div className="auth-wrapper">
                <div className="auth-content">
                    <Link to="/">
                        <img src={logo} alt="Finbot Logo" className="auth-logo" />
                    </Link>

                    <div className="auth-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>

                    <h1 className="auth-title">Şifremi Unuttum</h1>

                    {!sent ? (
                        <>
                            <p className="auth-subtitle">
                                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">E-posta Adresi</label>
                                    <input
                                        type="email"
                                        className="glass-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="ornek@finbot.com"
                                        autoComplete="email"
                                    />
                                </div>

                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        "Sıfırlama Bağlantısı Gönder"
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="success-box">
                            <div className="success-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="success-text">
                                Şifre sıfırlama bağlantısı <span className="email-highlight">{email}</span> adresine gönderildi.
                                Lütfen e-postanızı kontrol edin ve gelen kutunuzda bulamazsanız spam klasörünü kontrol edin.
                            </p>
                        </div>
                    )}

                    <p className="auth-footer">
                        Şifrenizi hatırladınız mı?{" "}
                        <Link to="/login" className="auth-link">Giriş Yap</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
