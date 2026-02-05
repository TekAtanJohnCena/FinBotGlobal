import React, { useState, useContext, useMemo, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import toast, { Toaster } from 'react-hot-toast';
import LanguageSelector from "../components/LanguageSelector";

// GOOGLE IMPORT
import { GoogleLogin } from '@react-oauth/google';

// GLOBAL PHONE INPUT
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/phone-input-dark.css';

// GÖRSELLER
import heroImage from "../images/finbot-auth-hero.png";
import logo from "../images/logo1.png";

// Plan bilgileri
const PLANS = {
  free: {
    name: "Free",
    nameKey: "free",
    price: 0,
    icon: "🎯",
    color: "#6b7280",
    features: ["5 Günlük FinBot Sorgusu", "Temel Piyasa Verileri", "E-posta Desteği"]
  },
  plus: {
    name: "Plus",
    nameKey: "plus",
    price: 189,
    icon: "⚡",
    color: "#3b82f6",
    popular: true,
    features: ["50 Günlük FinBot Sorgusu", "Gelişmiş Analiz Araçları", "Öncelikli Destek", "Portföy Takibi"]
  },
  pro: {
    name: "Pro",
    nameKey: "pro",
    price: 269,
    icon: "🚀",
    color: "#8b5cf6",
    features: ["Sınırsız FinBot Sorgusu", "Tüm Premium Özellikler", "7/24 VIP Destek", "API Erişimi", "Özel Raporlar"]
  },
  enterprise: {
    name: "Enterprise",
    nameKey: "enterprise",
    price: -1, // Custom pricing
    icon: "🏢",
    color: "#10b981",
    features: ["Özel Kurulum", "Dedicated Destek", "SLA Garantisi", "On-Premise Seçeneği"]
  }
};

// Luhn algoritması ile kart numarası doğrulama
const validateCardNumber = (number) => {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.length !== 16) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Kart numarası formatlama (4'lü gruplar)
const formatCardNumber = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

// Son kullanma tarihi formatlama
const formatExpiry = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  }
  return cleaned;
};

// Tarih doğrulama
const validateExpiry = (value) => {
  const [month, year] = value.split('/');
  if (!month || !year || year.length !== 2) return false;

  const m = parseInt(month, 10);
  const y = parseInt('20' + year, 10);

  if (m < 1 || m > 12) return false;

  const now = new Date();
  const expiry = new Date(y, m - 1);

  return expiry > now;
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Plan parametresi kontrolü
  const planParam = searchParams.get('plan')?.toLowerCase();
  const hasPlanParam = !!planParam && PLANS[planParam];

  // Seçilen plan (başlangıçta URL'den veya null)
  const [selectedPlanKey, setSelectedPlanKey] = useState(planParam || null);
  const selectedPlan = selectedPlanKey ? PLANS[selectedPlanKey] : null;

  // User form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardHolder, setCardHolder] = useState("");

  const [verificationPending, setVerificationPending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Multi-step flow
  // hasPlanParam=true: step 1=Register, step 2=Payment (eski akış)
  // hasPlanParam=false: step 0=Register, step 1=PlanSelect, step 2=Payment
  const [step, setStep] = useState(hasPlanParam ? 1 : 0);

  // Kullanıcı kayıt sonrası (henüz plan seçmeden)
  const [isRegistered, setIsRegistered] = useState(false);

  const { register, googleLogin, user, verifyEmail } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  const nf = useMemo(() => new Intl.NumberFormat("tr-TR"), []);

  // Kullanıcı durumu değiştiğinde akışı yönet
  useEffect(() => {
    if (!user) return; // Kullanıcı yoksa bir şey yapma

    // Kayıt sonrası plan seçim veya ödeme ekranında kalmalı
    if (isRegistered) {
      // Plan seçim ekranında (step 1, planless) veya ödeme ekranında (step 2) kal
      if (step === 1 && !hasPlanParam) {
        // Plan seçim ekranında kal
        return;
      }
      if (step === 2) {
        // Ödeme ekranında kal
        return;
      }
    }

    // Normal giriş durumu - zaten giriş yapmış kullanıcı buraya gelirse yönlendir
    // Ancak kayıt akışındaysa (veya verification adımındaysa) yönlendirme yapma
    if (!isRegistered && step !== 2 && step !== 'verification') {
      navigate('/chat');
    }
  }, [user, navigate, isRegistered, step, hasPlanParam]);

  // Ücretli plan kontrolü
  const isPaidPlan = selectedPlan && selectedPlan.price > 0;


  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleCVCChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCVC(value);
  };

  const validateUserForm = () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber || !birthDate || !username.trim() || !email.trim() || !password.trim()) {
      toast.error(t('auth.fillAllFields') || 'Lütfen tüm alanları doldurun');
      return false;
    }

    if (!termsAccepted || !privacyAccepted) {
      toast.error(t('auth.acceptTerms') || 'Kullanım koşullarını kabul etmelisiniz');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('auth.validEmail') || 'Geçerli bir e-posta adresi girin');
      return false;
    }

    if (phoneNumber.length < 10) {
      toast.error(t('auth.validPhone') || 'Geçerli bir telefon numarası girin');
      return false;
    }

    const birthDateObj = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < 18 || age > 120) {
      toast.error(t('auth.ageRequirement') || '18 yaşından büyük olmalısınız');
      return false;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordLength') || 'Şifre en az 6 karakter olmalı');
      return false;
    }

    if (username.length < 3) {
      toast.error(t('auth.usernameLength') || 'Kullanıcı adı en az 3 karakter olmalı');
      return false;
    }

    return true;
  };

  const validatePaymentForm = () => {
    if (!cardHolder.trim()) {
      toast.error('Kart sahibi adını girin');
      return false;
    }

    if (!validateCardNumber(cardNumber)) {
      toast.error('Geçersiz kart numarası');
      return false;
    }

    if (!validateExpiry(cardExpiry)) {
      toast.error('Geçersiz son kullanma tarihi');
      return false;
    }

    if (cardCVC.length !== 3) {
      toast.error('CVC 3 haneli olmalı');
      return false;
    }

    return true;
  };

  // STEP 0: Plan parametresi olmadan gelen kullanıcı için kayıt
  const handleStep0Submit = async (e) => {
    e.preventDefault();

    if (!validateUserForm()) return;

    setLoading(true);

    try {
      // Kullanıcıyı kaydet (Backend mail atacak)
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: `+${phoneNumber}`,
        birthDate,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      if (res.success) {
        toast.success(t('auth.otpSent') || 'Doğrulama kodu e-postanıza gönderildi!');
        setStep('verification'); // Mevcut formları gizle, OTP formunu göster
        setLoading(false);
      } else {
        // Fallback (eğer backend eski ise - token dönüyorsa)
        setIsRegistered(true);
        setStep(1);
        setLoading(false);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || t('auth.registerFailed') || 'Kayıt başarısız';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Lütfen 6 haneli kodu girin.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, otpCode);
      toast.success("E-posta doğrulandı! Hoş geldiniz.");

      setVerificationPending(false);
      setIsRegistered(true);

      // Eğer plan parametresi varsa ödeme adımına, yoksa plan seçimine
      if (hasPlanParam) {
        if (isPaidPlan) setStep(2);
        else {
          // Free plan param ile gelmişse bitti
          window.location.href = "/chat";
        }
      } else {
        setStep(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Doğrulama başarısız.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Plan parametresi ile gelen kullanıcı için kayıt (eski akış)
  const handleStep1Submit = async (e) => {
    e.preventDefault();

    if (!validateUserForm()) return;

    if (isPaidPlan) {
      // Ödeme adımına geç
      setStep(2);
    } else {
      // Free plan - direkt kayıt
      await completeRegistration();
    }
  };

  // STEP 2: Ödeme formu submit
  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (!validatePaymentForm()) return;

    await completePayment();
  };

  // Plan seçim handler'ı (Step 1 - plan seçim ekranından)
  const handlePlanSelect = async (planKey) => {
    if (planKey === 'enterprise') {
      // Enterprise için contact sayfasına yönlendir
      navigate('/contact');
      return;
    }

    setSelectedPlanKey(planKey);
    const plan = PLANS[planKey];

    if (plan.price === 0) {
      // Free plan seçildi - direkt dashboard'a
      toast.success('Free plan aktifleştirildi!');
      setTimeout(() => {
        window.location.href = "/chat";
      }, 500);
    } else {
      // Ücretli plan - ödeme ekranına geç
      setStep(2);
    }
  };

  // Kayıt tamamlama (plan parametresi ile gelenler için)
  const completeRegistration = async () => {
    setLoading(true);

    try {
      // 1. Kullanıcı kaydı
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: `+${phoneNumber}`,
        birthDate,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      toast.success(t('auth.registerSuccess') || 'Kayıt başarılı!');

      // Yönlendir
      setTimeout(() => {
        window.location.href = "/chat";
      }, 1000);

    } catch (err) {
      const errorMessage = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || t('auth.registerFailed') || 'Kayıt başarısız';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Ödeme tamamlama
  const completePayment = async () => {
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://kabc8j4wap.us-east-1.awsapprunner.com';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planName: selectedPlan.nameKey.toUpperCase(),
          interval: 'monthly',
          paymentDetails: {
            cardToken: 'mock_token_' + Date.now(),
            last4: cardNumber.slice(-4),
            brand: 'visa'
          }
        })
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Ödeme işlemi başarısız');
      }

      toast.success(`${selectedPlan.name} planına başarıyla yükseltildiniz!`);

      setTimeout(() => {
        window.location.href = "/chat";
      }, 1000);

    } catch (paymentError) {
      console.error('Payment error:', paymentError);
      toast.error('Ödeme işlemi başarısız. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      await googleLogin(credentialResponse.credential);

      // Google ile giriş sonrası
      if (!hasPlanParam) {
        // Plan parametresi yoksa plan seçim ekranına
        toast.success('Google ile giriş başarılı! Şimdi bir plan seçin.');
        setIsRegistered(true);
        setStep(1);
        setLoading(false);
        return;
      }

      if (isPaidPlan) {
        toast.success('Google ile giriş başarılı. Ödeme sayfasına yönlendiriliyorsunuz...');
        setStep(2);
        setLoading(false);
        return;
      }


      toast.success(t('auth.googleSuccess') || 'Google ile giriş başarılı');
      window.location.href = "/chat";
    } catch (error) {
      console.error(error);
      toast.error(t('auth.googleFailed') || 'Google ile giriş başarısız');
      setLoading(false);
    }
  };

  const styles = `
    /* GLOBAL - NO SCROLL */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      height: 100vh !important;
      width: 100vw !important;
      background: #0a0a0a !important;
    }

    /* WRAPPER */
    .auth-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #080a0e 0%, #0f1218 40%, #0a0c10 100%);
      display: flex;
      overflow: hidden;
    }

    /* FORM SIDE */
    .auth-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    /* SCROLLABLE FORM CONTAINER - Hidden scrollbar */
    .auth-form-container {
      width: 100%;
      max-width: 480px;
      max-height: 95vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1.5rem;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .auth-form-container::-webkit-scrollbar {
      display: none;
    }

    /* LOGO */
    .auth-logo {
      height: 36px;
      margin-bottom: 1.25rem;
    }

    /* TITLE */
    .auth-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.4rem 0;
    }

    .auth-subtitle {
      color: #888;
      margin: 0 0 1.25rem 0;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    /* PLAN SUMMARY CARD */
    .plan-summary-card {
      background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(16,185,129,0.05) 100%);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    
    .plan-summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    
    .plan-summary-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
    }
    
    .plan-summary-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #10b981;
    }
    
    .plan-features-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .plan-feature-tag {
      background: rgba(255,255,255,0.05);
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-size: 0.7rem;
      color: #aaa;
    }

    /* STEPS INDICATOR */
    .steps-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    
    .step-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      transition: all 0.3s ease;
    }
    
    .step-dot.active {
      background: #3b82f6;
      box-shadow: 0 0 10px rgba(59,130,246,0.5);
    }
    
    .step-line {
      width: 40px;
      height: 2px;
      background: rgba(255,255,255,0.1);
    }

    /* FORM ROW - 2 columns */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin-bottom: 0.65rem;
    }

    .form-group {
      margin-bottom: 0.65rem;
    }

    /* Phone group - high z-index */
    .phone-group {
      position: relative;
      z-index: 1000;
    }

    .form-label {
      display: block;
      color: #aaa;
      font-size: 0.75rem;
      font-weight: 500;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .form-hint {
      color: #666;
      font-size: 0.7rem;
      margin-top: 0.25rem;
    }

    /* GLASSMORPHISM INPUTS */
    .glass-input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      outline: none;
      box-sizing: border-box;
    }

    .glass-input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .glass-input:focus {
      border-color: #3b82f6;
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }
    
    .glass-input.card-input {
      font-family: 'Courier New', monospace;
      letter-spacing: 0.1em;
    }

    /* Date input fix */
    .glass-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1) opacity(0.4);
      cursor: pointer;
    }

    /* PRIMARY BUTTON - GLOW */
    .btn-primary {
      width: 100%;
      padding: 0.8rem 1.25rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
    }
    
    .btn-primary.btn-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 28px rgba(59, 130, 246, 0.45);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-secondary {
      width: 100%;
      padding: 0.7rem 1rem;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      color: #888;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }
    
    .btn-secondary:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* DIVIDER */
    .divider {
      display: flex;
      align-items: center;
      margin: 1rem 0;
      gap: 0.75rem;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255,255,255,0.08);
    }

    .divider-text {
      color: #555;
      font-size: 0.7rem;
      text-transform: lowercase;
    }

    /* GOOGLE BUTTON - SAME WIDTH AS PRIMARY */
    .google-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    .google-container > div {
      width: 100% !important;
    }

    /* FOOTER */
    .auth-footer {
      text-align: center;
      color: #777;
      margin-top: 1rem;
      font-size: 0.8rem;
    }

    .auth-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .auth-link:hover {
      color: #60a5fa;
    }

    /* IMAGE SIDE - PLAN DETAILS */
    .auth-image-side {
      flex: 1.1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(59,130,246,0.05) 0%, transparent 100%);
      position: relative;
    }

    .auth-image-side::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 30%, rgba(59,130,246,0.08) 0%, transparent 50%);
    }

    .hero-image {
      max-width: 85%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 16px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.5);
      position: relative;
      z-index: 1;
    }

    /* PREMIUM CREDIT CARD PREVIEW */
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
    
    .card-preview {
      width: 380px;
      height: 240px;
      background: 
        radial-gradient(ellipse at 0% 0%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 100% 0%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 100% 100%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 0% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
        linear-gradient(160deg, #0f0f23 0%, #1a1a3e 25%, #0d0d1f 50%, #151530 75%, #0a0a1a 100%);
      border-radius: 20px;
      padding: 1.75rem 2rem;
      position: relative;
      box-shadow: 
        0 25px 80px rgba(99, 102, 241, 0.15),
        0 15px 40px rgba(0, 0, 0, 0.4),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
      margin-bottom: 2rem;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      overflow: hidden;
      transform: perspective(1000px) rotateX(2deg) rotateY(-2deg);
      transition: transform 0.4s ease, box-shadow 0.4s ease;
    }
    
    .card-preview:hover {
      transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(-5px);
      box-shadow: 
        0 35px 100px rgba(99, 102, 241, 0.25),
        0 20px 50px rgba(0, 0, 0, 0.5),
        inset 0 1px 1px rgba(255, 255, 255, 0.15);
    }
    
    /* Holographic overlay effect */
    .card-preview::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        125deg,
        transparent 0%,
        rgba(255, 255, 255, 0.03) 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.02) 75%,
        transparent 100%
      );
      pointer-events: none;
      border-radius: 20px;
    }
    
    /* Subtle pattern overlay */
    .card-preview::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
      pointer-events: none;
      border-radius: 20px;
    }
    
    /* Realistic EMV Chip */
    .card-chip {
      width: 55px;
      height: 42px;
      background: linear-gradient(145deg, #d4af37 0%, #c5a028 20%, #f0d060 40%, #c9a227 60%, #a08020 80%, #d4af37 100%);
      border-radius: 8px;
      margin-bottom: 1.25rem;
      position: relative;
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.3),
        inset 0 1px 2px rgba(255, 255, 255, 0.4),
        inset 0 -1px 2px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    
    /* Chip circuit lines */
    .card-chip::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 38px;
      height: 28px;
      background: 
        linear-gradient(90deg, transparent 0%, transparent 45%, rgba(160, 128, 32, 0.6) 45%, rgba(160, 128, 32, 0.6) 55%, transparent 55%, transparent 100%),
        linear-gradient(0deg, transparent 0%, transparent 40%, rgba(160, 128, 32, 0.6) 40%, rgba(160, 128, 32, 0.6) 60%, transparent 60%, transparent 100%);
      border-radius: 4px;
    }
    
    .card-chip::after {
      content: '';
      position: absolute;
      top: 6px;
      left: 6px;
      right: 6px;
      bottom: 6px;
      border: 1px solid rgba(160, 128, 32, 0.5);
      border-radius: 4px;
      background: linear-gradient(135deg, 
        rgba(240, 208, 96, 0.3) 0%, 
        rgba(169, 145, 65, 0.2) 50%, 
        rgba(240, 208, 96, 0.3) 100%);
    }
    
    /* NFC Symbol */
    .card-nfc {
      position: absolute;
      top: 1.75rem;
      left: 5.5rem;
      width: 24px;
      height: 24px;
      opacity: 0.4;
    }
    
    .card-nfc::before,
    .card-nfc::after {
      content: '';
      position: absolute;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
    }
    
    .card-nfc::before {
      width: 12px;
      height: 12px;
      top: 6px;
      left: 6px;
      border-right-color: transparent;
      border-bottom-color: transparent;
      transform: rotate(-45deg);
    }
    
    .card-nfc::after {
      width: 20px;
      height: 20px;
      top: 2px;
      left: 2px;
      border-right-color: transparent;
      border-bottom-color: transparent;
      transform: rotate(-45deg);
    }
    
    /* Card Number */
    .card-number-preview {
      font-family: 'Space Mono', 'Courier New', monospace;
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.25em;
      margin-bottom: 1.25rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 2;
    }
    
    /* Card Details Row */
    .card-details-row {
      display: flex;
      justify-content: flex-start;
      align-items: flex-end;
      gap: 2.5rem;
      position: relative;
      z-index: 2;
      margin-bottom: 0.5rem;
    }
    
    .card-detail {
      font-family: 'Space Mono', 'Courier New', monospace;
    }
    
    .card-detail-label {
      color: rgba(255, 255, 255, 0.45);
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 0.3rem;
    }
    
    .card-detail-value {
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    /* Visa Logo */
    .card-brand {
      position: absolute;
      bottom: 1.5rem;
      right: 1.75rem;
      z-index: 2;
    }
    
    .card-brand svg {
      height: 32px;
      width: auto;
      opacity: 0.9;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    /* Mastercard Logo Alternative */
    .card-brand-mc {
      display: flex;
      gap: -8px;
    }
    
    .card-brand-mc .circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    
    .card-brand-mc .circle:first-child {
      background: #eb001b;
      opacity: 0.9;
    }
    
    .card-brand-mc .circle:last-child {
      background: #f79e1b;
      opacity: 0.9;
      margin-left: -12px;
    }
    
    /* Finbot Logo on Card */
    .card-bank-logo {
      position: absolute;
      top: 1.75rem;
      right: 2rem;
      font-family: 'Space Mono', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    /* ========== PLAN SELECTION CARDS ========== */
    .plan-selection-container {
      width: 100%;
      max-width: 900px;
      padding: 1rem;
    }
    
    .plan-selection-title {
      text-align: center;
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    
    .plan-selection-subtitle {
      text-align: center;
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    
    .plan-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    
    .plan-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .plan-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--plan-color);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .plan-card:hover {
      transform: translateY(-5px);
      border-color: var(--plan-color);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    }
    
    .plan-card:hover::before {
      opacity: 1;
    }
    
    .plan-card.popular {
      border-color: rgba(59, 130, 246, 0.3);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%);
    }
    
    .plan-card-badge {
      position: absolute;
      top: -1px;
      right: 1rem;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.3rem 0.75rem;
      border-radius: 0 0 8px 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .plan-card-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }
    
    .plan-card-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    
    .plan-card-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--plan-color);
      margin-bottom: 1rem;
    }
    
    .plan-card-price span {
      font-size: 0.85rem;
      font-weight: 400;
      color: #888;
    }
    
    .plan-card-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.25rem 0;
    }
    
    .plan-card-features li {
      color: #aaa;
      font-size: 0.8rem;
      padding: 0.35rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .plan-card-features li::before {
      content: '✓';
      color: var(--plan-color);
      font-weight: bold;
    }
    
    .plan-card-btn {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--plan-color);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .plan-card-btn:hover {
      filter: brightness(1.1);
      transform: scale(1.02);
    }
    
    .plan-card-btn.btn-outline {
      background: transparent;
      border: 1px solid var(--plan-color);
      color: var(--plan-color);
    }
    
    .plan-card-btn.btn-outline:hover {
      background: var(--plan-color);
      color: #fff;
    }

    @media (max-width: 1100px) {
      .plan-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 600px) {
      .plan-cards-grid {
        grid-template-columns: 1fr;
      }
      
      .plan-selection-container {
        padding: 0.5rem;
      }
      
      .plan-selection-title {
        font-size: 1.4rem;
      }
    }

    /* MOBILE - HIDE IMAGE */
    @media (max-width: 900px) {
      .auth-image-side {
        display: none;
      }

      .auth-form-side {
        padding: 0.5rem;
        align-items: flex-start;
        padding-top: 0.75rem;
      }

      .auth-form-container {
        padding: 0.75rem;
        max-height: 100vh;
      }

      .auth-logo {
        height: 26px;
        margin-bottom: 0.5rem;
      }

      .auth-title {
        font-size: 1.25rem;
        margin-bottom: 0.15rem;
      }

      .auth-subtitle {
        display: none;
      }

      .form-row {
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
      }

      .form-group {
        margin-bottom: 0.4rem;
      }

      .form-label {
        font-size: 0.7rem;
        margin-bottom: 0.2rem;
      }

      .form-hint {
        display: none;
      }

      .glass-input {
        padding: 0.55rem 0.7rem;
        font-size: 0.8rem;
        border-radius: 6px;
      }

      .btn-primary {
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
        margin-top: 0.3rem;
        border-radius: 8px;
      }

      .divider {
        margin: 0.5rem 0;
      }

      .divider-text {
        font-size: 0.65rem;
      }

      .auth-footer {
        margin-top: 0.5rem;
        font-size: 0.75rem;
      }
      
      .plan-summary-card {
        padding: 0.75rem;
        margin-bottom: 0.75rem;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          },
        }}
      />

      <div className="auth-wrapper">
        {/* ========== STEP 1: PLAN SELECTION (after planless registration) ========== */}
        {step === 1 && !hasPlanParam && isRegistered ? (
          <div className="auth-form-side" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <div className="plan-selection-container">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Link to="/">
                  <img src={logo} alt="Finbot" className="auth-logo" />
                </Link>
              </div>

              <h1 className="plan-selection-title">Planınızı Seçin</h1>
              <p className="plan-selection-subtitle">
                Devam etmek için bir plan seçin. İstediğiniz zaman yükseltebilirsiniz.
              </p>

              <div className="plan-cards-grid">
                {Object.entries(PLANS).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`plan-card ${plan.popular ? 'popular' : ''}`}
                    style={{ '--plan-color': plan.color }}
                    onClick={() => handlePlanSelect(key)}
                  >
                    {plan.popular && <div className="plan-card-badge">Popüler</div>}
                    <div className="plan-card-icon">{plan.icon}</div>
                    <div className="plan-card-name">{plan.name}</div>
                    <div className="plan-card-price">
                      {plan.price === 0 ? 'Ücretsiz' : plan.price === -1 ? 'Özel Fiyat' : `₺${nf.format(plan.price)}`}
                      {plan.price > 0 && <span>/ay</span>}
                    </div>
                    <ul className="plan-card-features">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`plan-card-btn ${plan.price === 0 ? 'btn-outline' : ''}`}
                    >
                      {plan.price === 0 ? 'Ücretsiz Başla' : plan.price === -1 ? 'İletişime Geç' : 'Seç'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ========== FORM SIDE ========== */}
            <div className="auth-form-side">
              <div className="auth-form-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <Link to="/">
                    <img src={logo} alt="Finbot" className="auth-logo" style={{ margin: 0 }} />
                  </Link>
                  <LanguageSelector />
                </div>

                {/* Plan Summary Card - only show when plan is selected */}
                {selectedPlan && (
                  <div className="plan-summary-card">
                    <div className="plan-summary-header">
                      <div className="plan-summary-title">
                        <span>{selectedPlan.icon}</span>
                        <span>{selectedPlan.name} Plan</span>
                      </div>
                      <div className="plan-summary-price">
                        {selectedPlan.price === 0 ? 'Ücretsiz' : `₺${nf.format(selectedPlan.price)}/ay`}
                      </div>
                    </div>
                    <div className="plan-features-list">
                      {selectedPlan.features.map((feature, idx) => (
                        <span key={idx} className="plan-feature-tag">✓ {feature}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps Indicator */}
                {(isPaidPlan || (!hasPlanParam && step > 0)) && (
                  <div className="steps-indicator">
                    <div className={`step-dot ${step >= 0 ? 'active' : ''}`}></div>
                    <div className="step-line"></div>
                    <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
                    {isPaidPlan && (
                      <>
                        <div className="step-line"></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
                      </>
                    )}
                  </div>
                )}

                {/* Dynamic Title */}
                <h1 className="auth-title">
                  {step === 0 && (t('auth.registerTitle') || 'Hesap Oluştur')}
                  {step === 1 && hasPlanParam && (t('auth.registerTitle') || 'Hesap Oluştur')}
                  {step === 2 && 'Ödeme Bilgileri'}
                </h1>
                <p className="auth-subtitle">
                  {step === 0 && (t('auth.registerSubtitle') || 'FinBot ile finansal özgürlüğüne adım at')}
                  {step === 1 && hasPlanParam && (t('auth.registerSubtitle') || 'FinBot ile finansal özgürlüğüne adım at')}
                  {step === 2 && 'Güvenli ödeme ile planınızı aktifleştirin'}
                </p>

                {/* ========== STEP 0 or STEP 1 (with plan): REGISTER FORM ========== */}
                {(step === 0 || (step === 1 && hasPlanParam)) ? (
                  <form onSubmit={hasPlanParam ? handleStep1Submit : handleStep0Submit}>
                    {/* Ad / Soyad */}
                    <div className="form-row">
                      <div style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('auth.firstName') || 'Ad'}</label>
                        <input
                          type="text"
                          className="glass-input"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          placeholder={t('auth.firstNamePlaceholder') || 'Adınız'}
                        />
                      </div>
                      <div style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('auth.lastName') || 'Soyad'}</label>
                        <input
                          type="text"
                          className="glass-input"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          placeholder={t('auth.lastNamePlaceholder') || 'Soyadınız'}
                        />
                      </div>
                    </div>

                    {/* Telefon / Doğum Tarihi */}
                    <div className="form-row">
                      <div className="phone-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('auth.phone') || 'Telefon'}</label>
                        <PhoneInput
                          country={'tr'}
                          value={phoneNumber}
                          onChange={setPhoneNumber}
                          inputClass="glass-input"
                          containerStyle={{ position: 'relative', zIndex: 1000 }}
                          dropdownStyle={{ zIndex: 99999 }}
                          enableSearch={true}
                          searchPlaceholder="Ülke ara..."
                          placeholder={t('auth.phonePlaceholder') || '5XX XXX XXXX'}
                        />
                      </div>
                      <div style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('auth.birthDate') || 'Doğum Tarihi'}</label>
                        <input
                          type="date"
                          className="glass-input"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          required
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        />
                      </div>
                    </div>

                    {/* Kullanıcı Adı */}
                    <div className="form-group">
                      <label className="form-label">{t('auth.username') || 'Kullanıcı Adı'}</label>
                      <input
                        type="text"
                        className="glass-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder={t('auth.usernamePlaceholder') || 'kullaniciadi'}
                      />
                      <div className="form-hint">{t('auth.usernameHint') || 'En az 3 karakter'}</div>
                    </div>

                    {/* E-posta */}
                    <div className="form-group">
                      <label className="form-label">{t('auth.email') || 'E-posta'}</label>
                      <input
                        type="email"
                        className="glass-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder={t('auth.emailPlaceholder') || 'ornek@email.com'}
                      />
                    </div>

                    {/* Şifre */}
                    <div className="form-group">
                      <label className="form-label">{t('auth.password') || 'Şifre'}</label>
                      <input
                        type="password"
                        className="glass-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder={t('auth.passwordPlaceholder') || '••••••••'}
                      />
                      <div className="form-hint">{t('auth.passwordHint') || 'En az 6 karakter'}</div>
                    </div>

                    {/* Terms and Privacy Checkboxes */}
                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: '#ddd', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                        <span>
                          {t('auth.termsAcceptance') || "Okudum, kabul ediyorum:"}{' '}
                          <Link to="/legal/terms" target="_blank" className="auth-link">{t('auth.termsOfService') || 'Kullanım Koşulları'}</Link>
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', color: '#ddd', fontSize: '0.8rem' }}>
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                        <span>
                          {t('auth.termsAcceptance') || "Okudum, kabul ediyorum:"}{' '}
                          <Link to="/legal/privacy" target="_blank" className="auth-link">{t('auth.privacyPolicy') || 'Gizlilik Politikası'}</Link>
                        </span>
                      </label>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner" />
                          İşleniyor...
                        </>
                      ) : (
                        isPaidPlan ? 'Devam Et →' : (t('auth.registerButton') || 'Kayıt Ol')
                      )}
                    </button>
                  </form>
                ) : step === 2 ? (
                  /* STEP 2: ÖDEME FORMU */
                  <form onSubmit={handleStep2Submit}>
                    {/* Kart Sahibi */}
                    <div className="form-group">
                      <label className="form-label">Kart Sahibi</label>
                      <input
                        type="text"
                        className="glass-input"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="AD SOYAD"
                        required
                      />
                    </div>

                    {/* Kart Numarası */}
                    <div className="form-group">
                      <label className="form-label">Kart Numarası</label>
                      <input
                        type="text"
                        className="glass-input card-input"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        required
                      />
                    </div>

                    {/* SKT / CVC */}
                    <div className="form-row">
                      <div>
                        <label className="form-label">Son Kullanma</label>
                        <input
                          type="text"
                          className="glass-input card-input"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="AA/YY"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label">CVC</label>
                        <input
                          type="text"
                          className="glass-input card-input"
                          value={cardCVC}
                          onChange={handleCVCChange}
                          placeholder="000"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary btn-success" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner" />
                          Ödeme Yapılıyor...
                        </>
                      ) : (
                        <>🔒 ₺{nf.format(selectedPlan.price)} Öde</>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      ← Geri Dön
                    </button>
                  </form>
                ) : null}

                {(step === 0 || (step === 1 && hasPlanParam)) && (
                  <>
                    <div className="divider">
                      <div className="divider-line" />
                      <span className="divider-text">{t('auth.orContinueWith') || 'veya'}</span>
                      <div className="divider-line" />
                    </div>

                    <div className="google-container">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google bağlantısı başarısız.")}
                        theme="filled_black"
                        shape="pill"
                        width="100%"
                        text="signup_with"
                      />
                    </div>
                  </>
                )}

                <p className="auth-footer">
                  {t('auth.haveAccount') || 'Zaten hesabınız var mı?'}{" "}
                  <Link to="/login" className="auth-link">{t('auth.signIn') || 'Giriş Yap'}</Link>
                </p>
                {/* OTP VERIFICATION FORM */}
                {step === 'verification' && (
                  <form onSubmit={handleVerifyEmail} className="animate-fade-in w-full">
                    <style>{`
                  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                  .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
                  .otp-input { letter-spacing: 0.5em; font-size: 1.5rem; text-align: center; font-weight: bold; }
                `}</style>
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4 border border-emerald-500/20">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">E-Posta Doğrulama</h3>
                      <p className="text-zinc-400 text-sm">
                        Lütfen <span className="text-white font-medium">{email}</span> adresine gönderilen 6 haneli doğrulama kodunu girin.
                      </p>
                    </div>

                    <div className="form-group mb-6">
                      <input
                        type="text"
                        maxLength="6"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="------"
                        className="glass-input otp-input border-emerald-500/30 focus:border-emerald-500"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="btn-primary btn-success"
                    >
                      {loading ? <div className="spinner" /> : "Doğrula ve Devam Et"}
                    </button>

                    <div className="text-center mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(0); // Geri dön
                        }}
                        className="text-sm text-zinc-500 hover:text-white transition-colors"
                      >
                        ← E-posta adresini değiştir
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

            <div className="auth-image-side">
              {step === 2 ? (
                /* Premium Kart Önizleme */
                <div className="card-preview">
                  {/* Bank Logo */}
                  <div className="card-bank-logo">FINBOT</div>

                  {/* EMV Chip */}
                  <div className="card-chip"></div>

                  {/* NFC Symbol */}
                  <div className="card-nfc"></div>

                  {/* Card Number */}
                  <div className="card-number-preview">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  {/* Card Details */}
                  <div className="card-details-row">
                    <div className="card-detail">
                      <div className="card-detail-label">Card Holder</div>
                      <div className="card-detail-value">{cardHolder || 'YOUR NAME'}</div>
                    </div>
                    <div className="card-detail">
                      <div className="card-detail-label">Expires</div>
                      <div className="card-detail-value">{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>

                  {/* Visa Logo SVG */}
                  <div className="card-brand">
                    <svg viewBox="0 0 1000 324" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#ffffff" d="M651.19 0.5c-70.93 0-134.32 36.76-134.32 104.69 0 77.9 112.42 83.28 112.42 122.42 0 16.48-18.88 31.23-51.14 31.23-45.77 0-79.98-20.61-79.98-20.61l-14.64 68.55s39.41 17.41 91.73 17.41c77.55 0 138.58-38.57 138.58-107.66 0-82.32-112.89-87.54-112.89-123.86 0-12.91 15.5-27.05 47.66-27.05 36.29 0 65.89 14.99 65.89 14.99l14.33-66.2S696.61 0.5 651.19 0.5zM0 5.5l-1.98 11.66s29.63 5.43 56.27 16.17c34.33 12.41 36.78 19.68 42.57 42.04l63.06 241.78h84.63l130.09-311.64H289.91l-83.42 211.39-34.27-179.62c-3.19-20.44-19.83-31.77-39.19-31.77H0zM385.03 5.5L325.86 317.15h80.58L465.53 5.5H385.03zM898.67 5.5c-19.34 0-29.59 10.35-37.11 28.45L744.09 317.15h84.65l16.53-46.12h103.31l9.9 46.12H1034L966.99 5.5H898.67zm11.69 84.19l24.91 117.96h-67.19l42.28-117.96z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img src={heroImage} alt="Finbot" className="hero-image" />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Auth;
