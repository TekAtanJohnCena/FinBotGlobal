import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import LanguageSelector from "../components/LanguageSelector";

// GOOGLE IMPORT
import { GoogleLogin } from '@react-oauth/google';

// GÖRSELLER
import heroImage from "../images/finbot-auth-hero.png";
import logo from "../images/logo1.png";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, googleLogin } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('auth.validEmail'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordLength'));
      return;
    }

    setLoading(true);

    try {
      await register({
        email: email.trim().toLowerCase(),
        password
      });
      toast.success(t('auth.registerSuccess'));
      window.location.href = "/chat";
    } catch (err) {
      const errorMessage = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || t('auth.registerFailed');
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      await googleLogin(credentialResponse.credential);
      toast.success(t('auth.googleSuccess'));
      window.location.href = "/chat";
    } catch (error) {
      console.error(error);
      toast.error(t('auth.googleFailed'));
      setLoading(false);
    }
  };

  const styles = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      height: 100vh !important;
      width: 100vw !important;
      background: #0a0a0a !important;
    }

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

    .auth-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .auth-form-container {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
    }

    .auth-logo {
      height: 36px;
      margin-bottom: 1.5rem;
    }

    .auth-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.4rem 0;
    }

    .auth-subtitle {
      color: #888;
      margin: 0 0 1.75rem 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      color: #aaa;
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-hint {
      color: #555;
      font-size: 0.7rem;
      margin-top: 0.3rem;
    }

    .glass-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }

    .glass-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .glass-input:focus {
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.06);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    .btn-primary {
      width: 100%;
      padding: 0.85rem 1.25rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 28px rgba(59, 130, 246, 0.45);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .divider {
      display: flex;
      align-items: center;
      margin: 1.25rem 0;
      gap: 0.75rem;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.08);
    }

    .divider-text {
      color: #555;
      font-size: 0.75rem;
    }

    .google-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .google-container > div {
      width: 100% !important;
    }

    .auth-footer {
      text-align: center;
      color: #777;
      margin-top: 1.25rem;
      font-size: 0.8rem;
    }

    .auth-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .auth-link:hover {
      color: #60a5fa;
    }

    .auth-image-side {
      flex: 1.1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 100%);
      position: relative;
    }

    .auth-image-side::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at 30% 30%, rgba(59,130,246,0.08) 0%, transparent 50%);
    }

    .hero-image {
      max-width: 85%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 16px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.5);
      position: relative;
      z-index: 1;
    }

    @media (max-width: 900px) {
      .auth-image-side { display: none; }
      .auth-form-side { padding: 1rem; }
      .auth-form-container { padding: 1.25rem; }
    }
  `;

  return (
    <>
      <style>{styles}</style>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          },
        }}
      />

      <div className="auth-wrapper">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Link to="/">
                <img src={logo} alt="Finbot" className="auth-logo" style={{ margin: 0 }} />
              </Link>
              <LanguageSelector />
            </div>

            <h1 className="auth-title">{t('auth.registerTitle')}</h1>
            <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

            <form onSubmit={handleSubmit}>
              {/* E-posta */}
              <div className="form-group">
                <label className="form-label">{t('auth.email')}</label>
                <input
                  type="email"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="email"
                />
              </div>

              {/* Şifre */}
              <div className="form-group">
                <label className="form-label">{t('auth.password')}</label>
                <input
                  type="password"
                  className="glass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete="new-password"
                />
                <div className="form-hint">{t('auth.passwordHint')}</div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    {t('auth.registering')}
                  </>
                ) : (
                  t('auth.registerButton')
                )}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">{t('auth.orContinueWith')}</span>
              <div className="divider-line" />
            </div>

            <div className="google-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google bağlantısı başarısız.")}
                theme="filled_black"
                shape="pill"
                text="signup_with"
              />
            </div>

            <p className="auth-footer">
              {t('auth.haveAccount')}{" "}
              <Link to="/login" className="auth-link">{t('auth.signIn')}</Link>
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

export default Register;