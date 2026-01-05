import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DollarSign,
  Bitcoin,
  Building,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Wallet,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n, translations } from '../lib/i18n';
import { formatCurrency } from '../lib/utils';

interface SearchResult {
  status: string;
  found_transactions: Array<{
    amount: number;
    bitcoinAmount: number;
    transactionId: string;
    bankEmail: string;
    bankAddress: string;
    walletAddress?: string;
  }>;
  tier: string;
  search_started_at: string;
  search_completed_at: string;
  payment_status: string;
  payment_required: boolean;
  search_progress: number;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const secretCode = location.state?.secretCode;
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language } = useI18n();
  const t = translations[language];

  useEffect(() => {
    const checkSearchStatus = async () => {
      try {
        if (!secretCode) {
          throw new Error(t.invalidCode);
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('secret_code', secretCode)
          .maybeSingle();

        if (userError || !userData) {
          throw new Error(t.invalidCode);
        }

        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userData.id)
          .maybeSingle();

        if (transactionError || !transactionData) {
          throw new Error(t.transactionNotFound);
        }

        setTransactionAmount(Number(transactionData.amount));

        const { data: searchData, error: searchError } = await supabase
          .from('search_results')
          .select(
            'status, found_transactions, tier, search_started_at, search_completed_at, payment_status, payment_required, search_progress'
          )
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (searchError) {
          throw new Error(t.searchResultsError);
        }

        if (searchData.status === 'searching' || searchData.payment_required) {
          navigate('/searching', { state: { secretCode } });
          return;
        }

        setSearchResult(searchData);
      } catch (error) {
        console.error('Error checking search status:', error);
        setError(error instanceof Error ? error.message : t.unknownError);
      }
    };

    checkSearchStatus();
  }, [secretCode, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500/10 via-rose-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 mb-4">
            <AlertCircle className="w-10 h-10 text-red-400" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">{t.error}</h2>
          <p className="text-neutral-400 text-lg max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (!searchResult || transactionAmount === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-neutral-800 border-t-orange-500" />
          <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const totalFound = searchResult.found_transactions.reduce((sum, detail) => {
    return sum + (Number(detail.amount) || 0);
  }, 0);

  const percentageFound = ((totalFound / transactionAmount) * 100).toFixed(1);

  const searchDuration = searchResult.search_completed_at && searchResult.search_started_at
    ? Math.floor(
        (new Date(searchResult.search_completed_at).getTime() -
          new Date(searchResult.search_started_at).getTime()) /
          1000
      )
    : 0;

  const formatSearchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Diagonal stripes */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.5) 40px,
              rgba(255,255,255,0.5) 80px
            )`,
          }}
        />

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-orange-500/40 rounded-full animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-400/30 rounded-full animate-pulse-slower" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-yellow-500/40 rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-orange-400/30 rounded-full animate-pulse-slower" />
        <div className="absolute top-1/2 left-1/5 w-1.5 h-1.5 bg-amber-500/30 rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/2 right-1/5 w-1 h-1 bg-orange-300/40 rounded-full animate-pulse-slower" />

        {/* Glowing gradient orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15 blur-3xl animate-pulse-very-slow"
          style={{
            background:
              'radial-gradient(circle, rgba(251,146,60,0.3) 0%, rgba(249,115,22,0.2) 30%, transparent 70%)',
          }}
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10 w-full max-w-4xl text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 backdrop-blur-xl border border-orange-500/20 mb-6 shadow-2xl">
          <div className="relative">
            <CheckCircle className="w-10 h-10 text-orange-400 animate-pulse-slow" strokeWidth={2} />
            <div className="absolute inset-0 bg-orange-400 blur-xl opacity-40 animate-pulse-slow" />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-6 text-white tracking-tight">
          {t.transactionLocated}
        </h1>

        <p className="text-lg text-neutral-400 font-light max-w-2xl mx-auto mb-8">
          {t.foundAtBank}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
          {/* Original Amount */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-xl blur-lg opacity-50" />
            <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/20">
                  <DollarSign className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                    {t.originalAmount}
                  </p>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {formatCurrency(transactionAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Found */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/30 via-amber-500/30 to-yellow-600/30 rounded-xl blur-lg opacity-60" />
            <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/30">
                  <TrendingUp className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                    {t.amountFound}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-orange-400 tabular-nums">
                      {formatCurrency(totalFound)}
                    </p>
                    <span className="text-sm text-orange-400/60 font-semibold">
                      {percentageFound}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Duration */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-xl blur-lg opacity-50" />
            <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/20">
                  <Clock className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                    Search Time
                  </p>
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {formatSearchTime(searchDuration)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Cards */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResult.found_transactions.map((detail, index) => (
          <div
            key={index}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative h-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-2xl blur-lg opacity-40" />
              <div className="relative h-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6 space-y-6 hover:border-orange-500/30 transition-all duration-300">
                {/* Transaction Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                      {t.transactionDetails}
                    </h3>
                    <div className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-semibold border border-orange-500/20">
                      {t.validTransaction}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-neutral-800/30 hover:bg-black/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/20">
                        <DollarSign className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-medium">Amount</p>
                        <p className="text-lg font-bold text-white tabular-nums">
                          {formatCurrency(detail.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-neutral-800/30 hover:bg-black/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/20">
                        <Bitcoin className="w-5 h-5 text-orange-400" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-medium">Bitcoin</p>
                        <p className="text-sm font-mono text-white tabular-nums">
                          {detail.bitcoinAmount.toFixed(8)} BTC
                        </p>
                      </div>
                    </div>

                    {detail.walletAddress && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-neutral-800/30 hover:bg-black/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                          <Wallet className="w-5 h-5 text-blue-400" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-neutral-500 font-medium mb-1">Wallet Address</p>
                          <p
                            className="text-xs font-mono text-neutral-300 break-all leading-relaxed"
                            title={detail.walletAddress}
                          >
                            {detail.walletAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Information Section */}
                <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                    {t.bankInformation}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50">
                        <Building className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium">Digital Chain Bank</span>
                    </div>

                    <div className="flex items-center gap-3 text-neutral-300 hover:text-blue-400 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50">
                        <Mail className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium break-all">
                        {detail.bankEmail || 'support@digitalchainbank.com'}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 text-neutral-300 hover:text-white transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50 flex-shrink-0">
                        <MapPin className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <span className="text-sm font-medium leading-relaxed">
                        {detail.bankAddress}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
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

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
            opacity: 0;
          }
        `}
      </style>
    </div>
  );
}
