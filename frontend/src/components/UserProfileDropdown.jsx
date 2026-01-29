import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { SubscriptionTier } from "../types/user";
import {
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import "./UserProfileDropdown.css";

export default function UserProfileDropdown({ userInitial, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { profile, loading } = useUserProfile();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate("/settings");
  };

  const handleHelp = () => {
    setIsOpen(false);
    navigate("/support");
  };

  const handleUpgrade = () => {
    setIsOpen(false);
    navigate("/pricing");
  };

  const subscriptionTierLabels = {
    [SubscriptionTier.FREE]: "Ücretsiz",
    [SubscriptionTier.BASIC]: "Temel",
    [SubscriptionTier.PREMIUM]: "Premium",
  };

  const subscriptionTierColors = {
    [SubscriptionTier.FREE]: "bg-gray-600",
    [SubscriptionTier.BASIC]: "bg-blue-600",
    [SubscriptionTier.PREMIUM]: "bg-gradient-to-r from-indigo-600 to-purple-600",
  };

  const isFree = profile?.subscriptionTier === SubscriptionTier.FREE;

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 grid place-items-center text-white font-bold shadow-lg border border-white/10 cursor-pointer hover:scale-105 transition-transform"
        title={`Kullanıcı: ${profile?.username || "Misafir"}`}
      >
        {userInitial}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden transition-all duration-200 ease-out"
          style={{
            transformOrigin: "bottom left",
            animation: "dropdownFadeIn 0.2s ease-out"
          }}
        >
          {/* Header - User Info */}
          <div className="px-4 py-4 border-b border-gray-800 bg-gray-950">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 grid place-items-center text-white font-bold text-lg shadow-lg">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4" />
                  </div>
                ) : (
                  <>
                    <p className="text-white font-semibold text-sm truncate">
                      {profile?.username || "Kullanıcı"}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {profile?.email || "email@example.com"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="px-4 py-3 border-b border-gray-800">
            {loading ? (
              <div className="h-8 bg-gray-800 rounded animate-pulse" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${subscriptionTierColors[profile?.subscriptionTier || SubscriptionTier.FREE]
                      } text-white`}
                  >
                    {subscriptionTierLabels[profile?.subscriptionTier || SubscriptionTier.FREE]}
                  </span>
                </div>
                {isFree && (
                  <button
                    onClick={handleUpgrade}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-900/20"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" />
                    Yükselt
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleSettings}
              className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors flex items-center gap-3 group"
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-sm font-medium">Ayarlar</span>
            </button>

            <button
              onClick={handleHelp}
              className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors flex items-center gap-3 group"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-sm font-medium">Yardım & Destek</span>
            </button>

            <div className="border-t border-gray-800 my-1" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 group"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-sm font-medium">Çıkış Yap</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

