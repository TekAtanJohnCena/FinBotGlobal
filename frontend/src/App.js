import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";

// --- SAYFALAR (Public) ---
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AcademyCourseView from "./pages/AcademyCourseView";
import ResetPassword from "./pages/ResetPassword";
import MobileApp from "./pages/MobileApp";
import NotFound from "./pages/NotFound"; // 404 Sayfası

// --- SAYFALAR (Legal) ---
import KVKKText from './pages/legal/KVKKText';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import TermsOfUse from './pages/legal/TermsOfUse';

// --- SAYFALAR (Private / Korumalı) ---
import ChatWithHistory from "./pages/ChatWithHistory";
import PortfolioPage from "./pages/Portfolio";
import ScreenerPage from "./pages/Screener";
import KapTerminal from "./pages/Kap"; // KAP Haberleri
import WalletPage from "./pages/Wallet"; // Yeni eklenen Cüzdan sayfası

// --- LAYOUT ---
import AppLayout from "./layouts/AppLayout";

/**
 * 🛡️ KORUMA KALKANI (Protected Route)
 * Kullanıcı giriş yapmamışsa Login sayfasına atar.
 * Yüklenme durumunda bekleme ekranı gösterir.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

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

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  // App genel yükleniyorsa boş ekran göster (Flicker'ı önler)
  if (loading) {
    return <div className="min-h-screen bg-[#0b0c0f]"></div>;
  }

  return (
    <LanguageProvider>
      <Routes>
        {/* =================================================
          1. HERKESE AÇIK SAYFALAR (Public Routes)
      ================================================= */}
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<MobileApp />} />
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
          <Route path="/screener" element={<ScreenerPage />} />
          <Route path="/kap" element={<KapTerminal />} />
          <Route path="/academy" element={<AcademyCourseView />} />
        </Route>

        {/* Legal Pages */}
        <Route path="/legal/kvkk" element={<KVKKText />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/cookies" element={<CookiePolicy />} />
        <Route path="/legal/terms" element={<TermsOfUse />} />
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
    </LanguageProvider>
  );
}

export default App;