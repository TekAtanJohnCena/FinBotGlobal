import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../images/logo1.png';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{
                background: 'linear-gradient(135deg, #0b0c0f 0%, #1a1b1e 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>

            {/* Animated Background Elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
            }} />

            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            {/* Main Content */}
            <div className="text-center" style={{ position: 'relative', zIndex: 1, maxWidth: '600px', padding: '2rem' }}>

                {/* Logo */}
                <Link to="/">
                    <img
                        src={logo}
                        alt="Finbot Logo"
                        style={{
                            width: '120px',
                            marginBottom: '2rem',
                            filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3))'
                        }}
                    />
                </Link>

                {/* 404 Number */}
                <h1
                    className="display-1 fw-bold mb-3"
                    style={{
                        fontSize: '8rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
                        lineHeight: '1'
                    }}
                >
                    404
                </h1>

                {/* Title */}
                <h2 className="text-white fw-bold mb-3" style={{ fontSize: '2rem' }}>
                    Sayfa Bulunamadı
                </h2>

                {/* Description */}
                <p className="text-secondary mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
                    <br />
                    Endişelenmeyin, sizi doğru yere yönlendirelim.
                </p>

                {/* Action Buttons */}
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-outline-light px-4 py-2"
                        style={{
                            borderRadius: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.3s ease',
                            fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        ← Geri Dön
                    </button>

                    <Link
                        to="/chat"
                        className="btn px-4 py-2"
                        style={{
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            color: 'white',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.3s ease',
                            textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        Ana Sayfaya Git →
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-secondary small mb-3">Popüler Sayfalar:</p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Link to="/portfolio" className="text-decoration-none" style={{ color: '#10b981', fontSize: '0.9rem' }}>
                            📊 Portföy
                        </Link>
                        <Link to="/kap" className="text-decoration-none" style={{ color: '#10b981', fontSize: '0.9rem' }}>
                            📰 KAP
                        </Link>
                        <Link to="/screener" className="text-decoration-none" style={{ color: '#10b981', fontSize: '0.9rem' }}>
                            🔍 Tarayıcı
                        </Link>
                        <Link to="/wallet" className="text-decoration-none" style={{ color: '#10b981', fontSize: '0.9rem' }}>
                            💰 Cüzdan
                        </Link>
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
        </div>
    );
};

export default NotFound;
