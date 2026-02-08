import React, { createContext, useState, useEffect } from "react";
import api from "../lib/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Token expiry check helper
        const isTokenExpired = (token) => {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
          } catch {
            return true; // Invalid token format = expired
          }
        };

        // 1. URL'den token kontrolü (Google Redirect senaryosu için)
        const searchParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = searchParams.get("token");

        let storedToken = localStorage.getItem("token");
        let storedUser = localStorage.getItem("user");

        // URL'de token varsa (Google'dan dönülmüşse) onu önceliklendir
        if (tokenFromUrl) {
          // Check if new token is expired
          if (isTokenExpired(tokenFromUrl)) {
            console.warn("Token from URL is expired, clearing...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }

          storedToken = tokenFromUrl;
          localStorage.setItem("token", tokenFromUrl);

          // URL'i temizle (?token=... kısmını sil)
          window.history.replaceState({}, document.title, window.location.pathname);

          // Token'ı header'a ekle
          api.defaults.headers.common["Authorization"] = `Bearer ${tokenFromUrl}`;
        }

        // 2. Token varsa (Localde veya URL'den gelen) - önce expiry kontrolü
        if (storedToken) {
          // Check if stored token is expired
          if (isTokenExpired(storedToken)) {
            console.warn("Stored token is expired, clearing session...");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            delete api.defaults.headers.common["Authorization"];
            return; // Don't set user
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

          // User verisini güvenli şekilde parse et
          if (storedUser && storedUser !== "undefined") {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              console.error("JSON Parse Hatası:", e);
              localStorage.removeItem("user");
            }
          }
        }
      } catch (error) {
        console.error("Auth kontrol hatası:", error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // GİRİŞ YAP (Email veya Username ile)
  const login = async (identifier, password) => {
    const res = await api.post("/auth/login", { identifier, password });
    const { token, user: userData } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    return res.data;
  };

  // GOOGLE LOGIN (Tekile düşürüldü ve temizlendi)
  const googleLogin = async (googleToken) => {
    // Backend'e token'ı gönderiyoruz
    const res = await api.post("/auth/google", { token: googleToken });
    const { token, user: userData } = res.data;

    // Gelen verileri kaydediyoruz
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(userData);
    return res.data;
  };

  // KAYIT OL
  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    // Backend artık token dönmüyor, sadece success dönüyor
    return res.data;
  };

  // E-POSTA DOĞRULAMA (OTP)
  const verifyEmail = async (email, code) => {
    const res = await api.post("/auth/verify-email", { email, code });
    const { token, user: userData } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    return res.data;
  };

  // PROFIL TAMAMLA (Onboarding Survey - One-time)
  const completeProfile = async (surveyData) => {
    const res = await api.post("/user/complete-profile", surveyData);

    // Update user state with completed profile
    const updatedUser = { ...user, isProfileComplete: true, surveyData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);

    return res.data;
  };

  // ÇIKIŞ YAP
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, googleLogin, register, logout, verifyEmail, completeProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
