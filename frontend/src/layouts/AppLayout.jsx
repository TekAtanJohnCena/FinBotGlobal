// src/layouts/AppLayout.jsx
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  ChatBubbleLeftEllipsisIcon,
  ChartBarIcon,
  WalletIcon,
  RectangleStackIcon,
  AcademicCapIcon,
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
      {/* Sadece aktif olanın metnini göster veya çok küçük yaz */}
      <span className={`text-[9px] mt-0.5 font-medium truncate ${isActive ? 'text-white' : 'text-[#8E918F]'}`}>
        {label}
      </span>
    </NavLink>
  );
}

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-[#131314] overflow-hidden">
      {/* Sidebar - Masaüstünde görünür, mobilde gizli */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* İçerik Alanı - Desktop: sidebar offset, Mobile: full width + bottom nav padding */}
      <main className="flex-1 h-full w-full relative pb-14 md:pb-0 md:ml-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - Sadece mobilde görünür (6 öğe) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-[#1E1F20] border-t border-[#3C4043]/30 z-50 safe-area-bottom">
        <div className="flex items-center justify-between h-14 px-1">
          <BottomNavItem
            to="/chat"
            label="Chat"
            Icon={ChatBubbleLeftEllipsisIcon}
            IconActive={ChatSolid}
          />
          <BottomNavItem
            to="/portfolio"
            label="Portföy"
            Icon={ChartBarIcon}
            IconActive={ChartSolid}
          />
          <BottomNavItem
            to="/wallet"
            label="Cüzdan"
            Icon={WalletIcon}
            IconActive={WalletSolid}
          />
          <BottomNavItem
            to="/screener"
            label="Piyasa"
            Icon={RectangleStackIcon}
            IconActive={RectSolid}
          />
          <BottomNavItem
            to="/news"
            label="Haberler"
            Icon={Newspaper}
            IconActive={Newspaper}
          />
          <BottomNavItem
            to="/academy"
            label="Akademi"
            Icon={AcademicCapIcon}
            IconActive={AcaSolid}
          />
        </div>
      </nav>
    </div>
  );
}