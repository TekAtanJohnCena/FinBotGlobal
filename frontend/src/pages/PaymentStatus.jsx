import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const errorParam = searchParams.get('error');
    const [countdown, setCountdown] = useState(5);

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

    const isSuccess = status === 'success';

    return (
        <>
            <style>{`
                .ps-page {
                    min-height: 100vh;
                    background: #0b0c0f;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    padding: 1rem;
                }
                .ps-card {
                    max-width: 28rem;
                    width: 100%;
                    background: #161b22;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 1rem;
                    padding: 2rem;
                    text-align: center;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                }
                .ps-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    font-size: 2rem;
                }
                .ps-icon.success {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }
                .ps-icon.failed {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }
                .ps-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }
                .ps-desc {
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 1.5rem;
                    font-size: 0.95rem;
                }
                .ps-txid {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.35);
                    margin-bottom: 2rem;
                    font-family: monospace;
                }
                .ps-footer {
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                .ps-countdown {
                    color: rgba(255,255,255,0.4);
                    font-size: 0.85rem;
                    margin-bottom: 1rem;
                }
                .ps-btn {
                    width: 100%;
                    padding: 0.875rem;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .ps-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(16,185,129,0.3);
                }
            `}</style>

            <div className="ps-page">
                <div className="ps-card">
                    {isSuccess ? (
                        <>
                            <div className="ps-icon success">✓</div>
                            <h1 className="ps-title" style={{ color: '#10b981' }}>Ödeme Başarılı!</h1>
                            <p className="ps-desc">İşleminiz başarıyla tamamlandı. Aboneliğiniz aktifleştirildi.</p>
                        </>
                    ) : (
                        <>
                            <div className="ps-icon failed">✕</div>
                            <h1 className="ps-title" style={{ color: '#ef4444' }}>Ödeme Başarısız</h1>
                            <p className="ps-desc">
                                {errorParam === 'missing_id'
                                    ? 'İşlem bilgileri eksik. Lütfen tekrar deneyin.'
                                    : errorParam === 'not_found'
                                        ? 'İşlem kaydı bulunamadı.'
                                        : 'Maalesef ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.'
                                }
                            </p>
                        </>
                    )}

                    {id && <div className="ps-txid">İşlem No: {id}</div>}

                    <div className="ps-footer">
                        <p className="ps-countdown">{countdown} saniye içinde ana sayfaya yönlendiriliyorsunuz...</p>
                        <button onClick={() => navigate('/chat')} className="ps-btn">
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentStatus;
