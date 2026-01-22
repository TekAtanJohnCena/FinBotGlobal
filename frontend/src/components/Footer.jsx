import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import logo from "../images/logo1.png";

export default function Footer() {
  const { t } = useContext(LanguageContext);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="container">
        <div className="row g-4">
          {/* Marka & Kısa Tanım */}
          <div className="col-12 col-lg-4">
            <a
              href="/"
              className="footer-brand d-inline-flex align-items-center gap-2 text-decoration-none"
              aria-label="FinBot anasayfa"
            >
              {/* Logo boyutu CSS ile yönetilmeli, yoksa style={{ height: '40px' }} eklenebilir */}
              <img src={logo} alt="FinBot logo" className="brand-logo footer-logo" />
              <span className="brand-wordmark footer-wordmark">FinBot</span>
            </a>

            <p className="text-soft small mt-3 mb-2">
              {t('footer.description')}
            </p>

            <a
              href="mailto:destek@finbot.com.tr"
              className="footer-link"
              title="destek@finbot.com.tr"
            >
              destek@finbot.com.tr
            </a>
          </div>

          {/* Hızlı Linkler */}
          <div className="col-6 col-lg-2">
            <h6 className="footer-title">{t('footer.quickLinks')}</h6>
            <ul className="footer-list">
              {/* Sayfa içi kaydırma (scroll) için ID kullanıyorsan bu href'ler kalabilir, 
                  farklı sayfaya gidiyorsa Link to="..." kullanılmalı */}
              <li><a className="footer-link" href="/#home">{t('footer.home')}</a></li>
              <li><a className="footer-link" href="/#pricing">{t('footer.packages')}</a></li>
              <li><a className="footer-link" href="/#features">{t('footer.features')}</a></li>
              <li><a className="footer-link" href="/#contact">{t('footer.contact')}</a></li>
            </ul>
          </div>

          {/* Hukuk (Linkler App.js ile Eşleştirildi) */}
          <div className="col-6 col-lg-3">
            <h6 className="footer-title">{t('footer.legal')}</h6>
            <ul className="footer-list">
              <li><Link className="footer-link" to="/kvkk-aydinlatma">{t('footer.kvkk')}</Link></li>
              <li><Link className="footer-link" to="/gizlilik-politikasi">{t('footer.privacy')}</Link></li>
              <li><Link className="footer-link" to="/cerez-politikasi">{t('footer.cookies')}</Link></li>
              <li><Link className="footer-link" to="/kullanim-sartlari">{t('footer.terms')}</Link></li>
            </ul>
          </div>

          {/* Sosyal Medya */}
          <div className="col-12 col-lg-3">
            <h6 className="footer-title">{t('footer.social')}</h6>
            <div className="d-flex align-items-center gap-3">
              <a
                href="https://www.instagram.com/finbotcomtr"
                target="_blank"
                rel="noreferrer"
                className="social"
                aria-label="Instagram"
                title="Instagram"
              >
                <i className="bi bi-instagram fs-4"></i>
              </a>
              <a
                href="https://www.linkedin.com/company/finbotcomtr"
                target="_blank"
                rel="noreferrer"
                className="social"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <i className="bi bi-linkedin fs-4"></i>
              </a>
              <a
                href="mailto:destek@finbot.com.tr"
                className="social"
                aria-label="E-posta"
                title="E-posta"
              >
                <i className="bi bi-envelope fs-4"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Alt çizgi */}
        <hr className="footer-hr mt-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center py-3">
          <p className="mb-2 mb-md-0 text-dim">
            {t('footer.copyright').replace('{year}', year)}
          </p>
          <div className="d-flex gap-3 small">
            <Link className="footer-link" to="/kvkk-aydinlatma">{t('footer.kvkkShort')}</Link>
            <Link className="footer-link" to="/gizlilik-politikasi">{t('footer.privacyShort')}</Link>
            <Link className="footer-link" to="/cerez-politikasi">{t('footer.cookiesShort')}</Link>
            <Link className="footer-link" to="/kullanim-sartlari">{t('footer.termsShort')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}