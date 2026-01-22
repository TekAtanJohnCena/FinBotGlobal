import { useState, useEffect } from "react";
import api from "../lib/api";
import { SubscriptionTier, SubscriptionStatus } from "../types/user";

/**
 * Custom hook to fetch user profile data including subscription information
 */
export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/user/profile");
      
      // Ensure default values for subscription
      const userData = {
        ...response.data,
        subscriptionTier: response.data.subscriptionTier || SubscriptionTier.FREE,
        subscriptionStatus: response.data.subscriptionStatus || SubscriptionStatus.INACTIVE,
      };
      
      setProfile(userData);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.response?.data?.message || "Profil bilgileri alınamadı");
      
      // Fallback: Use localStorage user data if available
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setProfile({
            ...parsedUser,
            subscriptionTier: parsedUser.subscriptionTier || SubscriptionTier.FREE,
            subscriptionStatus: parsedUser.subscriptionStatus || SubscriptionStatus.INACTIVE,
          });
        } catch (parseErr) {
          // Ignore parse errors
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

