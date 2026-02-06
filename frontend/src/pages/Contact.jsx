import React, { useState } from "react";
import { Link } from "react-router-dom";

import toast, { Toaster } from 'react-hot-toast';
import LanguageSelector from "../components/LanguageSelector";

// GÖRSELLER
import logo from "../images/logo1.png";

const Contact = () => {


  // Form state
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasyonlar
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !message.trim()) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }

    setLoading(true);

    try {
      // API call (şimdilik mock)
      // const API_URL = process.env.REACT_APP_API_URL || 'https://kabc8j4wap.us-east-1.awsapprunner.com';
      // await fetch(`${API_URL}/api/contact`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ companyName, contactName, email, phone, employeeCount, message })
      // });

      // Simüle edilmiş gecikme
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Enterprise Contact Form Submitted:', {
        companyName,
        contactName,
        email,
        phone,
        employeeCount,
        message,
        submittedAt: new Date().toISOString()
      });

      setSubmitted(true);
      toast.success('Mesajınız başarıyla gönderildi!');
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Bir hata oluştu, lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  const styles = `
    /* GLOBAL */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
      min-height: 100vh !important;
      background: #0a0a0a !important;
    }

    /* WRAPPER */
    .contact-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #080a0e 0%, #0f1218 40%, #0a0c10 100%);
      display: flex;
      position: relative;
      overflow: hidden;
    }
    
    /* Background decoration */
    .contact-wrapper::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 80%;
      height: 150%;
      background: radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 60%);
      pointer-events: none;
    }
    
    .contact-wrapper::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 60%;
      height: 100%;
      background: radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 50%);
      pointer-events: none;
    }

    /* FORM SIDE */
    .contact-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      z-index: 1;
    }

    .contact-form-container {
      width: 100%;
      max-width: 520px;
      padding: 2rem;
    }

    /* LOGO */
    .contact-logo {
      height: 40px;
      margin-bottom: 2rem;
    }

    /* HEADER */
    .contact-header {
      margin-bottom: 2rem;
    }
    
    .contact-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.1) 100%);
      border: 1px solid rgba(139,92,246,0.3);
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #a78bfa;
      margin-bottom: 1rem;
    }

    .contact-title {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.75rem 0;
      line-height: 1.2;
    }

    .contact-subtitle {
      color: #888;
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* FORM ELEMENTS */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      color: #aaa;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .form-label .required {
      color: #ef4444;
      margin-left: 2px;
    }

    /* GLASSMORPHISM INPUTS */
    .glass-input {
      width: 100%;
      padding: 0.85rem 1rem;
      background: rgba(255, 255, 255, 0.03);
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
      color: rgba(255, 255, 255, 0.35);
    }

    .glass-input:focus {
      border-color: #8b5cf6;
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
    }
    
    .glass-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23888' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      padding-right: 2.5rem;
    }
    
    .glass-select option {
      background: #1a1a1a;
      color: #fff;
    }
    
    .glass-textarea {
      min-height: 120px;
      resize: vertical;
    }

    /* PRIMARY BUTTON */
    .btn-primary {
      width: 100%;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(139, 92, 246, 0.45);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* FOOTER */
    .contact-footer {
      text-align: center;
      color: #666;
      margin-top: 1.5rem;
      font-size: 0.8rem;
    }

    .contact-link {
      color: #8b5cf6;
      text-decoration: none;
      font-weight: 500;
    }

    .contact-link:hover {
      color: #a78bfa;
    }

    /* INFO SIDE */
    .contact-info-side {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      z-index: 1;
    }

    .info-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 400px;
      width: 100%;
    }
    
    .info-card-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 1.5rem 0;
    }
    
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .info-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.1) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .info-content h4 {
      margin: 0 0 0.25rem 0;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 500;
    }
    
    .info-content p {
      margin: 0;
      color: #888;
      font-size: 0.85rem;
      line-height: 1.4;
    }
    
    /* Enterprise Features */
    .enterprise-features {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    
    .enterprise-features h5 {
      color: #aaa;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0 0 1rem 0;
    }
    
    .feature-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .feature-tag {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: #10b981;
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    /* SUCCESS STATE */
    .success-container {
      text-align: center;
      padding: 3rem 2rem;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2.5rem;
      box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
    }
    
    .success-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.75rem 0;
    }
    
    .success-message {
      color: #888;
      font-size: 0.95rem;
      margin: 0 0 2rem 0;
      line-height: 1.6;
    }
    
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    /* MOBILE */
    @media (max-width: 900px) {
      .contact-info-side {
        display: none;
      }

      .contact-form-side {
        padding: 1rem;
      }

      .contact-form-container {
        padding: 1rem;
      }

      .contact-logo {
        height: 32px;
        margin-bottom: 1.5rem;
      }

      .contact-title {
        font-size: 1.5rem;
      }

      .contact-subtitle {
        font-size: 0.85rem;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .glass-input {
        padding: 0.75rem 0.9rem;
        font-size: 0.85rem;
      }

      .btn-primary {
        padding: 0.85rem 1.25rem;
        font-size: 0.9rem;
      }
    }
  `;

  if (submitted) {
    return (
      <>
        <style>{styles}</style>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' } }} />

        <div className="contact-wrapper">
          <div className="contact-form-side">
            <div className="contact-form-container">
              <Link to="/">
                <img src={logo} alt="Finbot" className="contact-logo" />
              </Link>

              <div className="success-container">
                <div className="success-icon">✓</div>
                <h2 className="success-title">Mesajınız Alındı!</h2>
                <p className="success-message">
                  Enterprise ekibimiz en kısa sürede sizinle iletişime geçecektir.
                  Genellikle 24 saat içinde dönüş yapıyoruz.
                </p>
                <Link to="/" className="btn-secondary">
                  ← Ana Sayfaya Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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

      <div className="contact-wrapper">
        <div className="contact-form-side">
          <div className="contact-form-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <Link to="/">
                <img src={logo} alt="Finbot" className="contact-logo" style={{ margin: 0 }} />
              </Link>
              <LanguageSelector />
            </div>

            <div className="contact-header">
              <div className="contact-badge">
                <span>🏢</span>
                <span>Enterprise</span>
              </div>
              <h1 className="contact-title">Kurumsal Çözümler</h1>
              <p className="contact-subtitle">
                Şirketinize özel yapay zeka destekli finansal analiz çözümleri için ekibimizle iletişime geçin.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Şirket Adı / Yetkili */}
              <div className="form-row">
                <div>
                  <label className="form-label">
                    Şirket Adı <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ABC Holding A.Ş."
                    required
                  />
                </div>
                <div>
                  <label className="form-label">
                    Yetkili Adı <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ad Soyad"
                    required
                  />
                </div>
              </div>

              {/* E-posta / Telefon */}
              <div className="form-row">
                <div>
                  <label className="form-label">
                    Kurumsal E-posta <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    className="glass-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yetkili@sirket.com"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="glass-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Çalışan Sayısı */}
              <div className="form-group">
                <label className="form-label">Çalışan Sayısı</label>
                <select
                  className="glass-input glass-select"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                >
                  <option value="">Seçiniz</option>
                  <option value="1-10">1-10 Kişi</option>
                  <option value="11-50">11-50 Kişi</option>
                  <option value="51-200">51-200 Kişi</option>
                  <option value="201-500">201-500 Kişi</option>
                  <option value="500+">500+ Kişi</option>
                </select>
              </div>

              {/* Mesaj */}
              <div className="form-group">
                <label className="form-label">
                  Mesajınız <span className="required">*</span>
                </label>
                <textarea
                  className="glass-input glass-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hangi çözümlerle ilgileniyorsunuz? İhtiyaçlarınızı kısaca açıklayın..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>📩 Mesaj Gönder</>
                )}
              </button>
            </form>

            <p className="contact-footer">
              Bireysel planlar için{" "}
              <Link to="/#pricing" className="contact-link">fiyatlandırma sayfamızı</Link>
              {" "}ziyaret edin.
            </p>
          </div>
        </div>

        <div className="contact-info-side">
          <div className="info-card">
            <h3 className="info-card-title">Neden Enterprise?</h3>

            <div className="info-item">
              <div className="info-icon">🔐</div>
              <div className="info-content">
                <h4>Özel Güvenlik</h4>
                <p>On-premise kurulum, SSO entegrasyonu ve özel veri izolasyonu</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">⚡</div>
              <div className="info-content">
                <h4>Sınırsız Kullanım</h4>
                <p>Tüm kullanıcılar için sınırsız API çağrısı ve analiz</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">🎯</div>
              <div className="info-content">
                <h4>Özel Eğitim</h4>
                <p>Şirketinize özel AI model eğitimi ve özelleştirme</p>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">🤝</div>
              <div className="info-content">
                <h4>Dedicated Destek</h4>
                <p>7/24 öncelikli teknik destek ve hesap yöneticisi</p>
              </div>
            </div>

            <div className="enterprise-features">
              <h5>Enterprise Özellikleri</h5>
              <div className="feature-list">
                <span className="feature-tag">✓ API Erişimi</span>
                <span className="feature-tag">✓ Özel Raporlar</span>
                <span className="feature-tag">✓ SLA Garantisi</span>
                <span className="feature-tag">✓ Audit Logs</span>
                <span className="feature-tag">✓ Multi-tenant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
