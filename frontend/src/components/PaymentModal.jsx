import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

/**
 * Payment Modal Component
 * Uses Paratika Direct POST 3D model:
 * 1. Backend creates a PAYMENTSESSION → returns sessionToken
 * 2. User fills card form here
 * 3. Form POSTs directly to Paratika's sale3d endpoint (card data never touches our backend)
 * 4. Paratika handles 3D Secure → redirects back to our callback URL
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
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('confirm'); // 'confirm', 'card', 'processing', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  // Card form state
  const [cardOwner, setCardOwner] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardErrors, setCardErrors] = useState({});

  if (!isOpen) return null;

  // ─── Helpers ───

  const formatPrice = (p) => new Intl.NumberFormat('tr-TR').format(p);

  // Format card number with spaces: 4111 1111 1111 1111
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  // Allow only Turkish + English letters, spaces, dots
  const formatCardOwner = (value) => {
    return value.replace(/[^a-zA-ZçÇğĞıİöÖşŞüÜâÂîÎûÛ\s.]/g, '').toUpperCase();
  };

  // Detect card brand from first digits
  const getCardBrand = (number) => {
    const digits = number.replace(/\s/g, '');
    if (/^4/.test(digits)) return { name: 'Visa', color: '#1a1f71' };
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return { name: 'Mastercard', color: '#eb001b' };
    if (/^9792/.test(digits) || /^65/.test(digits)) return { name: 'Troy', color: '#0055a5' };
    return null;
  };

  // ─── Step 1: Get Session Token ───

  const handleGetSession = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.post('/payment/create', {
        planType: planKey.toUpperCase(),
        billingPeriod: period === 'monthly' ? 'MONTHLY' : 'YEARLY'
      });

      if (response.data.success && response.data.sessionToken) {
        setSessionToken(response.data.sessionToken);
        setPaymentStep('card');
      } else {
        throw new Error(response.data.message || 'Ödeme oturumu oluşturulamadı');
      }
    } catch (error) {
      console.error('Session error:', error);
      setPaymentStep('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Ödeme oturumu oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Validate & Submit Card Form ───

  const validateCard = () => {
    const errors = {};
    const cleanNumber = cardNumber.replace(/\s/g, '');

    if (!cardOwner || cardOwner.trim().length < 3) {
      errors.cardOwner = 'Kart sahibi adı gerekli (en az 3 karakter)';
    }
    if (cleanNumber.length < 15 || cleanNumber.length > 16) {
      errors.cardNumber = 'Geçerli bir kart numarası girin';
    }
    if (!expiryMonth) {
      errors.expiryMonth = 'Ay seçin';
    }
    if (!expiryYear) {
      errors.expiryYear = 'Yıl seçin';
    }
    if (cvv.length < 3) {
      errors.cvv = 'CVV 3 haneli olmalıdır';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCard = (e) => {
    e.preventDefault();

    if (!validateCard()) return;

    // Submit the hidden form directly to Paratika (Direct POST 3D)
    // Card data goes straight to Paratika, never through our backend
    // IMPORTANT: Submit BEFORE changing step, otherwise React removes the form from DOM
    if (formRef.current) {
      setPaymentStep('processing');
      // Use requestAnimationFrame to ensure DOM has the processing state visible
      // but the form ref is still valid since we captured it before
      formRef.current.submit();
    }
  };

  // Card brand detection
  const cardBrand = getCardBrand(cardNumber);

  // Generate year options (current year + 15 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear + i);

  return (
    <>
      <style>{`
        .payment-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: pmFadeIn 0.2s ease-out;
          padding: 1rem;
          overflow-y: auto;
        }
        @keyframes pmFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .payment-modal {
          background: linear-gradient(135deg, #0f1218 0%, #1a1f2e 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          padding: 2rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: pmSlideUp 0.3s ease-out;
          margin: auto;
          position: relative;
        }
        @keyframes pmSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pm-close {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: none; width: 32px; height: 32px; border-radius: 50%;
          color: rgba(255, 255, 255, 0.6); cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .pm-close:hover { background: rgba(255, 255, 255, 0.2); color: white; }
        .pm-header { text-align: center; margin-bottom: 1.5rem; }
        .pm-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .pm-title {
          font-size: 1.5rem; font-weight: 700; color: white; margin: 0 0 0.5rem 0;
        }
        .pm-subtitle { color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; margin: 0; }
        .pm-summary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;
        }
        .pm-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.75rem;
        }
        .pm-row:last-child {
          margin-bottom: 0; padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pm-label { color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; }
        .pm-value { color: white; font-weight: 600; }
        .pm-total { font-size: 1.25rem; color: #10b981; }
        .pm-methods {
          display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.5rem;
        }
        .pm-method {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px; padding: 0.5rem 1rem;
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; color: rgba(255, 255, 255, 0.7);
        }
        .pm-btn-pay {
          width: 100%; padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none; border-radius: 12px; color: white;
          font-size: 1rem; font-weight: 600; cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
        }
        .pm-btn-pay:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(16, 185, 129, 0.45);
        }
        .pm-btn-pay:disabled { opacity: 0.7; cursor: not-allowed; }
        .pm-btn-cancel {
          width: 100%; padding: 0.75rem;
          background: transparent; border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px; color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem; cursor: pointer; margin-top: 0.75rem;
          transition: all 0.2s;
        }
        .pm-btn-cancel:hover { background: rgba(255, 255, 255, 0.05); color: white; }
        .pm-security {
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; margin-top: 1rem;
          color: rgba(255, 255, 255, 0.4); font-size: 0.75rem;
        }
        .pm-paratika-badge {
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; margin-top: 0.75rem; padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03); border-radius: 8px;
          color: rgba(255, 255, 255, 0.5); font-size: 0.7rem;
        }
        .pm-spinner {
          width: 48px; height: 48px;
          border: 3px solid rgba(16, 185, 129, 0.2);
          border-top-color: #10b981; border-radius: 50%;
          animation: pmSpin 1s linear infinite; margin: 0 auto 1rem;
        }
        @keyframes pmSpin { to { transform: rotate(360deg); } }
        .pm-error-icon {
          width: 64px; height: 64px;
          background: rgba(239, 68, 68, 0.2); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem; font-size: 2rem;
        }

        /* ─── Card Form Styles ─── */
        .pm-card-form { margin-top: 0.5rem; }
        .pm-form-group {
          margin-bottom: 1rem;
        }
        .pm-form-label {
          display: block; color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem; margin-bottom: 0.4rem; font-weight: 500;
        }
        .pm-form-input {
          width: 100%; padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px; color: white;
          font-size: 0.95rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .pm-form-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .pm-form-input:focus {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .pm-form-input.error {
          border-color: rgba(239, 68, 68, 0.6);
        }
        .pm-form-error {
          color: #ef4444; font-size: 0.75rem; margin-top: 0.3rem;
        }
        .pm-form-row {
          display: flex; gap: 0.75rem;
        }
        .pm-form-row .pm-form-group {
          flex: 1;
        }
        .pm-form-select {
          width: 100%; padding: 0.75rem 0.75rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px; color: white;
          font-size: 0.95rem; outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          appearance: none;
          cursor: pointer;
          font-family: inherit;
        }
        .pm-form-select option {
          background: #1a1f2e; color: white;
        }
        .pm-form-select:focus {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .pm-card-number-wrapper {
          position: relative;
        }
        .pm-card-brand {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 0.7rem; font-weight: 700; padding: 3px 8px;
          border-radius: 4px; color: white; letter-spacing: 0.5px;
        }
        .pm-card-preview {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px; padding: 1.25rem;
          margin-bottom: 1.25rem; position: relative; overflow: hidden;
        }
        .pm-card-preview::before {
          content: ''; position: absolute; top: -30%; right: -20%;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
          border-radius: 50%;
        }
        .pm-card-preview-number {
          font-family: 'Courier New', monospace;
          font-size: 1.1rem; letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.9); margin-bottom: 1rem;
        }
        .pm-card-preview-bottom {
          display: flex; justify-content: space-between; align-items: flex-end;
        }
        .pm-card-preview-name {
          font-size: 0.75rem; color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase; letter-spacing: 1px;
        }
        .pm-card-preview-expiry {
          font-size: 0.75rem; color: rgba(255, 255, 255, 0.5);
        }
        .pm-back-btn {
          background: none; border: none; color: rgba(255, 255, 255, 0.5);
          cursor: pointer; font-size: 0.85rem; padding: 0;
          display: flex; align-items: center; gap: 0.25rem;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }
        .pm-back-btn:hover { color: white; }
      `}</style>

      <div className="payment-modal-overlay" onClick={onClose}>
        <div className="payment-modal" onClick={e => e.stopPropagation()}>

          {paymentStep !== 'processing' && (
            <button className="pm-close" onClick={onClose}>✕</button>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* Step 1: Plan Confirmation               */}
          {/* ═══════════════════════════════════════ */}
          {paymentStep === 'confirm' && (
            <>
              <div className="pm-header">
                <div className="pm-icon">
                  {planKey === 'plus' ? '⚡' : planKey === 'pro' ? '🚀' : '📦'}
                </div>
                <h2 className="pm-title">{planName} Planına Yükselt</h2>
                <p className="pm-subtitle">Kart bilgilerinizi güvenle girebilirsiniz</p>
              </div>

              <div className="pm-summary">
                <div className="pm-row">
                  <span className="pm-label">Plan</span>
                  <span className="pm-value">{planName}</span>
                </div>
                <div className="pm-row">
                  <span className="pm-label">Periyod</span>
                  <span className="pm-value">{period === 'monthly' ? 'Aylık' : 'Yıllık'}</span>
                </div>
                <div className="pm-row">
                  <span className="pm-label">Kullanıcı</span>
                  <span className="pm-value">{user?.email}</span>
                </div>
                <div className="pm-row">
                  <span className="pm-label">Toplam</span>
                  <span className="pm-value pm-total">₺{formatPrice(price)}</span>
                </div>
              </div>

              <div className="pm-methods">
                <div className="pm-method"><span>💳</span> Mastercard</div>
                <div className="pm-method"><span>💳</span> Visa</div>
                <div className="pm-method"><span>🏦</span> Troy</div>
              </div>

              <button
                className="pm-btn-pay"
                onClick={handleGetSession}
                disabled={loading}
              >
                {loading ? 'Hazırlanıyor...' : '💳 Ödemeye Geç'}
              </button>

              <button className="pm-btn-cancel" onClick={onClose}>Vazgeç</button>

              <div className="pm-security">🔒 256-bit SSL ile şifrelenmiş güvenli ödeme</div>
              <div className="pm-paratika-badge">
                🏦 Ödeme altyapısı TCMB onaylı Paratika tarafından sağlanmaktadır
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* Step 2: Card Entry Form                 */}
          {/* Direct POST 3D — submits to Paratika    */}
          {/* ═══════════════════════════════════════ */}
          {paymentStep === 'card' && (
            <>
              <button className="pm-back-btn" onClick={() => setPaymentStep('confirm')}>
                ← Geri
              </button>

              {/* Mini Card Preview */}
              <div className="pm-card-preview">
                <div className="pm-card-preview-number">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="pm-card-preview-bottom">
                  <div className="pm-card-preview-name">
                    {cardOwner || 'KART SAHİBİ'}
                  </div>
                  <div className="pm-card-preview-expiry">
                    {expiryMonth || 'AA'}/{expiryYear ? expiryYear.toString().slice(-2) : 'YY'}
                    {cardBrand && (
                      <span style={{
                        marginLeft: '0.75rem',
                        fontWeight: 700,
                        color: cardBrand.color,
                        fontSize: '0.8rem'
                      }}>
                        {cardBrand.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pm-card-form">
                {/* Card Owner */}
                <div className="pm-form-group">
                  <label className="pm-form-label">Kart Sahibi</label>
                  <input
                    type="text"
                    className={`pm-form-input ${cardErrors.cardOwner ? 'error' : ''}`}
                    placeholder="AD SOYAD"
                    value={cardOwner}
                    onChange={(e) => setCardOwner(formatCardOwner(e.target.value))}
                    maxLength={50}
                    autoComplete="off"
                  />
                  {cardErrors.cardOwner && <div className="pm-form-error">{cardErrors.cardOwner}</div>}
                </div>

                {/* Card Number */}
                <div className="pm-form-group">
                  <label className="pm-form-label">Kart Numarası</label>
                  <div className="pm-card-number-wrapper">
                    <input
                      type="text"
                      className={`pm-form-input ${cardErrors.cardNumber ? 'error' : ''}`}
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {cardBrand && (
                      <span className="pm-card-brand" style={{ background: cardBrand.color }}>
                        {cardBrand.name}
                      </span>
                    )}
                  </div>
                  {cardErrors.cardNumber && <div className="pm-form-error">{cardErrors.cardNumber}</div>}
                </div>

                {/* Expiry + CVV row */}
                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label className="pm-form-label">Ay</label>
                    <select
                      className={`pm-form-select ${cardErrors.expiryMonth ? 'error' : ''}`}
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                    >
                      <option value="">Ay</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = String(i + 1).padStart(2, '0');
                        return <option key={m} value={m}>{m}</option>;
                      })}
                    </select>
                    {cardErrors.expiryMonth && <div className="pm-form-error">{cardErrors.expiryMonth}</div>}
                  </div>

                  <div className="pm-form-group">
                    <label className="pm-form-label">Yıl</label>
                    <select
                      className={`pm-form-select ${cardErrors.expiryYear ? 'error' : ''}`}
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                    >
                      <option value="">Yıl</option>
                      {yearOptions.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    {cardErrors.expiryYear && <div className="pm-form-error">{cardErrors.expiryYear}</div>}
                  </div>

                  <div className="pm-form-group">
                    <label className="pm-form-label">CVV</label>
                    <input
                      type="password"
                      className={`pm-form-input ${cardErrors.cvv ? 'error' : ''}`}
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setCvv(val);
                      }}
                      maxLength={3}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {cardErrors.cvv && <div className="pm-form-error">{cardErrors.cvv}</div>}
                  </div>
                </div>

                <button
                  className="pm-btn-pay"
                  onClick={handleSubmitCard}
                  disabled={loading}
                  style={{ marginTop: '0.5rem' }}
                >
                  🔒 ₺{formatPrice(price)} Öde
                </button>

                <button className="pm-btn-cancel" onClick={onClose}>Vazgeç</button>

                <div className="pm-security">🔒 Kart bilgileriniz güvenli şekilde Paratika'ya iletilir</div>
              </div>


            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* Processing — waiting for redirect       */}
          {/* ═══════════════════════════════════════ */}
          {paymentStep === 'processing' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pm-spinner"></div>
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>3D Secure Doğrulamaya Yönlendiriliyorsunuz...</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                Lütfen bekleyin, bankanızın güvenlik sayfasına aktarılıyorsunuz.
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* Error Step                              */}
          {/* ═══════════════════════════════════════ */}
          {paymentStep === 'error' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="pm-error-icon">✕</div>
              <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Ödeme Başlatılamadı</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {errorMessage || 'Bir hata oluştu. Lütfen tekrar deneyin.'}
              </p>
              <button
                className="pm-btn-pay"
                onClick={() => { setPaymentStep('confirm'); setErrorMessage(''); }}
              >
                Tekrar Dene
              </button>
              <button className="pm-btn-cancel" onClick={onClose}>Kapat</button>
            </div>
          )}

          {/* Hidden form that POSTs directly to Paratika (Direct POST 3D) */}
          {/* Rendered outside step conditionals so it persists during step changes */}
          {sessionToken && (
            <form
              ref={formRef}
              method="POST"
              action={`https://vpos.paratika.com.tr/paratika/api/v2/post/sale3d/${sessionToken}`}
              style={{ display: 'none' }}
            >
              <input type="hidden" name="cardOwner" value={cardOwner} />
              <input type="hidden" name="pan" value={cardNumber.replace(/\s/g, '')} />
              <input type="hidden" name="expiryMonth" value={expiryMonth} />
              <input type="hidden" name="expiryYear" value={expiryYear} />
              <input type="hidden" name="cvv" value={cvv} />
            </form>
          )}

        </div>
      </div>
    </>
  );
};

export default PaymentModal;
