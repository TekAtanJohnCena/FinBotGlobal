import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/landing.css";
import logo from "../images/logo1.png";
import nvidiaLogo from "../images/nvidia-logo.svg";
import Footer from "../components/Footer";
import Pricing from "./Pricing";

// 👇 GÜNCELLENEN IMPORTLAR
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import api from "../lib/api";
import toast, { Toaster } from "react-hot-toast";

/* =========================================
   YARDIMCI BİLEŞENLER (MOCK, Placeholder vb.)
   ========================================= */

/** Pencere/çerçeve mock */
function MockWindow({ children, title = "Finbot • Örnek Görünüm" }) {
  return (
    <div className="mock-window rounded-4 shadow-lg border">
      <div className="mock-chrome d-flex align-items-center justify-content-between px-3 py-2">
        <div className="d-flex align-items-center gap-2">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="mock-title ms-2">{title}</span>
        </div>
        <div className="small text-dim">finbot.com.tr</div>
      </div>
      <div className="mock-body">{children}</div>
    </div>
  );
}

/* ===== İletişim (modern) ===== */
function ContactPanel() {
  const { t } = useContext(LanguageContext);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState("idle"); // idle | sending | invalid | sent

  const isEmail = (v) => /\S+@\S+\.\S+/.test(v);
  const valid =
    form.name.trim().length > 1 &&
    isEmail(form.email) &&
    form.message.trim().length >= 6;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setState("invalid");
      toast.error("Lütfen tüm alanları doğru şekilde doldurunuz.");
      return;
    }
    setState("sending");

    try {
      const payload = {
        contactName: form.name,
        email: form.email,
        message: form.message,
        companyName: "Landing Page Ziyaretçisi"
      };

      const res = await api.post("/contact", payload);

      // If status is 200, we consider it a success even if res.data.success is missing
      if (res.status === 200 && (res.data?.success !== false)) {
        setState("sent");
        toast.success("Mesajınız başarıyla iletildi!");

        // Scroll to the success message
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        console.warn("Contact API returned check failure:", res.data);
        setState("invalid");
        toast.error(res.data?.message || "Mesaj gönderilemedi.");
      }
    } catch (error) {

      console.error("Form submission error:", error);
      setState("invalid");

      const errorMsg = error.response?.data?.message || "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
      toast.error(errorMsg);
    }
  };

  return (
    <section id="contact" className="section-pad">
      <div className="container">
        <div className="contact-modern rounded-4 p-4 p-lg-5">
          <div className="row gy-4 align-items-center">
            {/* Sol: içerik */}
            <div className="col-lg-5">
              <h3 className="mb-2 text-white">{t('contact.title')}</h3>
              <p className="text-soft mb-4">
                {t('contact.description')}
              </p>

              <ul className="list-unstyled text-soft mb-4">
                <li className="mb-2">
                  <span className="icon-circle me-2">
                    <i className="bi bi-shield-check" />
                  </span>
                  {t('contact.feature1')}
                </li>
                <li className="mb-2">
                  <span className="icon-circle me-2">
                    <i className="bi bi-plug" />
                  </span>
                  {t('contact.feature2')}
                </li>
                <li className="mb-2">
                  <span className="icon-circle me-2">
                    <i className="bi bi-headset" />
                  </span>
                  {t('contact.feature3')}
                </li>
              </ul>

              <div className="d-flex flex-wrap gap-2">
                <a className="chip" href={`mailto:${t('contact.email')}`}>
                  <i className="bi bi-envelope me-2" />
                  {t('contact.email')}
                </a>
                <a className="chip" href="#pricing">
                  <i className="bi bi-currency-exchange me-2" />
                  {t('contact.viewPlans')}
                </a>
              </div>
            </div>

            {/* Sağ: form veya başarı kartı */}
            <div className="col-lg-7">
              {state === "sent" ? (
                <div className="success-card p-4 rounded-4">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-check2-circle fs-3 text-success me-2" />
                    <h5 className="m-0 text-white">{t('contact.successTitle')}</h5>
                  </div>
                  <p className="text-soft mb-0">
                    {t('contact.successMessage')}
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="form-floating">
                      <input
                        id="cname"
                        className={`form-control form-control-lg ${state === "invalid" && form.name.trim().length < 2
                          ? "is-invalid"
                          : ""
                          }`}
                        placeholder={t('contact.namePlaceholder')}
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                      <label htmlFor="cname">{t('contact.namePlaceholder')}</label>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="form-floating">
                      <input
                        id="cemail"
                        type="email"
                        className={`form-control form-control-lg ${state === "invalid" && !isEmail(form.email)
                          ? "is-invalid"
                          : ""
                          }`}
                        placeholder={t('contact.emailPlaceholder')}
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                      <label htmlFor="cemail">{t('contact.emailPlaceholder')}</label>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-floating">
                      <textarea
                        id="cmsg"
                        className={`form-control ${state === "invalid" && form.message.trim().length < 6
                          ? "is-invalid"
                          : ""
                          }`}
                        placeholder={t('contact.messagePlaceholder')}
                        style={{ height: "140px" }}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                      />
                      <label htmlFor="cmsg">{t('contact.messagePlaceholder')}</label>
                    </div>
                  </div>

                  <div className="col-12 d-flex align-items-center gap-2">
                    <button
                      className="btn btn-primary btn-lg rounded-pill px-4"
                      disabled={state === "sending"}
                    >
                      {state === "sending" ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t('contact.sending')}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2" />
                          {t('contact.sendButton')}
                        </>
                      )}
                    </button>
                    <span className="text-dim small">
                      {t('contact.responseTime')}
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== S.S.S. ===== */
function FAQSection() {
  const { t } = useContext(LanguageContext);
  const faqItems = t('faq.items');

  // Defensive check: ensure faqItems is an array
  if (!Array.isArray(faqItems)) {
    console.error('FAQ items is not an array:', faqItems);
    return null;
  }

  return (
    <section id="faq" className="section-pad">
      <div className="container">
        <div className="faq-wrap rounded-4 p-4 p-lg-5">
          <h2 className="fw-bold text-white mb-4">{t('faq.title')}</h2>

          <div className="faq-grid">
            {faqItems.map((item, idx) => (
              <details key={idx} className="faq-item">
                <summary className="faq-summary">
                  <span className="faq-q">{item.q}</span>
                  <i className="bi bi-chevron-down faq-caret" />
                </summary>

                <div className="faq-a text-soft">
                  <p className="mb-0">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================
   ANA BİLEŞEN (LANDING)
   ========================================= */

/** Dil Seçici Bileşeni */
function LanguageSelector() {
  const { language, changeLanguage } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  const currentLang = languages.find(lang => lang.code === language);

  return (
    <div className="language-selector">
      <button
        className="lang-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
      >
        <span className="lang-flag">{currentLang?.flag}</span>
        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-name">{lang.name}</span>
              {language === lang.code && <i className="bi bi-check2"></i>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mobil için Inline Dil Seçici */
function MobileLanguageSelector() {
  const { language, changeLanguage } = useContext(LanguageContext);

  const languages = [
    { code: 'tr', name: 'TR', flag: '🇹🇷' },
    { code: 'en', name: 'EN', flag: '🇬🇧' }
  ];

  return (
    <div className="mobile-lang-selector">
      {languages.map(lang => (
        <button
          key={lang.code}
          className={`mobile-lang-btn ${language === lang.code ? 'active' : ''}`}
          onClick={() => changeLanguage(lang.code)}
        >
          <span className="lang-flag">{lang.flag}</span>
          <span className="lang-code">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}

export default function Landing() {
  // 👇 CONTEXT'TEN KULLANICI BİLGİSİNİ VE DİL BİLGİSİNİ ÇEKİYORUZ
  const { user, logout } = useContext(AuthContext);
  const { t, language } = useContext(LanguageContext);

  const [active, setActive] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    const ids = ["home", "features", "pricing", "faq", "contact"];

    const onScroll = () => {
      const y = window.scrollY + 130; // sabit navbar payı
      let current = "home";

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;

        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;

        if (y >= top && y < bottom) {
          current = id;
          break;
        }
      }

      // DÜZELTME: Bu satır fonksiyonun İÇİNDE olmalı
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false); // Mobil menüyü kapat
    }
  };

  return (
    <div className={`min-h-screen w-full page-dark d-flex flex-column overflow-y-auto ${isRTL ? 'rtl' : ''}`}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      {/* NAVBAR */}
      <nav className="navbar navbar-dark fixed-top">
        <div className="container">
          <div className="nav-shell d-flex align-items-center w-100">
            {/* Marka */}
            <a
              className="navbar-brand d-flex align-items-center gap-2 m-0"
              href="#home"
              onClick={(e) => handleNavClick(e, "home")}
            >
              <img src={logo} alt="FinBot Yapay Zeka Finans Asistanı" width="39" height="39" />
              <span className="brand-text">Finbot</span>
            </a>

            {/* Hamburger Buton - Sadece Mobilde */}
            <button
              className="mobile-menu-toggle d-lg-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menüyü aç/kapat"
            >
              <i className={`bi ${mobileMenuOpen ? "bi-x-lg" : "bi-list"}`}></i>
            </button>

            {/* Menü öğeleri - Masaüstünde görünür, mobilde gizli */}
            <ul className="nav-items d-none d-lg-flex align-items-center ms-auto">
              <li>
                <a
                  className={`nav-link ${active === "home" ? "active" : ""}`}
                  href="#home"
                  onClick={(e) => handleNavClick(e, "home")}
                >
                  {t('nav.home')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "features" ? "active" : ""
                    }`}
                  href="#features"
                  onClick={(e) => handleNavClick(e, "features")}
                >
                  {t('nav.features')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "pricing" ? "active" : ""}`}
                  href="#pricing"
                  onClick={(e) => handleNavClick(e, "pricing")}
                >
                  {t('nav.pricing')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "faq" ? "active" : ""}`}
                  href="#faq"
                  onClick={(e) => handleNavClick(e, "faq")}
                >
                  {t('nav.faq')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "contact" ? "active" : ""}`}
                  href="#contact"
                  onClick={(e) => handleNavClick(e, "contact")}
                >
                  {t('nav.contact')}
                </a>
              </li>
              <li>
                <LanguageSelector />
              </li>
              {!user && (
                <li>
                  <Link
                    to="/login"
                    className="btn btn-outline-light btn-sm rounded-pill px-3 ms-2 fw-bold"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Giriş Yap
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Mobil Menü - Hamburger açıldığında gösterilir */}
          <div className={`mobile-menu d-lg-none ${mobileMenuOpen ? "open" : ""}`}>
            <ul className="mobile-nav-items">
              <li>
                <a
                  className={`nav-link ${active === "home" ? "active" : ""}`}
                  href="#home"
                  onClick={(e) => handleNavClick(e, "home")}
                >
                  {t('nav.home')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "features" ? "active" : ""
                    }`}
                  href="#features"
                  onClick={(e) => handleNavClick(e, "features")}
                >
                  {t('nav.features')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "pricing" ? "active" : ""}`}
                  href="#pricing"
                  onClick={(e) => handleNavClick(e, "pricing")}
                >
                  {t('nav.pricing')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "faq" ? "active" : ""}`}
                  href="#faq"
                  onClick={(e) => handleNavClick(e, "faq")}
                >
                  {t('nav.faq')}
                </a>
              </li>
              <li>
                <a
                  className={`nav-link ${active === "contact" ? "active" : ""}`}
                  href="#contact"
                  onClick={(e) => handleNavClick(e, "contact")}
                >
                  {t('nav.contact')}
                </a>
              </li>
              <li className="mt-3">
                <MobileLanguageSelector />
              </li>
              {!user && (
                <li className="mt-2">
                  <Link
                    to="/login"
                    className="btn btn-outline-light rounded-pill px-4 w-100 fw-bold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Giriş Yap
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header id="home" className="hero-dark section-anchor">
        <div className="container">
          <div className="row align-items-center gy-4">
            <div className="col-lg-6">
              <h1 className="hero-title">
                {t('hero.title')} <span className="accent">{t('hero.titleAccent')}</span> {t('hero.titleEnd')}
              </h1>
              <p className="hero-sub text-soft">
                {t('hero.subtitle')}
              </p>

              {/* 👇 GÜNCELLENEN BUTON KISMI */}
              <div className="d-flex flex-wrap gap-3">
                {user ? (
                  // DURUM 1: Giriş Yapılmışsa -> Chat'e Yönlendir + Çıkış Yap
                  <>
                    <Link
                      to="/chat"
                      className="btn btn-outline-light btn-lg rounded-pill px-4 fw-bold btn-hover-white"
                    >
                      {t('hero.startButton')}
                    </Link>
                    <button
                      onClick={logout}
                      className="btn btn-outline-danger btn-lg rounded-pill px-4 btn-hover-white"
                      style={{ borderColor: 'rgba(239,68,68,0.5)', color: 'rgba(239,68,68,0.9)' }}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  // DURUM 2: Giriş Yapılmamışsa -> Kayıt Ol / Paketleri Gör
                  <>
                    <Link
                      to="/register"
                      className="btn btn-outline-light btn-lg rounded-pill px-4 btn-hover-white"
                    >
                      {t('hero.tryFreeButton')}
                    </Link>

                    <Link
                      to="/login"
                      className="btn btn-outline-light btn-lg rounded-pill px-4 btn-hover-white"
                      style={{ borderColor: 'rgba(16,185,129,0.6)', color: '#34d399' }}
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Giriş Yap
                    </Link>

                    <a
                      href="#pricing"
                      className="btn btn-outline-light btn-lg rounded-pill px-4 btn-hover-white"
                    >
                      {t('hero.viewPlansButton')}
                    </a>
                  </>
                )}
              </div>

              <div className="hero-bullets mt-4 text-soft">
                <span>
                  <i className="bi bi-check2-circle me-2"></i>{t('hero.bullet1')}
                </span>
                <span>
                  <i className="bi bi-check2-circle me-2"></i>{t('hero.bullet2')}
                </span>
                <span>
                  <i className="bi bi-check2-circle me-2"></i>{t('hero.bullet3')}
                </span>
              </div>
            </div>

            <div className="col-lg-6">
              <MockWindow title={t('mockWindow.title')}>
                <div className="p-4 h-100">
                  {/* Title & Logo Area */}
                  <div className="d-flex align-items-center mb-4">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 50, height: 50, backgroundColor: '#76b900', boxShadow: '0 4px 12px rgba(118, 185, 0, 0.3)', overflow: 'hidden' }}>
                      <img src={nvidiaLogo} alt="NVIDIA" style={{ width: '32px', height: 'auto' }} />
                    </div>
                    <div>
                      <h4 className="text-white mb-0 fw-bold">NVIDIA Corporation</h4>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="badge bg-dark-subtle text-secondary small">NASDAQ-NVDA</span>
                        <span className="text-success small fw-bold"><i className="bi bi-arrow-up-right"></i> %2.4</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="d-flex gap-4 border-bottom pb-2 mb-4 overflow-x-auto text-nowrap" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-secondary small fw-medium" style={{ cursor: 'pointer' }}>Genel Bakış</span>
                    <span className="text-white fw-bold small pb-2" style={{ borderBottom: '2px solid #fff', cursor: 'pointer', marginBottom: '-1px' }}>Finansallar</span>
                    <span className="text-secondary small fw-medium" style={{ cursor: 'pointer' }}>Yatırımcı İlişkileri</span>
                    <span className="text-secondary small fw-medium" style={{ cursor: 'pointer' }}>Tahminler</span>
                    <span className="text-secondary small fw-medium" style={{ cursor: 'pointer' }}>Sektör</span>
                  </div>

                  {/* Chart Area */}
                  <div className="position-relative d-flex align-items-end justify-content-between pt-3" style={{ height: 200, gap: '10px' }}>
                    {/* Vertical Grid Lines */}
                    {/* Grid Levels */}
                    <div className="position-absolute w-100 h-100 d-flex flex-column justify-content-between" style={{ pointerEvents: 'none', top: 0, left: 0 }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-100" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', height: '1px' }}></div>
                      ))}
                    </div>

                    {/* Solid Bars */}
                    {[15, 28, 35, 52, 65, 78].map((h, i) => (
                      <div key={i} className="flex-grow-1 rounded-top animate-bar" style={{
                        background: 'linear-gradient(to top, #00e5a0, #00ffaa)',
                        height: `${h}%`,
                        zIndex: 1,
                        maxWidth: '35px',
                        boxShadow: '0 4px 15px rgba(0, 229, 160, 0.3)',
                        animationDelay: `${i * 0.1}s`,
                        opacity: 0 // Start invisible
                      }}></div>
                    ))}
                    {/* Striped/Hatched Estimated Bars */}
                    {[85, 96, 100].map((h, i) => (
                      <div key={i} className="flex-grow-1 rounded-top animate-bar" style={{
                        height: `${h}%`,
                        zIndex: 1,
                        maxWidth: '35px',
                        background: 'repeating-linear-gradient(45deg, rgba(0, 229, 160, 0.1), rgba(0, 229, 160, 0.1) 4px, #00e5a0 4px, #00e5a0 7px)',
                        border: '1px solid rgba(0, 229, 160, 0.4)',
                        animationDelay: `${(i + 6) * 0.1}s`,
                        opacity: 0 // Start invisible
                      }}></div>
                    ))}
                  </div>
                </div>
              </MockWindow>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section-pad">
        <div className="container">
          <h2 className="text-center fw-bold text-white mb-5">{t('features.title')}</h2>
          <div className="row g-4">
            {/* 1 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-tile p-4 rounded-4 h-100 d-flex flex-column">
                <div className="feature-icon">
                  <i className="bi bi-bank"></i>
                </div>
                <h3 className="tile-title fs-5 text-white mt-3 mb-2">
                  {t('features.feature1Title')}
                </h3>
                <p className="text-soft mb-3">
                  {t('features.feature1Desc')}
                </p>
                <ul className="tile-list text-soft mb-0">
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature1Item1')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature1Item2')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature1Item3')}
                  </li>
                </ul>
              </div>
            </div>

            {/* 2 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-tile p-4 rounded-4 h-100 d-flex flex-column">
                <div className="feature-icon">
                  <i className="bi bi-magic"></i>
                </div>
                <h3 className="tile-title fs-5 text-white mt-3 mb-2">
                  {t('features.feature2Title')}
                </h3>
                <p className="text-soft mb-3">
                  {t('features.feature2Desc')}
                </p>
                <ul className="tile-list text-soft mb-0">
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature2Item1')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature2Item2')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature2Item3')}
                  </li>
                </ul>
              </div>
            </div>

            {/* 3 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-tile p-4 rounded-4 h-100 d-flex flex-column">
                <div className="feature-icon">
                  <i className="bi bi-columns-gap"></i>
                </div>
                <h3 className="tile-title fs-5 text-white mt-3 mb-2">
                  {t('features.feature3Title')}
                </h3>
                <p className="text-soft mb-3">
                  {t('features.feature3Desc')}
                </p>
                <ul className="tile-list text-soft mb-0">
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature3Item1')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature3Item2')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature3Item3')}
                  </li>
                </ul>
              </div>
            </div>

            {/* 4 */}
            <div className="col-12 col-md-6 col-lg-3">
              <div className="feature-tile p-4 rounded-4 h-100 d-flex flex-column">
                <div className="feature-icon">
                  <i className="bi bi-bell"></i>
                </div>
                <h3 className="tile-title fs-5 text-white mt-3 mb-2">
                  {t('features.feature4Title')}
                </h3>
                <p className="text-soft mb-3">
                  {t('features.feature4Desc')}
                </p>
                <ul className="tile-list text-soft mb-0">
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature4Item1')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature4Item2')}
                  </li>
                  <li>
                    <i className="bi bi-check2 me-2"></i>{t('features.feature4Item3')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FİYATLAMA */}
      <div id="pricing" className="section-pad">
        <Pricing />
      </div>

      {/* S.S.S. */}
      <FAQSection />

      {/* İLETİŞİM */}
      <ContactPanel />

      <Footer />
    </div >
  );
}