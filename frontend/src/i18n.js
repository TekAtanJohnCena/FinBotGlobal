// PATH: frontend/src/i18n.js
/**
 * i18next Configuration
 * 
 * - Auto-detects browser language
 * - Falls back to English ('en')
 * - Loads translations from /locales/tr.json and /locales/en.json
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import trTranslation from './locales/tr.json';
import enTranslation from './locales/en.json';

i18n
    .use(LanguageDetector)    // Tarayıcı dilini otomatik algıla
    .use(initReactI18next)    // React entegrasyonu
    .init({
        resources: {
            tr: { translation: trTranslation },
            en: { translation: enTranslation }
        },
        fallbackLng: 'en',       // Varsayılan dil (İngilizce)
        interpolation: {
            escapeValue: false     // React zaten XSS koruması sağlıyor
        },
        detection: {
            // Dil tespit sırası
            order: ['localStorage', 'navigator', 'htmlTag'],
            // Dil tercihini localStorage'da sakla
            caches: ['localStorage'],
            lookupLocalStorage: 'finbot_language'
        }
    });

export default i18n;
