import React, { useState, useEffect } from 'react';
import { Save, Shield, Mail, Key, Globe, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PRICING_TIERS } from '../../lib/constants';

interface SystemSettings {
  timeLimitsEnabled: boolean;
}

export function Settings() {
  const [settings, setSettings] = useState({
    searchDuration: 6,
    emailNotifications: true,
    adminEmail: 'admin@transactionfinder.co',
    defaultLanguage: 'en',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timeLimitsEnabled: true
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;

      setSystemSettings({
        timeLimitsEnabled: data.time_limits_enabled
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load system settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('system_settings')
        .update({
          time_limits_enabled: systemSettings.timeLimitsEnabled,
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        })
        .eq('id', 1);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold">System Settings</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Duration Limits
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="timeLimits"
                    checked={systemSettings.timeLimitsEnabled}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      timeLimitsEnabled: e.target.checked
                    })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="timeLimits" className="text-sm font-medium text-gray-700">
                    Enable Search Duration Limits
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  When enabled, searches will be limited based on the user's plan:
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside ml-4">
                  <li>{PRICING_TIERS.FREE.searchDuration} hours for Free Plan</li>
                  <li>{PRICING_TIERS.PRO.searchDuration} hours for Pro Plan</li>
                  <li>{PRICING_TIERS.ENTERPRISE.searchDuration} hours for Enterprise Plan</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    adminEmail: e.target.value
                  })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Language
              </label>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultLanguage: e.target.value
                  })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="el">Greek</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  emailNotifications: e.target.checked
                })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                Enable Email Notifications
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold">Security Settings</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Admin Password
              </label>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="twoFactor"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="twoFactor" className="text-sm font-medium text-gray-700">
                Enable Two-Factor Authentication
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}