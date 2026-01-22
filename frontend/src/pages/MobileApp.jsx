import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { AuthContext } from "../context/AuthContext";
import logo from "../images/logo1.png";
import "../styles/mobileApp.css";

/* =========================================
   NATIVE LANGUAGE BOTTOM SHEET
   ========================================= */
function NativeLanguageSelector() {
  const { language, changeLanguage } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const currentLang = languages.find(lang => lang.code === language);

  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('bottom-sheet-open');
    } else {
      document.body.classList.remove('bottom-sheet-open');
    }
    return () => {
      document.body.classList.remove('bottom-sheet-open');
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button - Top Right */}
      <button
        className="native-lang-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Select Language"
      >
        <span className="lang-flag-large">{currentLang?.flag}</span>
      </button>

      {/* Bottom Sheet Overlay */}
      {isOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setIsOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Handle Bar */}
            <div className="bottom-sheet-handle"></div>

            {/* Header */}
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">Dil Seçin / Select Language / اختر اللغة</h3>
            </div>

            {/* Language Options */}
            <div className="bottom-sheet-content">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`bottom-sheet-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => {
                    changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                >
                  <span className="option-flag">{lang.flag}</span>
                  <span className="option-name">{lang.name}</span>
                  {language === lang.code && (
                    <i className="bi bi-check-circle-fill option-check"></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================
   ANA BİLEŞEN (NATIVE MOBILE LOGIN)
   ========================================= */

export default function MobileApp() {
  const { t, language } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  // If user is logged in, redirect to chat
  React.useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  // Translations for login screen
  const translations = {
    tr: {
      valueProp: "ABD Borsaları Odaklı Yapay Zekâ Destekli Finans Asistanı",
      login: "Giriş Yap",
      register: "Kayıt Ol",
      or: "veya"
    },
    en: {
      valueProp: "US Market-Focused AI-Powered Financial Assistant",
      login: "Login",
      register: "Register",
      or: "or"
    },
    ar: {
      valueProp: "مساعد مالي بالذكاء الاصطناعي يركز على BIST",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      or: "أو"
    }
  };

  const text = translations[language] || translations.tr;

  return (
    <div className={`native-mobile-login-screen ${isRTL ? 'rtl' : ''}`}>
      {/* Language Selector - Top Right */}
      <NativeLanguageSelector />

      {/* Main Content - Centered */}
      <div className="native-login-container">
        {/* Logo */}
        <div className="native-logo-wrapper">
          <img src={logo} alt="Finbot" className="native-logo" />
        </div>

        {/* Value Proposition */}
        <h1 className="native-value-prop">{text.valueProp}</h1>

        {/* Action Buttons */}
        <div className="native-actions">
          <Link
            to="/login"
            className="native-button native-button-primary"
          >
            {text.login}
          </Link>

          <div className="native-divider">
            <span>{text.or}</span>
          </div>

          <Link
            to="/register"
            className="native-button native-button-secondary"
          >
            {text.register}
          </Link>
        </div>
      </div>

      {/* Gradient Background Overlay */}
      <div className="native-bg-gradient"></div>
    </div>
  );
}
