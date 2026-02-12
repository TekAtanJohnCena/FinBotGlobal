import React from 'react';

/**
 * PendingPlanModal Component
 * Shows after registration when user had selected a plan before logging in
 * "Hoşgeldin! Seçtiğin paketi tamamlayalım mı?" modal
 */
const PendingPlanModal = ({
    isOpen,
    onClose,
    pendingPlan,
    onContinueToPayment,
    userName
}) => {
    if (!isOpen || !pendingPlan) return null;

    const formatPrice = (p) => new Intl.NumberFormat('tr-TR').format(p);

    return (
        <>
            <style>{`
        .pending-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .pending-modal {
          background: linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 24px;
          width: 90%;
          max-width: 480px;
          padding: 2.5rem 2rem;
          box-shadow: 
            0 25px 60px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(16, 185, 129, 0.15);
          animation: slideUp 0.4s ease-out;
          text-align: center;
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        .welcome-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 1s ease-in-out;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .welcome-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.5rem 0;
        }
        
        .welcome-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }
        
        .plan-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .plan-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .plan-icon {
          font-size: 2rem;
        }
        
        .plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }
        
        .plan-price {
          font-size: 2rem;
          font-weight: 700;
          color: #10b981;
        }
        
        .plan-period {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .btn-continue {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 6px 25px rgba(16, 185, 129, 0.4);
        }
        
        .btn-continue:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 35px rgba(16, 185, 129, 0.5);
        }
        
        .btn-later {
          width: 100%;
          padding: 0.85rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          cursor: pointer;
          margin-top: 0.75rem;
          transition: all 0.2s;
        }
        
        .btn-later:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        
        .confetti {
          position: absolute;
          font-size: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(10deg); }
        }
      `}</style>

            <div className="pending-modal-overlay">
                <div className="pending-modal" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative confetti */}
                    <span className="confetti" style={{ top: '10%', left: '10%', animationDelay: '0s' }}>🎉</span>
                    <span className="confetti" style={{ top: '15%', right: '15%', animationDelay: '0.5s' }}>✨</span>
                    <span className="confetti" style={{ bottom: '20%', left: '15%', animationDelay: '1s' }}>🎊</span>

                    <div className="welcome-icon">
                        🎉
                    </div>

                    <h2 className="welcome-title">
                        Hoş Geldin{userName ? `, ${userName}` : ''}! 🚀
                    </h2>

                    <p className="welcome-subtitle">
                        Kayıt işlemin tamamlandı! Daha önce seçtiğin paketi şimdi aktifleştirmek ister misin?
                    </p>

                    <div className="plan-card">
                        <div className="plan-header">
                            <span className="plan-icon">{pendingPlan.icon}</span>
                            <span className="plan-name">{pendingPlan.name} Planı</span>
                        </div>
                        <div className="plan-price">
                            ₺{formatPrice(pendingPlan.price)}
                            <span className="plan-period">
                                /{pendingPlan.period === 'monthly' ? 'ay' : 'yıl'}
                            </span>
                        </div>
                    </div>

                    <button className="btn-continue" onClick={onContinueToPayment}>
                        <i className="bi bi-credit-card"></i>
                        Ödemeye Geç
                    </button>

                    <button className="btn-later" onClick={onClose}>
                        Daha Sonra
                    </button>

                </div>
            </div>
        </>
    );
};

export default PendingPlanModal;
