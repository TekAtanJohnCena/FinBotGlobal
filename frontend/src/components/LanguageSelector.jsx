import React, { useState, useContext, useRef, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const LanguageSelector = ({ className = '' }) => {
    const { language, changeLanguage } = useContext(LanguageContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
        { code: 'en', flag: '🇬🇧', name: 'English' },
        { code: 'ar', flag: '🇸🇦', name: 'العربية' }
    ];

    const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode) => {
        changeLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div className={`language-selector ${className}`} ref={dropdownRef} style={styles.container}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={styles.button}
                aria-label="Select language"
            >
                <span style={styles.flag}>{currentLanguage.flag}</span>
                <span style={styles.languageCode}>{currentLanguage.code.toUpperCase()}</span>
                <svg
                    style={{
                        ...styles.chevron,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                >
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            style={{
                                ...styles.dropdownItem,
                                ...(lang.code === language ? styles.dropdownItemActive : {})
                            }}
                        >
                            <span style={styles.dropdownFlag}>{lang.flag}</span>
                            <span style={styles.dropdownName}>{lang.name}</span>
                            {lang.code === language && (
                                <svg
                                    style={styles.checkIcon}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                >
                                    <path
                                        d="M13.5 4.5L6 12L2.5 8.5"
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'relative',
        display: 'inline-block',
        zIndex: 1000
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.85rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none'
    },
    flag: {
        fontSize: '1.1rem',
        lineHeight: 1
    },
    languageCode: {
        fontFamily: 'monospace',
        fontSize: '0.75rem'
    },
    chevron: {
        transition: 'transform 0.2s ease',
        opacity: 0.6
    },
    dropdown: {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        minWidth: '160px',
        background: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease'
    },
    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        color: '#fff',
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none'
    },
    dropdownItemActive: {
        background: 'rgba(59, 130, 246, 0.1)'
    },
    dropdownFlag: {
        fontSize: '1.2rem',
        marginRight: '10px'
    },
    dropdownName: {
        flex: 1,
        textAlign: 'left'
    },
    checkIcon: {
        marginLeft: '8px'
    }
};

// Add CSS animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .language-selector button:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  .language-selector [style*="dropdownItem"]:hover {
    background: rgba(59, 130, 246, 0.15) !important;
  }

  .language-selector [style*="dropdownItem"]:last-child {
    border-bottom: none !important;
  }
`;

if (!document.head.querySelector('.language-selector-styles')) {
    styleSheet.classList.add('language-selector-styles');
    document.head.appendChild(styleSheet);
}

export default LanguageSelector;
