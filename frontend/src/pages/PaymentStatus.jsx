import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get('status');
    const id = searchParams.get('id');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        if (countdown === 0) {
            navigate('/chat');
        }

        return () => clearInterval(timer);
    }, [countdown, navigate]);

    return (
        <div className="min-h-screen bg-[#0b0c0f] flex flex-col items-center justify-center text-white px-4">
            <div className="max-w-md w-full bg-[#161b22] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
                {status === 'success' ? (
                    <>
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl text-emerald-500">✓</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Ödeme Başarılı!</h1>
                        <p className="text-gray-400 mb-6">İşleminiz başarıyla tamamlandı. Artık tüm özelliklere erişebilirsiniz.</p>
                        <div className="text-sm text-gray-500 mb-8">İşlem No: <span className="font-mono">{id}</span></div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl text-red-500">✕</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Ödeme Başarısız</h1>
                        <p className="text-gray-400 mb-6">Maalesef ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.</p>
                        <div className="text-sm text-gray-500 mb-8">İşlem No: <span className="font-mono">{id}</span></div>
                    </>
                )}

                <div className="pt-6 border-t border-white/5">
                    <p className="text-gray-500 text-sm mb-4">{countdown} saniye içinde ana sayfaya yönlendiriliyorsunuz...</p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatus;
