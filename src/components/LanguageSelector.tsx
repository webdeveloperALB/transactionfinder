import React from 'react';
import { languages, useI18n, type Language } from '../lib/i18n';
import { Globe } from 'lucide-react';
import { secureStorage } from '../lib/storage';

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    // Store the language preference securely
    secureStorage.set({ language: newLanguage });
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all">
          <Globe className="w-5 h-5" />
          <span>{languages[language]}</span>
        </button>
        
        <div className="absolute right-0 mt-2 w-48 py-2 bg-white/10 backdrop-blur-xl rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          {Object.entries(languages).map(([code, name]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code as Language)}
              className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                code === language ? 'text-indigo-400' : 'text-white'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}