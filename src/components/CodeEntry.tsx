import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n, translations } from '../lib/i18n';

export function CodeEntry() {
  const navigate = useNavigate();
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const { language } = useI18n();
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // First check if this code exists in temp_codes and is unused
      const { data: tempCode, error: tempError } = await supabase
        .from('temp_codes')
        .select('*')
        .eq('code', secretCode)
        .eq('used', false)
        .maybeSingle();

      if (tempError) {
        console.error('Error checking temp code:', tempError);
        setError(t.networkError);
        return;
      }

      if (tempCode) {
        // Valid unused temp code, proceed to verification
        navigate('/', { state: { secretCode } });
        return;
      }

      // If not found in temp_codes, check if it's already associated with a user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('secret_code', secretCode)
        .maybeSingle();

      if (userError) {
        console.error('Error checking user code:', userError);
        setError(t.networkError);
        return;
      }

      if (!userData) {
        setError(t.invalidCode);
        return;
      }

      // Code exists and is associated with a user, proceed to check their status
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (!transactionData) {
        navigate('/transaction-info', { state: { secretCode } });
        return;
      }

      // Check search status
      const { data: searchData } = await supabase
        .from('search_results')
        .select('status, search_started_at, search_completed_at')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (searchData) {
        const now = new Date();
        const startTime = searchData.search_started_at ? new Date(searchData.search_started_at) : null;
        const endTime = searchData.search_completed_at ? new Date(searchData.search_completed_at) : null;

        if (startTime && endTime && now < endTime) {
          navigate('/searching', { state: { secretCode } });
          return;
        }

        if (searchData.status === 'found' || (endTime && now > endTime)) {
          navigate('/results', { state: { secretCode } });
          return;
        }
      }

      navigate('/transaction-info', { state: { secretCode } });
    } catch (error) {
      console.error('Error:', error);
      setError(t.networkError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Diagonal stripes */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.5) 40px,
              rgba(255,255,255,0.5) 80px
            )`
          }}
        />

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-orange-500/40 rounded-full animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-400/30 rounded-full animate-pulse-slower" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-yellow-500/40 rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse-slower" />

        {/* Glowing gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-pulse-very-slow"
          style={{
            background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, rgba(249,115,22,0.2) 30%, transparent 70%)'
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 backdrop-blur-xl border border-orange-500/20 mb-6 shadow-xl">
            <div className="relative">
              <Key className="w-9 h-9 text-orange-400" strokeWidth={2} />
              <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30 animate-pulse-slow" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-3 text-white tracking-tight">
            {t.enterCode}
          </h1>
          <p className="text-base text-neutral-400 font-light">
            {t.trackStatus}
          </p>
        </div>

        {/* Form card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-2xl blur-lg opacity-30" />

          <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="secretCode" className="block text-sm font-medium text-neutral-300 mb-2.5">
                  {t.recoveryCode}
                </label>
                <div className="relative">
                  <input
                    id="secretCode"
                    type="text"
                    required
                    className="w-full px-4 py-3.5 bg-black/40 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 text-base font-mono tracking-widest uppercase"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    placeholder={t.enterRecoveryCodePlaceholder}
                  />
                </div>
                {error && (
                  <div className="mt-3 flex items-start gap-3 text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-4 py-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="relative w-full group overflow-hidden rounded-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 transition-all duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                <span className="relative block px-6 py-3.5 text-white font-semibold text-base">
                  {t.continue}
                </span>
              </button>

              <div className="text-center pt-1">
                <p className="text-sm text-neutral-500">
                  {t.needCode}{' '}
                  <a
                    href="mailto:support@transactionfinder.in"
                    className="text-orange-400 hover:text-orange-300 font-medium transition-colors duration-200 underline decoration-orange-400/30 hover:decoration-orange-300/50 underline-offset-2"
                  >
                    {t.contactSupport}
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.1);
            }
          }

          @keyframes pulse-slower {
            0%, 100% {
              opacity: 0.2;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.15);
            }
          }

          @keyframes pulse-very-slow {
            0%, 100% {
              opacity: 0.15;
              transform: scale(1);
            }
            50% {
              opacity: 0.25;
              transform: scale(1.05);
            }
          }

          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }

          .animate-pulse-slower {
            animation: pulse-slower 5s ease-in-out infinite;
            animation-delay: 1s;
          }

          .animate-pulse-very-slow {
            animation: pulse-very-slow 8s ease-in-out infinite;
          }

          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 3s linear infinite;
          }
        `}
      </style>
    </div>
  );
}
