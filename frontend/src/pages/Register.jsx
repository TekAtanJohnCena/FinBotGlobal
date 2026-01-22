import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

// GOOGLE IMPORT
import { GoogleLogin } from '@react-oauth/google';

// GLOBAL PHONE INPUT
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/phone-input-dark.css';

// GÖRSELLER
import heroImage from "../images/finbot-auth-hero.png";
import logo from "../images/logo1.png";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, googleLogin } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !phoneNumber || !birthDate || !username.trim() || !email.trim() || !password.trim()) {
      toast.error("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Geçerli bir e-posta adresi giriniz.");
      return;
    }

    if (phoneNumber.length < 10) {
      toast.error("Geçerli bir telefon numarası giriniz.");
      return;
    }

    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < 18 || age > 120) {
      toast.error("18 yaşından büyük olmalısınız.");
      return;
    }

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (username.length < 3) {
      toast.error("Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: `+${phoneNumber}`,
        birthDate,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });
      toast.success('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      window.location.href = "/login";
    } catch (err) {
      const errorMessage = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || "Kayıt başarısız! Lütfen bilgilerinizi kontrol edin.";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      await googleLogin(credentialResponse.credential);
      toast.success("Google ile kayıt başarılı! 🚀");
      window.location.href = "/chat";
    } catch (error) {
      console.error(error);
      toast.error("Google kaydı sırasında bir hata oluştu.");
      setLoading(false);
    }
  };

  const styles = `
    /* GLOBAL - NO SCROLL */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      height: 100vh !important;
      width: 100vw !important;
      background: #0a0a0a !important;
    }

    /* WRAPPER */
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

    /* FORM SIDE */
    .auth-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    /* SCROLLABLE FORM CONTAINER - Hidden scrollbar */
    .auth-form-container {
      width: 100%;
      max-width: 440px;
      max-height: 95vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1.5rem;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .auth-form-container::-webkit-scrollbar {
      display: none;
    }

    /* LOGO */
    .auth-logo {
      height: 36px;
      margin-bottom: 1.25rem;
    }

    /* TITLE */
    .auth-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.4rem 0;
    }

    .auth-subtitle {
      color: #888;
      margin: 0 0 1.25rem 0;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    /* FORM ROW - 2 columns, stacks on mobile */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin-bottom: 0.65rem;
    }

    .form-group {
      margin-bottom: 0.65rem;
    }

    /* Phone group - high z-index */
    .phone-group {
      position: relative;
      z-index: 1000;
    }

    .form-label {
      display: block;
      color: #aaa;
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .form-hint {
      color: #666;
      font-size: 0.7rem;
      margin-top: 0.25rem;
    }

    /* GLASSMORPHISM INPUTS */
    .glass-input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }

    .glass-input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .glass-input:focus {
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    /* Date input fix */
    .glass-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1) opacity(0.4);
      cursor: pointer;
    }

    /* PRIMARY BUTTON - GLOW */
    .btn-primary {
      width: 100%;
      padding: 0.8rem 1.25rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
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

    /* DIVIDER */
    .divider {
      display: flex;
      align-items: center;
      margin: 1rem 0;
      gap: 0.75rem;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.08);
    }

    .divider-text {
      color: #555;
      font-size: 0.7rem;
      text-transform: lowercase;
    }

    /* GOOGLE BUTTON - SAME WIDTH AS PRIMARY */
    .google-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .google-container > div {
      width: 100% !important;
    }

    /* FOOTER */
    .auth-footer {
      text-align: center;
      color: #777;
      margin-top: 1rem;
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

    /* IMAGE SIDE */
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
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
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

    /* MOBILE - HIDE IMAGE */
    @media (max-width: 900px) {
      .auth-image-side {
        display: none;
      }

      /* Compact mobile layout - side-by-side name fields kept */
      .auth-form-side {
        padding: 0.5rem;
        align-items: flex-start;
        padding-top: 0.75rem;
      }

      .auth-form-container {
        padding: 0.75rem;
        max-height: 100vh;
      }

      .auth-logo {
        height: 26px;
        margin-bottom: 0.5rem;
      }

      .auth-title {
        font-size: 1.25rem;
        margin-bottom: 0.15rem;
      }

      .auth-subtitle {
        display: none;
      }

      /* KEEP SIDE-BY-SIDE on mobile - like desktop */
      .form-row {
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
      }

      .form-group {
        margin-bottom: 0.4rem;
      }

      .form-label {
        font-size: 0.7rem;
        margin-bottom: 0.2rem;
      }

      .form-hint {
        display: none;
      }

      /* Slightly larger inputs for touch */
      .glass-input {
        padding: 0.55rem 0.7rem;
        font-size: 0.8rem;
        border-radius: 6px;
      }

      .btn-primary {
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
        margin-top: 0.3rem;
        border-radius: 8px;
      }

      .divider {
        margin: 0.5rem 0;
      }

      .divider-text {
        font-size: 0.65rem;
      }

      .auth-footer {
        margin-top: 0.5rem;
        font-size: 0.75rem;
      }
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
            <Link to="/">
              <img src={logo} alt="Finbot" className="auth-logo" />
            </Link>

            <h1 className="auth-title">Aramıza Katılın</h1>
            <p className="auth-subtitle">
              Finansal analizlerinizi bir üst seviyeye taşıyın.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Ad / Soyad - Stacks vertically on mobile */}
              <div className="form-row">
                <div style={{ marginBottom: 0 }}>
                  <label className="form-label">Ad</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Adınız"
                  />
                </div>
                <div style={{ marginBottom: 0 }}>
                  <label className="form-label">Soyad</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Soyadınız"
                  />
                </div>
              </div>

              {/* Telefon / Doğum Tarihi */}
              <div className="form-row">
                <div className="phone-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Telefon</label>
                  <PhoneInput
                    country={'tr'}
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    inputClass="glass-input"
                    containerStyle={{ position: 'relative', zIndex: 1000 }}
                    dropdownStyle={{ zIndex: 99999 }}
                    enableSearch={true}
                    searchPlaceholder="Ülke ara..."
                    placeholder="5XX XXX XX XX"
                  />
                </div>
                <div style={{ marginBottom: 0 }}>
                  <label className="form-label">Doğum Tarihi</label>
                  <input
                    type="date"
                    className="glass-input"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Kullanıcı Adı */}
              <div className="form-group">
                <label className="form-label">Kullanıcı Adı</label>
                <input
                  type="text"
                  className="glass-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="kullanici_adi"
                />
                <div className="form-hint">Harf, rakam ve alt çizgi kullanın</div>
              </div>

              {/* E-posta */}
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input
                  type="email"
                  className="glass-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@finbot.com"
                />
              </div>

              {/* Şifre */}
              <div className="form-group">
                <label className="form-label">Şifre</label>
                <input
                  type="password"
                  className="glass-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <div className="form-hint">En az 6 karakter</div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">veya</span>
              <div className="divider-line" />
            </div>

            <div className="google-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google bağlantısı başarısız.")}
                theme="filled_black"
                shape="pill"
                width="100%"
                text="signup_with"
              />
            </div>

            <p className="auth-footer">
              Zaten hesabınız var mı?{" "}
              <Link to="/login" className="auth-link">Giriş Yap</Link>
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