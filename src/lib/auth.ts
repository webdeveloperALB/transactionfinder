import CryptoJS from 'crypto-js';

// Admin credentials - in production these would be in environment variables
const ADMIN_USERNAME = 'admin@transactionfinder.co';
const ADMIN_PASSWORD = 'TF_Admin_2025!';

// Encryption key for storing auth state
const AUTH_KEY = 'admin_auth_2025';

export const adminAuth = {
  login: (username: string, password: string): boolean => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const authData = {
        username,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(authData),
        AUTH_KEY
      ).toString();

      localStorage.setItem('admin_session', encrypted);
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('admin_session');
  },

  isAuthenticated: (): boolean => {
    try {
      const encrypted = localStorage.getItem('admin_session');
      if (!encrypted) return false;

      const decrypted = CryptoJS.AES.decrypt(encrypted, AUTH_KEY);
      const authData = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

      // Check if session is expired
      if (Date.now() > authData.expiresAt) {
        localStorage.removeItem('admin_session');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
};