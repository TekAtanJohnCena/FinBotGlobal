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
          "group flex flex-col items-center no-underline transition w-full py-1.5",
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

  return (
    <aside
      style={sidebarStyle}
      className="fixed left-0 top-0 h-screen w-20 text-white flex flex-col items-center py-6 z-50"
    >
      {/* LOGO + FINBOT TEXT */}
      <NavLink to="/" className="flex flex-col items-center space-y-1 no-underline mb-2">
        <img src={logo} alt="FinBot" width="39" height="39" />
        <span className="text-emerald-400 font-bold text-sm tracking-wide">FinBot</span>
      </NavLink>

      {/* MENÜLER — i18n ile çevrili */}
      <nav className="flex flex-col space-y-1 mt-4 w-full px-2">
        <NavItem to="/chat" label={t('navbar.finbot')} Icon={ChatBubbleLeftEllipsisIcon} />
        <NavItem to="/portfolio" label={t('navbar.portfolio')} Icon={ChartBarIcon} />
        <NavItem to="/wallet" label={t('navbar.wallet')} Icon={WalletIcon} />
        <NavItem to="/screener" label={t('navbar.market')} Icon={RectangleStackIcon} />
        <NavItem to="/news" label={t('navbar.news')} Icon={NewspaperIcon} />
        <NavItem to="/academy" label={t('navbar.academy')} Icon={AcademicCapIcon} />
      </nav>

      {/* BOŞLUK */}
      <div className="flex-1" />

      {/* ALT KISIM: DİL DEĞİŞTİRİCİ + KULLANICI PROFİL MENÜSÜ */}
      <div className="flex flex-col items-center space-y-3 mb-4 w-full">
        <LanguageToggle />
        <UserProfileDropdown
          userInitial={user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
          onLogout={logout}
        />
      </div>
    </aside>
  );
}