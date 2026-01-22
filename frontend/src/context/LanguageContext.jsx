import React, { createContext, useState, useEffect } from 'react';
import { translations, getTranslation } from '../i18n/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Get language from localStorage or default to Turkish
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('finbot-language') || 'tr';
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('finbot-language', language);
    
    // Set document direction for Arabic
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const changeLanguage = (newLanguage) => {
    if (['tr', 'en', 'ar'].includes(newLanguage)) {
      setLanguage(newLanguage);
    }
  };

  const t = (key) => getTranslation(language, key);

  const value = {
    language,
    changeLanguage,
    t,
    translations: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

