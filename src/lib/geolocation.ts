import type { Language } from './i18n';

const GEOLOCATION_API = 'https://api.ipapi.com/api/check?access_key=YOUR_API_KEY';

interface GeolocationResponse {
  country_code: string;
  location: {
    languages: Array<{
      code: string;
      name: string;
    }>;
  };
}

const countryToLanguage: Record<string, Language> = {
  // English-speaking countries
  US: 'en',
  GB: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  
  // European countries
  IT: 'it',
  VA: 'it',
  SM: 'it',
  
  DE: 'de',
  AT: 'de',
  CH: 'de',
  
  GR: 'el',
  CY: 'el',
  
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  PE: 'es',
  VE: 'es',
  CL: 'es',
  
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  MC: 'fr',
};

const languageCodeToLanguage: Record<string, Language> = {
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  it: 'it',
  'it-IT': 'it',
  de: 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  el: 'el',
  'el-GR': 'el',
  es: 'es',
  'es-ES': 'es',
  'es-419': 'es',
  fr: 'fr',
  'fr-FR': 'fr',
  'fr-BE': 'fr',
  'fr-CH': 'fr',
};

const detectBrowserLanguage = (): Language | null => {
  const languages = navigator.languages || [navigator.language];
  
  for (const lang of languages) {
    const normalizedLang = lang.toLowerCase();
    const baseLang = normalizedLang.split('-')[0];
    
    // Check for exact match
    if (languageCodeToLanguage[lang]) {
      return languageCodeToLanguage[lang];
    }
    
    // Check for base language match
    if (languageCodeToLanguage[baseLang]) {
      return languageCodeToLanguage[baseLang];
    }
  }
  
  return null;
};

export const detectUserLanguage = async (): Promise<Language> => {
  try {
    // First try browser language detection
    const browserLang = detectBrowserLanguage();
    if (browserLang) {
      return browserLang;
    }

    // If browser detection fails, use the default language
    return 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
};