import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

// GOOGLE IMPORT
import { GoogleLogin } from '@react-oauth/google';

// GÖRSELLER
import heroImage from "../images/finbot-auth-hero.png";
import logo from "../images/logo1.png";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast.error("E-posta/Kullanıcı adı ve şifre gerekli.");
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      toast.success('Giriş başarılı! Yönlendiriliyorsunuz...');
      window.location.href = "/chat";
    } catch (err) {
      const errorMessage = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || "Giriş başarısız!";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      await googleLogin(credentialResponse.credential);
      toast.success("Google ile giriş başarılı! 🚀");
      window.location.href = "/chat";
    } catch (error) {
      console.error(error);
      toast.error("Google girişi sırasında bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ============================================
           GLOBAL RESET - NO SCROLL
           ============================================ */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          height: 100vh !important;
          width: 100vw !important;
        }

        /* ============================================
           MAIN WRAPPER - FIXED FULLSCREEN
           ============================================ */
        .auth-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #080a0e 0%, #0f1218 40%, #0a0c10 100%);
          display: flex;
          overflow: hidden;
        }

        /* ============================================
           LEFT SIDE - FORM
           ============================================ */
        .auth-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
        }

        .auth-form-container {
          width: 100%;
          max-width: 420px;
          padding: 2rem;
        }

        /* ============================================
           LOGO & HEADERS
           ============================================ */
        .auth-logo {
          height: 42px;
          margin-bottom: 2rem;
          display: block;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 2rem 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        /* ============================================
           FORM LAYOUT
           ============================================ */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .form-link {
          color: #58a6ff;
          font-size: 0.8rem;
          text-decoration: none;
          transition: color 0.2s;
        }

        .form-link:hover {
          color: #79b8ff;
        }

        /* ============================================
           GLASSMORPHISM INPUT FIELDS
           ============================================ */
        .glass-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .glass-input:focus {
          border-color: rgba(88, 166, 255, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.12);
        }

        /* ============================================
           PRIMARY BUTTON WITH GLOW
           ============================================ */
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
          margin-top: 0.5rem;
          box-shadow: 
            0 4px 15px rgba(59, 130, 246, 0.35),
            0 0 30px rgba(59, 130, 246, 0.15);
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 
            0 6px 25px rgba(59, 130, 246, 0.45),
            0 0 40px rgba(59, 130, 246, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
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

        /* ============================================
           DIVIDER - SUBTLE
           ============================================ */
        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          gap: 1rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }

        .divider-text {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.8rem;
          text-transform: lowercase;
        }

        /* ============================================
           GOOGLE BUTTON CONTAINER
           ============================================ */
        .google-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        /* ============================================
           FOOTER LINK
           ============================================ */
        .auth-footer {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 1.5rem;
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

        /* ============================================
           RIGHT SIDE - HERO IMAGE
           ============================================ */
        .auth-image-side {
          flex: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(37, 99, 235, 0.02) 100%);
          position: relative;
          overflow: hidden;
        }

        .auth-image-side::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 40%);
          pointer-events: none;
        }

        .hero-image {
          max-width: 90%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
          position: relative;
          z-index: 1;
        }

        /* ============================================
           MOBILE RESPONSIVE
           ============================================ */
        @media (max-width: 900px) {
          .auth-image-side {
            display: none;
          }

          .auth-form-side {
            padding: 1.5rem;
          }

          .auth-form-container {
            padding: 1rem;
          }
        }

        @media (max-width: 768px) {
          .auth-title {
            font-size: 1.5rem;
          }

          .auth-subtitle {
            font-size: 0.85rem;
          }
        }
      `}</style>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 18, 24, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
          },
        }}
      />

      <div className="auth-wrapper">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <Link to="/">
              <img src={logo} alt="Finbot Logo" className="auth-logo" />
            </Link>

            <h1 className="auth-title">Tekrar Hoşgeldiniz</h1>
            <p className="auth-subtitle">
              Portföyünüzü yönetmeye devam etmek için giriş yapın.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email/Username Input - Dual Login */}
              <div className="form-group">
                <label className="form-label">E-posta veya Kullanıcı Adı</label>
                <input
                  type="text"
                  className="glass-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="ornek@finbot.com veya kullanici_adi"
                  autoComplete="username"
                />
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" style={{ marginBottom: 0 }}>Şifre</label>
                  <Link to="/forgot-password" className="form-link">
                    Şifremi unuttum
                  </Link>
                </div>
                <input
                  type="password"
                  className="glass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">veya</span>
              <div className="divider-line" />
            </div>

            {/* Google Login */}
            <div className="google-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google bağlantısı başarısız.")}
                theme="filled_black"
                shape="pill"
                width="100%"
                text="continue_with"
              />
            </div>

            {/* Footer */}
            <p className="auth-footer">
              Hesabınız yok mu?{" "}
              <Link to="/register" className="auth-link">Hemen kayıt olun</Link>
            </p>
          </div>
        </div>

        <div className="auth-image-side">
          <img src={heroImage} alt="Finbot" className="hero-image" />
        </div>
      </div>
    </>
  );
};

export default Login;