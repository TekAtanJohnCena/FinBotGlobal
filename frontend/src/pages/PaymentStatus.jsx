import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const errorParam = searchParams.get('error');
    const [countdown, setCountdown] = useState(8);
    const [showConfetti, setShowConfetti] = useState(false);

    const isSuccess = status === 'success';

    useEffect(() => {
        if (isSuccess) {
            // Trigger confetti animation after mount
            setTimeout(() => setShowConfetti(true), 300);
        }
    }, [isSuccess]);

    useEffect(() => {
        if (countdown <= 0) {
            navigate('/chat');
            return;
        }
        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, navigate]);

    const getErrorMessage = () => {
        switch (errorParam) {
            case 'missing_id':
                return 'İşlem bilgileri eksik. Lütfen tekrar deneyin.';
            case 'not_found':
                return 'İşlem kaydı bulunamadı. Lütfen destek ile iletişime geçin.';
            case 'server_error':
                return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
            default:
                return 'Ödeme işlemi sırasında bir sorun oluştu. Kartınızdan ücret çekilmediyse tekrar deneyebilirsiniz.';
        }
    };

    return (
        <>
            <style>{`
                @keyframes ps-fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes ps-scaleIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes ps-checkmark {
                    0% { stroke-dashoffset: 100; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes ps-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    50% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
                }
                @keyframes ps-confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes ps-shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .ps-page {
                    min-height: 100vh;
                    background: #0b0c0f;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    padding: 1.5rem;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .ps-page::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
                    pointer-events: none;
                }
                .ps-page.failed::before {
                    background: radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.06) 0%, transparent 60%);
                }
                .ps-card {
                    max-width: 480px;
                    width: 100%;
                    background: linear-gradient(145deg, #161b22, #1a2030);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 1.5rem;
                    padding: 3rem 2.5rem;
                    text-align: center;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.5);
                    animation: ps-fadeInUp 0.6s ease-out;
                    position: relative;
                    z-index: 1;
                }
                .ps-icon-wrapper {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 2rem;
                    animation: ps-scaleIn 0.5s ease-out 0.2s both;
                }
                .ps-icon-wrapper.success {
                    background: rgba(16, 185, 129, 0.15);
                    border: 2px solid rgba(16, 185, 129, 0.3);
                    animation: ps-scaleIn 0.5s ease-out 0.2s both, ps-pulse 2s ease-in-out 1s infinite;
                }
                .ps-icon-wrapper.failed {
                    background: rgba(239, 68, 68, 0.15);
                    border: 2px solid rgba(239, 68, 68, 0.3);
                }
                .ps-checkmark {
                    width: 48px; height: 48px;
                }
                .ps-checkmark path {
                    stroke: #10b981;
                    stroke-width: 3;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    stroke-dasharray: 100;
                    animation: ps-checkmark 0.6s ease-out 0.5s both;
                }
                .ps-x-icon {
                    font-size: 2.5rem;
                    color: #ef4444;
                    line-height: 1;
                }
                .ps-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 1rem;
                    border-radius: 50px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    margin-bottom: 1rem;
                    animation: ps-fadeInUp 0.5s ease-out 0.3s both;
                }
                .ps-badge.success {
                    background: rgba(16, 185, 129, 0.15);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.25);
                }
                .ps-badge.failed {
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.25);
                }
                .ps-title {
                    font-size: 1.85rem;
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                    line-height: 1.2;
                    animation: ps-fadeInUp 0.5s ease-out 0.4s both;
                }
                .ps-title.success { color: #10b981; }
                .ps-title.failed { color: #ef4444; }
                .ps-subtitle {
                    font-size: 1.05rem;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 0.5rem;
                    animation: ps-fadeInUp 0.5s ease-out 0.5s both;
                    line-height: 1.6;
                }
                .ps-plan-highlight {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.2) 100%);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 12px;
                    margin: 1.25rem 0;
                    animation: ps-fadeInUp 0.5s ease-out 0.6s both;
                }
                .ps-plan-highlight span {
                    font-size: 0.95rem;
                    color: rgba(255,255,255,0.6);
                }
                .ps-plan-highlight strong {
                    font-size: 1.1rem;
                    color: #34d399;
                    background: linear-gradient(90deg, #34d399, #10b981);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .ps-features {
                    text-align: left;
                    margin: 1.5rem 0;
                    padding: 1.25rem;
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    animation: ps-fadeInUp 0.5s ease-out 0.7s both;
                }
                .ps-features-title {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 0.75rem;
                }
                .ps-feature-item {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.4rem 0;
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.7);
                }
                .ps-feature-check {
                    width: 18px; height: 18px;
                    background: rgba(16, 185, 129, 0.2);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.65rem;
                    color: #10b981;
                    flex-shrink: 0;
                }
                .ps-txid {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.25);
                    margin: 1rem 0;
                    font-family: 'Courier New', monospace;
                    animation: ps-fadeInUp 0.5s ease-out 0.8s both;
                }
                .ps-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                    margin: 1.5rem 0;
                }
                .ps-footer {
                    animation: ps-fadeInUp 0.5s ease-out 0.9s both;
                }
                .ps-countdown {
                    color: rgba(255,255,255,0.3);
                    font-size: 0.8rem;
                    margin-bottom: 1rem;
                }
                .ps-btn {
                    width: 100%;
                    padding: 1rem;
                    border: none;
                    border-radius: 14px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    letter-spacing: 0.3px;
                }
                .ps-btn.success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
                }
                .ps-btn.success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
                }
                .ps-btn.failed {
                    background: linear-gradient(135deg, #374151, #1f2937);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .ps-btn.failed:hover {
                    background: linear-gradient(135deg, #4b5563, #374151);
                    transform: translateY(-1px);
                }
                .ps-btn-secondary {
                    width: 100%;
                    padding: 0.75rem;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                    cursor: pointer;
                    margin-top: 0.75rem;
                    transition: all 0.2s;
                }
                .ps-btn-secondary:hover {
                    border-color: rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.7);
                }
                /* Confetti */
                .ps-confetti-container {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    pointer-events: none;
                    z-index: 10;
                    overflow: hidden;
                }
                .ps-confetti-piece {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -20px;
                    animation: ps-confetti-fall linear forwards;
                }
                .ps-support-link {
                    color: rgba(255,255,255,0.4);
                    font-size: 0.8rem;
                    margin-top: 1rem;
                    display: block;
                }
                .ps-support-link a {
                    color: #10b981;
                    text-decoration: none;
                }
                .ps-support-link a:hover {
                    text-decoration: underline;
                }
            `}</style>

            {/* Confetti animation for success */}
            {isSuccess && showConfetti && (
                <div className="ps-confetti-container">
                    {Array.from({ length: 40 }, (_, i) => {
                        const colors = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b', '#818cf8', '#a78bfa'];
                        const color = colors[i % colors.length];
                        const left = Math.random() * 100;
                        const delay = Math.random() * 2;
                        const duration = 2 + Math.random() * 3;
                        const size = 6 + Math.random() * 8;
                        const shape = i % 3 === 0 ? '50%' : i % 3 === 1 ? '0' : '2px';
                        return (
                            <div
                                key={i}
                                className="ps-confetti-piece"
                                style={{
                                    left: `${left}%`,
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    backgroundColor: color,
                                    borderRadius: shape,
                                    animationDuration: `${duration}s`,
                                    animationDelay: `${delay}s`,
                                    opacity: 0.9,
                                }}
                            />
                        );
                    })}
                </div>
            )}

            <div className={`ps-page ${isSuccess ? 'success' : 'failed'}`}>
                <div className="ps-card">
                    {isSuccess ? (
                        <>
                            {/* SUCCESS STATE */}
                            <div className="ps-icon-wrapper success">
                                <svg className="ps-checkmark" viewBox="0 0 52 52">
                                    <path d="M14 27 L22 35 L38 17" />
                                </svg>
                            </div>

                            <div className="ps-badge success">
                                ✦ ÖDEME ONAYLANDI
                            </div>

                            <h1 className="ps-title success">
                                Tebrikler! 🎉
                            </h1>

                            <p className="ps-subtitle">
                                Ödemeniz başarıyla gerçekleştirildi ve aboneliğiniz <strong>anında aktifleştirildi.</strong>
                            </p>

                            <div className="ps-plan-highlight">
                                <span>Planınız:</span>
                                <strong>Premium Üyelik Aktif</strong>
                            </div>

                            <div className="ps-features">
                                <div className="ps-features-title">Artık erişiminiz var</div>
                                <div className="ps-feature-item">
                                    <span className="ps-feature-check">✓</span>
                                    Sınırsız yapay zeka analizi
                                </div>
                                <div className="ps-feature-item">
                                    <span className="ps-feature-check">✓</span>
                                    Gelişmiş finansal raporlar
                                </div>
                                <div className="ps-feature-item">
                                    <span className="ps-feature-check">✓</span>
                                    Öncelikli destek
                                </div>
                                <div className="ps-feature-item">
                                    <span className="ps-feature-check">✓</span>
                                    Tüm premium özellikler
                                </div>
                            </div>

                            {id && <div className="ps-txid">İşlem No: {id}</div>}

                            <div className="ps-divider"></div>

                            <div className="ps-footer">
                                <p className="ps-countdown">{countdown} saniye içinde yönlendiriliyorsunuz...</p>
                                <button
                                    onClick={() => navigate('/chat')}
                                    className="ps-btn success"
                                >
                                    🚀 Hemen Kullanmaya Başla
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* FAILED STATE */}
                            <div className="ps-icon-wrapper failed">
                                <span className="ps-x-icon">✕</span>
                            </div>

                            <div className="ps-badge failed">
                                ÖDEME BAŞARISIZ
                            </div>

                            <h1 className="ps-title failed">
                                İşlem Tamamlanamadı
                            </h1>

                            <p className="ps-subtitle">
                                {getErrorMessage()}
                            </p>

                            {id && <div className="ps-txid">İşlem No: {id}</div>}

                            <div className="ps-divider"></div>

                            <div className="ps-footer">
                                <p className="ps-countdown">{countdown} saniye içinde yönlendiriliyorsunuz...</p>
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="ps-btn failed"
                                >
                                    Tekrar Dene
                                </button>
                                <button
                                    onClick={() => navigate('/chat')}
                                    className="ps-btn-secondary"
                                >
                                    Ana Sayfaya Dön
                                </button>
                                <span className="ps-support-link">
                                    Sorun devam ederse <a href="/support">destek ekibimizle</a> iletişime geçin.
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default PaymentStatus;
