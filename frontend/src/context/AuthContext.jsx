import React, { createContext, useState, useEffect } from "react";
import api from "../lib/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── SESSION CHECK ON MOUNT ───
  // Instead of decoding JWT client-side, we verify the session via API.
  // If access_token cookie is valid → user data comes back.
  // If expired → api.js interceptor will silently refresh.
  // If refresh also fails → user stays null (not logged in).
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Backward compat: check if there's a token from URL (Google redirect)
        const searchParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = searchParams.get("token");

        if (tokenFromUrl) {
          localStorage.setItem("token", tokenFromUrl);
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Try to load user from localStorage cache first (instant render)
        const cachedUser = localStorage.getItem("user");
        if (cachedUser && cachedUser !== "undefined") {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            localStorage.removeItem("user");
          }
        }

        // Verify session with backend (this will trigger refresh if needed)
        const res = await api.get("/user/profile");
        if (res.data) {
          const userData = res.data.user || res.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        // Session invalid — clear everything
        console.log("Session check failed, user not authenticated.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ─── GİRİŞ YAP (Email veya Username ile) ───
  const login = async (identifier, password) => {
    const res = await api.post("/auth/login", { identifier, password });
    const { user: userData, token } = res.data;

    // Backward compat: keep token in localStorage for now
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  // ─── GOOGLE LOGIN ───
  const googleLogin = async (googleToken) => {
    const res = await api.post("/auth/google", { token: googleToken });
    const { user: userData, token } = res.data;

    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  // ─── KAYIT OL (Auto-login — backend artık token döner) ───
  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    const { user: userData, token } = res.data;

    // Auto-login: store token and user
    if (token) localStorage.setItem("token", token);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
    return res.data;
  };

  // ─── PROFIL TAMAMLA (Onboarding Survey) ───
  const completeProfile = async (surveyData) => {
    const res = await api.post("/user/complete-profile", surveyData);

    const updatedUser = { ...user, isProfileComplete: true, surveyData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);

    return res.data;
  };

  // ─── ÇIKIŞ YAP ───
  const logout = async () => {
    try {
      // Tell backend to clear cookies + revoke refresh token
      await api.post("/auth/logout");
    } catch {
      // Even if backend call fails, still clear client state
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, googleLogin, register, logout, completeProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
