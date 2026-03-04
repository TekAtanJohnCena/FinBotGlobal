import React, { useContext, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppLayout from "./layouts/AppLayout";
import CookieConsent from "./components/CookieConsent";

// --- SAYFALAR (Public) ---
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const PricingSubscription = lazy(() => import("./pages/PricingSubscription"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AcademyCourseView = lazy(() => import("./pages/AcademyCourseView"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MobileApp = lazy(() => import("./pages/MobileApp"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const Settings = lazy(() => import("./pages/Settings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));

// --- SAYFALAR (Legal) ---
const KVKKText = lazy(() => import('./pages/legal/KVKKText'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const TermsOfUse = lazy(() => import('./pages/legal/TermsOfUse'));
const DistanceSalesAgreement = lazy(() => import('./pages/legal/DistanceSalesAgreement'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));

// --- SAYFALAR (Private / Korumalı) ---
const ChatWithHistory = lazy(() => import("./pages/ChatWithHistory"));
const PortfolioPage = lazy(() => import("./pages/Portfolio"));
const ScreenerPage = lazy(() => import("./pages/Screener"));
const WalletPage = lazy(() => import("./pages/Wallet"));
const FinancialsPage = lazy(() => import("./pages/Financials"));
const MarketsPage = lazy(() => import("./pages/Markets"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const NewsPage = lazy(() => import("./pages/News"));

// --- LAYOUT ---
// import AppLayout moved to top

/**
 * 🛡️ KORUMA KALKANI (Protected Route)
 * Kullanıcı giriş yapmamışsa Login sayfasına atar.
 * Profil tamamlanmamışsa Onboarding sayfasına yönlendirir.
 * Yüklenme durumunda bekleme ekranı gösterir.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    // Daha şık, merkezi bir yükleme ekranı
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-gray-400 text-sm animate-pulse">FinBot Verileri Hazırlıyor...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Onboarding redirect - profil tamamlanmamışsa onboarding'e yönlendir
  // (Onboarding sayfasında iken döngüyü önle)
  if (!user.isProfileComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0b0c0f] flex flex-col items-center justify-center text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
  </div>
);

function App() {
  const { user, loading } = useContext(AuthContext);

  // App genel yükleniyorsa boş ekran göster (Flicker'ı önler)
  if (loading) {
    return <div className="min-h-screen bg-[#0b0c0f]"></div>;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <CookieConsent />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* =================================================
            1. HERKESE AÇIK SAYFALAR (Public Routes)
        ================================================= */}
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<MobileApp />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/pricing" element={<PricingSubscription />} />

            {/* Onboarding - Protected but without AppLayout */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/chat" element={<ChatWithHistory />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/screener" element={<Navigate to="/screener/AAPL" replace />} />
              <Route path="/screener/:symbol" element={<ScreenerPage />} />
              <Route path="/financials/:symbol" element={<FinancialsPage />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/academy" element={<AcademyCourseView />} />
              <Route path="/support" element={<Support />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Payment Status - Public (Paratika 3D Secure redirect geldiğinde auth gerekmez) */}
            <Route path="/payment-status" element={<PaymentStatus />} />

            {/* Legal Pages */}
            <Route path="/legal/kvkk" element={<KVKKText />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/cookies" element={<CookiePolicy />} />
            <Route path="/legal/terms" element={<TermsOfUse />} />
            <Route path="/mesafeli-satis-sozlesmesi" element={<DistanceSalesAgreement />} />
            <Route path="/iptal-iade-kosullari" element={<RefundPolicy />} />
            {/* Legacy redirects */}
            <Route path="/kvkk-aydinlatma" element={<Navigate to="/legal/kvkk" replace />} />
            <Route path="/gizlilik-politikasi" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/cerez-politikasi" element={<Navigate to="/legal/cookies" replace />} />
            <Route path="/kullanim-sartlari" element={<Navigate to="/legal/terms" replace />} />

            {/* =================================================
            2. AUTH (Giriş / Kayıt)
            Zaten giriş yapmış kullanıcıyı Chat'e yönlendir.
        ================================================= */}
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/chat" replace />}
            />
            <Route
              path="/register"
              element={!user ? <Register /> : <Navigate to="/chat" replace />}
            />
            <Route
              path="/forgot-password"
              element={!user ? <ForgotPassword /> : <Navigate to="/chat" replace />}
            />
            <Route
              path="/reset-password/:token"
              element={!user ? <ResetPassword /> : <Navigate to="/chat" replace />}
            />

            {/* =================================================
            4. 404 SAYFASI
            Bilinmeyen bir sayfaya gidilirse 404 sayfasını göster.
        ================================================= */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;