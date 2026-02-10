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
        {/* Main Footer Content */}
        <div className="row g-4">
          {/* Brand & Company Info */}
          <div className="col-12 col-lg-4">
            <a
              href="/"
              className="footer-brand d-inline-flex align-items-center gap-2 text-decoration-none"
              aria-label="FinBot anasayfa"
            >
              <img src={logo} alt="FinBot logo" className="brand-logo footer-logo" />
              <span className="brand-wordmark footer-wordmark">FinBot</span>
            </a>

            <p className="text-soft small mt-3 mb-2">
              {t('footer.description')}
            </p>

            {/* Company Information */}
            <div className="company-info mt-3">
              <h6 className="footer-title mb-2" style={{ fontSize: '0.85rem' }}>
                {t('footer.companyInfo')}
              </h6>
              <ul className="list-unstyled text-soft small mb-0">
                <li className="mb-1">
                  <i className="bi bi-building me-2"></i>
                  {t('footer.companyName')}
                </li>
                <li className="mb-1">
                  <i className="bi bi-geo-alt me-2"></i>
                  {t('footer.companyAddress')}
                </li>
                <li className="mb-1">
                  <i className="bi bi-receipt me-2"></i>
                  {t('footer.taxOffice')}
                </li>
                <li>
                  <i className="bi bi-envelope me-2"></i>
                  <a href="mailto:destek@finbot.com.tr" className="footer-link">
                    destek@finbot.com.tr
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-lg-2">
            <h6 className="footer-title">{t('footer.quickLinks')}</h6>
            <ul className="footer-list">
              <li><a className="footer-link" href="/#home">{t('footer.home')}</a></li>
              <li><a className="footer-link" href="/#pricing">{t('footer.packages')}</a></li>
              <li><a className="footer-link" href="/#features">{t('footer.features')}</a></li>
              <li><a className="footer-link" href="/#contact">{t('footer.contact')}</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="col-6 col-lg-3">
            <h6 className="footer-title">{t('footer.legal')}</h6>
            <ul className="footer-list">
              <li><Link className="footer-link" to="/mesafeli-satis-sozlesmesi">{t('footer.distanceSales')}</Link></li>
              <li><Link className="footer-link" to="/iptal-iade-kosullari">{t('footer.refundPolicy')}</Link></li>
              <li><Link className="footer-link" to="/gizlilik-politikasi">{t('footer.privacy')}</Link></li>
              <li><Link className="footer-link" to="/kullanim-sartlari">{t('footer.terms')}</Link></li>
              <li><Link className="footer-link" to="/kvkk-aydinlatma">{t('footer.kvkk')}</Link></li>
              <li><Link className="footer-link" to="/cerez-politikasi">{t('footer.cookies')}</Link></li>
            </ul>
          </div>

          {/* Social Media & Payment */}
          <div className="col-12 col-lg-3">
            <h6 className="footer-title">{t('footer.social')}</h6>
            <div className="d-flex align-items-center gap-3 mb-4">
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

            {/* Payment Security */}
            <h6 className="footer-title">{t('footer.paymentSecurity')}</h6>
            <div className="payment-logos d-flex flex-wrap align-items-center gap-3 mb-2">
              {/* Mastercard */}
              <svg className="payment-logo" width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="12.5" r="10" fill="#EB001B" opacity="0.8" />
                <circle cx="26" cy="12.5" r="10" fill="#F79E1B" opacity="0.8" />
                <path d="M20 5.5C22.4 7.4 24 10.3 24 12.5C24 14.7 22.4 17.6 20 19.5C17.6 17.6 16 14.7 16 12.5C16 10.3 17.6 7.4 20 5.5Z" fill="#FF5F00" />
              </svg>

              {/* Visa */}
              <svg className="payment-logo" width="45" height="25" viewBox="0 0 45 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="2" y="18" fill="#1A1F71" fontFamily="Arial" fontWeight="bold" fontSize="14" opacity="0.9">VISA</text>
              </svg>

              {/* Troy */}
              <svg className="payment-logo" width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="36" height="17" rx="3" fill="#00509E" opacity="0.85" />
                <text x="8" y="16" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="9">TROY</text>
              </svg>

            
            </div>
          
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-section mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-soft small text-center mb-0" style={{
            fontSize: '0.75rem',
            fontStyle: 'italic',
            maxWidth: '900px',
            margin: '0 auto',
            opacity: 0.8
          }}>
            <i className="bi bi-info-circle me-1"></i>
            {t('footer.disclaimer')}
          </p>
        </div>

        {/* Bottom Bar */}
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