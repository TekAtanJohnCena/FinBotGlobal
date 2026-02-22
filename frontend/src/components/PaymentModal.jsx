import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

/**
 * Payment Modal Component
 * Shows a popup for payment when user selects a paid plan
 * Includes card form until Shopier integration is complete
 */
const PaymentModal = ({
  isOpen,
  onClose,
  planKey,
  planName,
  price,
  period,
  onPaymentSuccess
}) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('confirm'); // 'confirm', 'card', 'processing', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Card form state
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});

  if (!isOpen) return null;

  // Card number formatting (add spaces every 4 digits)
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value.replace(/[^0-9]/gi, '');
    }
  };

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      if (formattedValue.replace(/\s/g, '').length > 16) return;
    }
    if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/gi, '').slice(0, 4);
    }
    if (field === 'expiryMonth') {
      formattedValue = value.replace(/[^0-9]/gi, '').slice(0, 2);
      if (parseInt(formattedValue) > 12) formattedValue = '12';
    }
    if (field === 'expiryYear') {
      formattedValue = value.replace(/[^0-9]/gi, '').slice(0, 2);
    }
    if (field === 'cardHolder') {
      formattedValue = value.toUpperCase().replace(/[^A-Z\s]/gi, '');
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));
    setCardErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateCard = () => {
    const errors = {};
    const cardNum = cardData.cardNumber.replace(/\s/g, '');

    if (!cardNum || cardNum.length < 15) {
      errors.cardNumber = 'Geçerli kart numarası giriniz';
    }
    if (!cardData.cardHolder || cardData.cardHolder.length < 3) {
      errors.cardHolder = 'Kart sahibi adını giriniz';
    }
    if (!cardData.expiryMonth || parseInt(cardData.expiryMonth) < 1 || parseInt(cardData.expiryMonth) > 12) {
      errors.expiryMonth = 'Geçersiz ay';
    }
    if (!cardData.expiryYear || cardData.expiryYear.length < 2) {
      errors.expiryYear = 'Geçersiz yıl';
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      errors.cvv = 'CVV giriniz';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToCard = () => {
    setPaymentStep('card');
  };

  const handlePayment = async () => {
    if (!validateCard()) return;

    setLoading(true);
    setPaymentStep('processing');
    setErrorMessage('');

    try {
      // Call new Paratika payment creation endpoint
      const response = await api.post('/payment/create', {
        planType: planKey.toUpperCase(), // BASIC, PLUS, PRO
        billingPeriod: period === 'monthly' ? 'MONTHLY' : 'YEARLY',
        cardHolderName: cardData.cardHolder,
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        expireMonth: cardData.expiryMonth,
        expireYear: cardData.expiryYear,
        cvv: cardData.cvv
      });

      if (response.data.success && response.data.redirectUrl) {
        // Redirect user to Paratika 3D Secure page
        window.location.href = response.data.redirectUrl;
      } else {
        throw new Error(response.data.message || 'Ödeme oturumu oluşturulamadı');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Ödeme işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('tr-TR').format(p);

  // Detect card type
  const getCardType = () => {
    const number = cardData.cardNumber.replace(/\s/g, '');
    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^9/.test(number)) return 'troy';
    return null;
  };

  return (
    <>
      <style>{`
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
          padding: 1rem;
          overflow-y: auto;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .payment-modal {
          background: linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          padding: 2rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease-out;
          margin: auto;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .modal-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .modal-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin: 0 0 0.5rem 0;
        }
        
        .modal-subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          margin: 0;
        }
        
        .plan-summary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        
        .plan-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .plan-row:last-child {
          margin-bottom: 0;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .plan-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        
        .plan-value {
          color: white;
          font-weight: 600;
        }
        
        .plan-total {
          font-size: 1.25rem;
          color: #10b981;
        }
        
        .payment-methods {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        
        .payment-method {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }
        
        .payment-method.active {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        
        .btn-pay {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
        }
        
        .btn-pay:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(16, 185, 129, 0.45);
        }
        
        .btn-pay:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-cancel {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          cursor: pointer;
          margin-top: 0.75rem;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        
        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
        }
        
        .processing-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(16, 185, 129, 0.2);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .success-icon {
          width: 64px;
          height: 64px;
          background: rgba(16, 185, 129, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 2rem;
        }
        
        .error-icon {
          width: 64px;
          height: 64px;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 2rem;
        }
        
        /* Card Form Styles */
        .card-form {
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-label {
          display: block;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #10b981;
          background: rgba(255, 255, 255, 0.08);
        }
        
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
        
        .form-input.error {
          border-color: #ef4444;
        }
        
        .form-error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.75rem;
        }
        
        .card-preview {
          background: linear-gradient(135deg, #1a1f2e 0%, #0f1218 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .card-preview::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .card-chip {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
          border-radius: 6px;
          margin-bottom: 1rem;
        }
        
        .card-number-preview {
          font-family: 'Courier New', monospace;
          font-size: 1.25rem;
          color: white;
          letter-spacing: 2px;
          margin-bottom: 1rem;
        }
        
        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .card-holder-preview {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          text-transform: uppercase;
        }
        
        .card-type-icon {
          font-size: 1.5rem;
        }
      `}</style>

      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>

          {paymentStep !== 'processing' && paymentStep !== 'success' && (
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          )}

          {/* Step 1: Confirmation */}
          {paymentStep === 'confirm' && (
            <>
              <div className="modal-header">
                <div className="modal-icon">
                  {planKey === 'plus' ? '⚡' : planKey === 'pro' ? '🚀' : '📦'}
                </div>
                <h2 className="modal-title">{planName} Planına Yükselt</h2>
                <p className="modal-subtitle">Ödeme bilgilerinizi onaylayın</p>
              </div>

              <div className="plan-summary">
                <div className="plan-row">
                  <span className="plan-label">Plan</span>
                  <span className="plan-value">{planName}</span>
                </div>
                <div className="plan-row">
                  <span className="plan-label">Periyod</span>
                  <span className="plan-value">{period === 'monthly' ? 'Aylık' : 'Yıllık'}</span>
                </div>
                <div className="plan-row">
                  <span className="plan-label">Kullanıcı</span>
                  <span className="plan-value">{user?.email}</span>
                </div>
                <div className="plan-row">
                  <span className="plan-label">Toplam</span>
                  <span className="plan-value plan-total">₺{formatPrice(price)}</span>
                </div>
              </div>

              <div className="payment-methods">
                <div className="payment-method">
                  <span>💳</span> Mastercard
                </div>
                <div className="payment-method">
                  <span>💳</span> Visa
                </div>
                <div className="payment-method">
                  <span>🏦</span> Troy
                </div>
              </div>

              <button
                className="btn-pay"
                onClick={handleProceedToCard}
              >
                💳 Kart Bilgilerini Gir
              </button>

              <button className="btn-cancel" onClick={onClose}>
                Vazgeç
              </button>

              <div className="security-note">
                🔒 256-bit SSL ile şifrelenmiş güvenli ödeme
              </div>
            </>
          )}

          {/* Step 2: Card Form */}
          {paymentStep === 'card' && (
            <>
              <div className="modal-header">
                <h2 className="modal-title">Kart Bilgileri</h2>
                <p className="modal-subtitle">₺{formatPrice(price)} - {planName} ({period === 'monthly' ? 'Aylık' : 'Yıllık'})</p>
              </div>

              {/* Card Preview */}
              <div className="card-preview">
                <div className="card-chip"></div>
                <div className="card-number-preview">
                  {cardData.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-bottom">
                  <div className="card-holder-preview">
                    {cardData.cardHolder || 'KART SAHİBİ'}
                  </div>
                  <div className="card-type-icon">
                    {getCardType() === 'visa' && '💳'}
                    {getCardType() === 'mastercard' && '💳'}
                    {getCardType() === 'troy' && '🏦'}
                    {!getCardType() && '💳'}
                  </div>
                </div>
              </div>

              <div className="card-form">
                <div className="form-group">
                  <label className="form-label">Kart Numarası</label>
                  <input
                    type="text"
                    className={`form-input ${cardErrors.cardNumber ? 'error' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                    maxLength={19}
                  />
                  {cardErrors.cardNumber && <div className="form-error">{cardErrors.cardNumber}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Kart Sahibi</label>
                  <input
                    type="text"
                    className={`form-input ${cardErrors.cardHolder ? 'error' : ''}`}
                    placeholder="AD SOYAD"
                    value={cardData.cardHolder}
                    onChange={(e) => handleCardInputChange('cardHolder', e.target.value)}
                  />
                  {cardErrors.cardHolder && <div className="form-error">{cardErrors.cardHolder}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ay</label>
                    <input
                      type="text"
                      className={`form-input ${cardErrors.expiryMonth ? 'error' : ''}`}
                      placeholder="MM"
                      value={cardData.expiryMonth}
                      onChange={(e) => handleCardInputChange('expiryMonth', e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Yıl</label>
                    <input
                      type="text"
                      className={`form-input ${cardErrors.expiryYear ? 'error' : ''}`}
                      placeholder="YY"
                      value={cardData.expiryYear}
                      onChange={(e) => handleCardInputChange('expiryYear', e.target.value)}
                      maxLength={2}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      className={`form-input ${cardErrors.cvv ? 'error' : ''}`}
                      placeholder="•••"
                      value={cardData.cvv}
                      onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              <button
                className="btn-pay"
                onClick={handlePayment}
                disabled={loading}
              >
                🔒 ₺{formatPrice(price)} Öde
              </button>

              <button className="btn-cancel" onClick={() => setPaymentStep('confirm')}>
                ← Geri
              </button>

              <div className="security-note">
                🔒 Kart bilgileriniz 256-bit SSL ile şifrelenir
              </div>
            </>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="processing-spinner"></div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Ödeme İşleniyor...</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                Lütfen bekleyin, işleminiz güvenli bir şekilde gerçekleştiriliyor.
              </p>
            </div>
          )}

          {/* Success Step */}
          {paymentStep === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="success-icon">✓</div>
              <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Ödeme Başarılı!</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                {planName} planınız aktifleştirildi. Yönlendiriliyorsunuz...
              </p>
            </div>
          )}

          {/* Error Step */}
          {paymentStep === 'error' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="error-icon">✕</div>
              <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Ödeme Başarısız</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {errorMessage || 'Bir hata oluştu. Lütfen tekrar deneyin.'}
              </p>
              <button
                className="btn-pay"
                onClick={() => setPaymentStep('card')}
              >
                Tekrar Dene
              </button>
              <button className="btn-cancel" onClick={onClose}>
                Kapat
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default PaymentModal;
