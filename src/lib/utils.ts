import { v4 as uuidv4 } from 'uuid';
import type { Language } from './i18n';

export function generateSecretCode(): string {
  // Generate a random 12-character code using UUID and timestamp
  const timestamp = Date.now().toString(36).slice(-2);
  const uuid = uuidv4().replace(/-/g, '').slice(0, 10);
  return (uuid + timestamp).toUpperCase();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatTime(seconds: number, language: Language): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const translations = {
    en: { h: 'h', m: 'm', s: 's' },
    it: { h: 'h', m: 'm', s: 's' },
    de: { h: 'Std', m: 'Min', s: 'Sek' },
    el: { h: 'ώ', m: 'λ', s: 'δ' },
    es: { h: 'h', m: 'm', s: 's' },
    fr: { h: 'h', m: 'm', s: 's' }
  };

  const t = translations[language];
  
  return `${hours}${t.h} ${minutes}${t.m} ${remainingSeconds}${t.s}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}