import CryptoJS from 'crypto-js';
import type { Language } from './i18n';

const STORAGE_KEY = 'secure_transaction_data';
const ENCRYPTION_KEY = 'your-secure-key-2025'; // In production, this should be an environment variable

interface SecureStorageData {
  secretCode?: string;
  language?: Language;
  lastAccess: number;
}

export const secureStorage = {
  set: (data: Partial<SecureStorageData>) => {
    try {
      // Get existing data and merge with new data
      const existingData = secureStorage.get();
      const newData = {
        ...existingData,
        ...data,
        lastAccess: Date.now()
      };

      // Only validate secret code if it's being set
      if (data.secretCode !== undefined) {
        // Allow both 12-character alphanumeric codes and null/undefined
        if (data.secretCode !== null && 
            (typeof data.secretCode !== 'string' || 
             !/^[A-Z0-9]{12}$/.test(data.secretCode))) {
          console.error('Invalid secret code format:', data.secretCode);
          return false;
        }
      }

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(newData),
        ENCRYPTION_KEY
      ).toString();
      
      // Store encrypted data
      localStorage.setItem(STORAGE_KEY, encrypted);
      return true;
    } catch (error) {
      console.error('Error storing data:', error);
      return false;
    }
  },

  get: (): SecureStorageData => {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return { lastAccess: Date.now() };

      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const dataString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!dataString) return { lastAccess: Date.now() };
      
      const data = JSON.parse(dataString);

      // Validate data structure
      if (typeof data !== 'object') return { lastAccess: Date.now() };

      // Check data expiration (24 hours)
      const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (data.lastAccess && Date.now() - data.lastAccess > expirationTime) {
        secureStorage.clear();
        return { lastAccess: Date.now() };
      }

      return {
        ...data,
        lastAccess: data.lastAccess || Date.now()
      };
    } catch (error) {
      console.error('Error retrieving data:', error);
      return { lastAccess: Date.now() };
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
};