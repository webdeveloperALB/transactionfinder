import { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { detectUserLanguage } from '../lib/geolocation';
import { secureStorage } from '../lib/storage';

export const useLanguageDetection = () => {
  const { setLanguage } = useI18n();

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // First check secure storage for previously selected language
        const stored = secureStorage.get();
        if (stored.language) {
          setLanguage(stored.language);
          return;
        }

        // If no stored language, detect based on browser and location
        const detectedLanguage = await detectUserLanguage();
        
        // Set the detected language
        setLanguage(detectedLanguage);
        
        // Save the detected language to storage
        secureStorage.set({ language: detectedLanguage });
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to English on error
        setLanguage('en');
        secureStorage.set({ language: 'en' });
      }
    };

    initializeLanguage();
  }, [setLanguage]);
};