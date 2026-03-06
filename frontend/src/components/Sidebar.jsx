// PATH: src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  RectangleStackIcon,
  AcademicCapIcon,
  WalletIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import logo from "../images/logo1.png";
import { NewspaperIcon } from "lucide-react";
import UserProfileDropdown from "./UserProfileDropdown";

// Stil nesnesini Sidebar'a da ekleyelim (Gemini Dark Mode)
const sidebarStyle = {
  backgroundColor: '#131314', // Ana tema ile aynı
  borderRight: 'none'
};

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group flex flex-col items-center no-underline transition w-full py-1",
          isActive ? "text-white" : "text-[#8E918F] hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <div
            className={[
              "grid place-items-center h-10 w-10 rounded-xl transition",
              "group-hover:bg-white/5",
              isActive
                ? "bg-white/10"
                : "bg-transparent",
            ].join(" ")}
          >
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-[11px] mt-1 font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * Language Toggle Button (TR | EN)
 * Compact pill-style toggle for sidebar
 */
function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[11px] font-medium"
      title={currentLang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
    >
      <span className={currentLang === 'tr' ? 'text-emerald-400' : 'text-[#8E918F]'}>TR</span>
      <span className="text-[#3C4043] mx-0.5">|</span>
      <span className={currentLang === 'en' ? 'text-emerald-400' : 'text-[#8E918F]'}>EN</span>
    </button>
  );
}

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();

  const tier = user?.subscriptionTier?.toUpperCase() || "FREE";
  // Show upgrade only if NOT PRO and NOT PLUS (handles all aliases)
  const shouldShowUpgrade = !['PRO', 'PLUS', 'PREMIUM', 'BASIC', 'BASİC', 'PREMİUM'].includes(tier);

  return (
    <aside
      style={sidebarStyle}
      className="fixed left-0 top-0 h-screen w-20 text-white flex flex-col items-center pt-3 pb-2 z-50"
    >
      {/* LOGO */}
      <NavLink to="/" className="flex items-center justify-center no-underline mb-3 shrink-0">
        <img src={logo} alt="FinBot" width="36" height="36" />
      </NavLink>

      <nav className="flex flex-col w-full px-2 flex-1 min-h-0 justify-between py-6 overflow-y-auto no-scrollbar">
        <NavItem to="/chat" label={t('navbar.finbot')} Icon={ChatBubbleLeftEllipsisIcon} />
        <NavItem to="/portfolio" label={t('navbar.portfolio')} Icon={ChartBarIcon} />
        <NavItem to="/wallet" label={t('navbar.wallet')} Icon={WalletIcon} />
        <NavItem to="/screener" label={t('navbar.market')} Icon={RectangleStackIcon} />
        <NavItem to="/news" label={t('navbar.news')} Icon={NewspaperIcon} />
        <NavItem to="/academy" label={t('navbar.academy')} Icon={AcademicCapIcon} />

        {shouldShowUpgrade && (
          <NavLink
            to="/pricing"
            className="group flex flex-col items-center no-underline transition w-full py-1"
          >
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 group-hover:from-amber-500/30 group-hover:to-yellow-500/20 transition-all">
              <StarIcon className="h-6 w-6 text-amber-400 group-hover:text-amber-300" />
            </div>
            <span className="text-[10px] mt-1 font-bold text-amber-400 group-hover:text-amber-300 text-center leading-tight">
              {t('common.upgrade')}
            </span>
          </NavLink>
        )}
      </nav>

      {/* ALT KISIM — her zaman görünür, asla gizlenmez */}
      <div className="flex flex-col items-center gap-3 w-full px-2 pt-4 pb-4 shrink-0 border-t border-white/5">
        <LanguageToggle />

        {/* Profil avatarı */}
        <div className="w-full flex justify-center">
          <UserProfileDropdown
            userInitial={user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
            onLogout={logout}
            dropdownDirection="up"
          />
        </div>
      </div>
    </aside>
  );
}
