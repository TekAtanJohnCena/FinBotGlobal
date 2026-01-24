// PATH: src/components/Sidebar.jsx

import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
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
          "group flex flex-col items-center no-underline transition w-full py-2",
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

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <aside
      // 👇 KESİN ÇÖZÜM: border-r kaldırıldı, style ile renk ve border sıfırlandı
      style={sidebarStyle}
      className="fixed left-0 top-0 h-screen w-20 text-white flex flex-col items-center py-6 z-50"
    >
      {/* LOGO + FINBOT TEXT */}
      <NavLink to="/" className="flex flex-col items-center space-y-1 no-underline mb-2">
        <img src={logo} alt="FinBot" width="39" height="39" />
        <span className="text-emerald-400 font-bold text-sm tracking-wide">FinBot</span>
      </NavLink>

      {/* MENÜLER */}
      <nav className="flex flex-col space-y-2 mt-8 w-full px-2">
        <NavItem to="/chat" label="FinBot" Icon={ChatBubbleLeftEllipsisIcon} />
        <NavItem to="/portfolio" label="Portföy" Icon={ChartBarIcon} />
        <NavItem to="/wallet" label="Cüzdan" Icon={WalletIcon} />
        <NavItem to="/screener" label="Piyasa" Icon={RectangleStackIcon} />
        <NavItem to="/news" label="Haberler" Icon={NewspaperIcon} />
        <NavItem to="/academy" label="Akademi" Icon={AcademicCapIcon} />
      </nav>

      {/* BOŞLUK */}
      <div className="flex-1" />

      {/* ALT KISIM: KULLANICI PROFİL MENÜSÜ */}
      <div className="flex flex-col items-center space-y-5 mb-4 w-full">
        <UserProfileDropdown
          userInitial={user?.username?.charAt(0).toUpperCase() || "U"}
          onLogout={logout}
        />
      </div>
    </aside>
  );
}