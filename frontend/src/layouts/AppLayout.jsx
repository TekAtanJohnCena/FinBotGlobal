// src/layouts/AppLayout.jsx
import React, { useContext } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import logo from '../images/logo1.png';
import {
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  WalletIcon,
  RectangleStackIcon,
  AcademicCapIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftEllipsisIcon as ChatSolid,
  ChartBarIcon as ChartSolid,
  WalletIcon as WalletSolid,
  RectangleStackIcon as RectSolid,
  AcademicCapIcon as AcaSolid,
} from '@heroicons/react/24/solid';
import { Newspaper } from 'lucide-react';

// Bottom Navigation Item Component - Compact design for 6 items
function BottomNavItem({ to, label, Icon, IconActive }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className="flex flex-col items-center justify-center flex-1 py-1.5 transition-colors min-w-0"
    >
      {isActive ? (
        <IconActive className="w-5 h-5 text-white" />
      ) : (
        <Icon className="w-5 h-5 text-[#8E918F]" />
      )}
      <span className={`text-[9px] mt-0.5 font-medium truncate ${isActive ? 'text-white' : 'text-[#8E918F]'}`}>
        {label}
      </span>
    </NavLink>
  );
}

/**
 * Mobile Language Toggle (TR | EN)
 * Compact for top bar
 */
function MobileLanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[11px] font-medium"
      title={currentLang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
    >
      <span className={currentLang === 'tr' ? 'text-emerald-400' : 'text-[#8E918F]'}>TR</span>
      <span className="text-[#3C4043] mx-0.5">|</span>
      <span className={currentLang === 'en' ? 'text-emerald-400' : 'text-[#8E918F]'}>EN</span>
    </button>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const userInitial = user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex h-screen w-full bg-[#131314] overflow-hidden">
      {/* Sidebar - Desktop only (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* ═══ MOBILE TOP BAR — md:hidden ═══ */}
      <div className="fixed top-0 left-0 right-0 md:hidden bg-[#1E1F20] border-b border-[#3C4043]/30 z-50 h-12 flex items-center justify-between px-3">
        {/* Left: Logo */}
        <NavLink to="/" className="flex items-center gap-2 no-underline">
          <img src={logo} alt="FinBot" width="28" height="28" />
          <span className="text-emerald-400 font-bold text-sm tracking-wide">FinBot</span>
        </NavLink>

        {/* Right: Upgrade CTA + Language Toggle + Profile Avatar */}
        <div className="flex items-center gap-2">
          {user?.subscriptionTier === 'FREE' && (
            <NavLink
              to="/pricing"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 no-underline"
            >
              <StarIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">PRO</span>
            </NavLink>
          )}
          <MobileLanguageToggle />
          <button
            onClick={() => navigate('/settings')}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 grid place-items-center text-white font-bold text-xs shadow-lg border border-white/10 hover:scale-105 transition-transform"
            title={user?.fullName || user?.firstName || user?.email || 'Profil'}
          >
            {userInitial}
          </button>
        </div>
      </div>

      {/* İçerik Alanı - Desktop: sidebar offset, Mobile: full width + top bar + bottom nav padding */}
      <main className="flex-1 h-full w-full relative pt-12 pb-14 md:pt-0 md:pb-0 md:ml-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile only (hidden on desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#1E1F20] border-t border-[#3C4043]/30 z-50 safe-area-bottom">
        <div className="flex items-center justify-between h-14 px-1">
          <BottomNavItem
            to="/chat"
            label={t('navbar.chat')}
            Icon={ChatBubbleLeftEllipsisIcon}
            IconActive={ChatSolid}
          />
          <BottomNavItem
            to="/portfolio"
            label={t('navbar.portfolio')}
            Icon={ChartBarIcon}
            IconActive={ChartSolid}
          />
          <BottomNavItem
            to="/wallet"
            label={t('navbar.wallet')}
            Icon={WalletIcon}
            IconActive={WalletSolid}
          />
          <BottomNavItem
            to="/screener"
            label={t('navbar.market')}
            Icon={RectangleStackIcon}
            IconActive={RectSolid}
          />
          <BottomNavItem
            to="/news"
            label={t('navbar.news')}
            Icon={Newspaper}
            IconActive={Newspaper}
          />
          <BottomNavItem
            to="/academy"
            label={t('navbar.academy')}
            Icon={AcademicCapIcon}
            IconActive={AcaSolid}
          />
        </div>
      </nav>
    </div>
  );
}