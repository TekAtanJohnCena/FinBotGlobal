import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { language } = useContext(LanguageContext);

    useEffect(() => {
        // Check if consent was already given
        const consent = localStorage.getItem('finbot_cookie_consent');
        if (!consent) {
            // Delay showing the banner slightly for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('finbot_cookie_consent', 'accepted');
        localStorage.setItem('finbot_cookie_consent_date', new Date().toISOString());
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const text = {
        tr: {
            message: 'Sitemizde kullanıcı deneyimini iyileştirmek için çerezler kullanılmaktadır.',
            learnMore: 'Detaylı bilgi',
            accept: 'Kabul Et'
        },
        en: {
            message: 'We use cookies to improve user experience on our site.',
            learnMore: 'Learn more',
            accept: 'Accept'
        }
    };

    const t = text[language] || text.tr;

    return (
        <div
            className="cookie-consent"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(15, 17, 21, 0.98)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px 24px',
                zIndex: 9999,
                animation: 'slideUp 0.3s ease-out'
            }}
        >
            <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

            <div
                className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3"
                style={{ maxWidth: '1200px', margin: '0 auto' }}
            >
                <div className="d-flex align-items-center gap-3">
                    <i
                        className="bi bi-cookie"
                        style={{
                            fontSize: '24px',
                            color: '#10b981',
                            opacity: 0.9
                        }}
                    ></i>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.85)',
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: 1.5
                    }}>
                        {t.message}{' '}
                        <a
                            href="/cerez-politikasi"
                            style={{
                                color: '#10b981',
                                textDecoration: 'underline',
                                opacity: 0.9
                            }}
                        >
                            {t.learnMore}
                        </a>
                    </p>
                </div>

                <button
                    onClick={handleAccept}
                    style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        minWidth: '120px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#059669';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#10b981';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    {t.accept}
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
