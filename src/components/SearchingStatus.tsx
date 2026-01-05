import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Loader, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Globe } from './Globe';
import { useI18n, translations } from '../lib/i18n';

async function getWalletAddress(satoshiAmount: number): Promise<string> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blockchair-proxy?amount=${satoshiAmount}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Blockchair proxy');
    }

    const data = await response.json();
    if (data.address) {
      return data.address;
    }

    return 'bc' + Array.from({ length: 42 }, () =>
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
        Math.floor(Math.random() * 58)
      ]).join('');
  } catch (error) {
    console.error('Error fetching from Blockchair:', error);
    return 'bc' + Array.from({ length: 42 }, () =>
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
        Math.floor(Math.random() * 58)
      ]).join('');
  }
}

export function SearchingStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const secretCode = location.state?.secretCode;
  const [transactions, setTransactions] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [searchTier, setSearchTier] = useState<string>('free');
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const { language } = useI18n();
  const t = translations[language];

  const aiMessages = [
    "Analyzing blockchain transaction patterns...",
    "Cross-referencing with global financial databases...",
    "Detecting similar transaction signatures...",
    "Investigating connected wallet addresses...",
    "Scanning dark web marketplaces...",
    "Analyzing temporal transaction patterns...",
    "Evaluating geographical transaction routes...",
    "Checking known cryptocurrency exchanges...",
    "Investigating associated wallet clusters...",
    "Analyzing transaction velocity patterns..."
  ];

  useEffect(() => {
    const fetchTransactionTimes = async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('secret_code', secretCode)
        .single();

      if (!userData) return;

      const { data: searchData } = await supabase
        .from('search_results')
        .select('search_started_at, search_completed_at, tier')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (searchData) {
        const transactionStartTime = new Date(searchData.search_started_at);
        const transactionEndTime = new Date(searchData.search_completed_at);
        setStartTime(transactionStartTime);
        setEndTime(transactionEndTime);
        setSearchTier(searchData.tier || 'free');
      }
    };

    fetchTransactionTimes();
  }, [secretCode]);

  useEffect(() => {
    if (!startTime || !endTime) return;

    const simulateSearch = async () => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('secret_code', secretCode)
          .single();

        if (!userData) return;

        const { data: transactionData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userData.id)
          .single();

        if (!transactionData) return;

        const totalAmount = transactionData.amount;
        const btcPrice = 53000;

        const initialPercentage = Math.random() * (0.0005 - 0.0002) + 0.0002;
        let initialAmount = Math.round(totalAmount * initialPercentage * 100) / 100;

        if (initialAmount < 200) initialAmount = 200;
        if (initialAmount > 1000) initialAmount = 1000;

        const bitcoinAmount = Math.round((initialAmount / btcPrice) * 100000000) / 100000000;
        const satoshiAmount = Math.floor(bitcoinAmount * 100000000);

        const walletAddress = await getWalletAddress(satoshiAmount);

        const transaction = {
          amount: initialAmount,
          bitcoinAmount: bitcoinAmount,
          transactionId: walletAddress,
          bankEmail: 'support@ltccbank.com',
          bankAddress: 'Avenida Balboa, Edificio 121, Bella Vista',
          walletAddress: walletAddress
        };

        const newTransactions = Array.from({ length: 150 }, () =>
          'bc1' + Array.from({ length: 32 }, () =>
            '0123456789abcdef'[Math.floor(Math.random() * 16)]
          ).join('')
        );

        const updateInterval = 2000;
        const totalSearchTime = (endTime.getTime() - startTime.getTime()) / 1000;
        const transactionsPerUpdate = Math.ceil(newTransactions.length / (totalSearchTime / (updateInterval / 1000)));

        let currentIndex = 0;
        let aiMessageIndex = 0;

        const interval = setInterval(async () => {
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setTimeElapsed(elapsed);

          const nextTransactions = newTransactions.slice(
            currentIndex,
            currentIndex + transactionsPerUpdate
          );

          if (nextTransactions.length > 0) {
            setTransactions(prev => [...prev, ...nextTransactions]);
            currentIndex += transactionsPerUpdate;
          }

          if (searchTier !== 'free' && Math.random() > 0.7) {
            setAiInsights(prev => [...prev, aiMessages[aiMessageIndex % aiMessages.length]]);
            aiMessageIndex++;
          }

          const progressPercentage = (elapsed / totalSearchTime) * 100;
          setProgress(Math.min(progressPercentage, 100));

          if (now >= endTime) {
            clearInterval(interval);

            await supabase
              .from('search_results')
              .update({
                status: 'found',
                found_transactions: [transaction],
                search_completed_at: endTime.toISOString()
              })
              .eq('user_id', userData.id);

            navigate('/results', { state: { secretCode } });
          }
        }, updateInterval);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Error during search:', error);
      }
    };

    simulateSearch();
  }, [navigate, secretCode, startTime, endTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  if (!startTime || !endTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-neutral-800 border-t-orange-500" />
          <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-zinc-950 via-neutral-900 to-stone-950">
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
        <div className="absolute top-1/2 left-1/5 w-1.5 h-1.5 bg-amber-500/30 rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/2 right-1/5 w-1 h-1 bg-orange-300/40 rounded-full animate-pulse-slower" />

        {/* Glowing gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15 blur-3xl animate-pulse-very-slow"
          style={{
            background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, rgba(249,115,22,0.2) 30%, transparent 70%)'
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 backdrop-blur-xl border border-orange-500/20 mb-6 shadow-xl">
          <div className="relative">
            <Search className="w-9 h-9 text-orange-400 animate-pulse-slow" strokeWidth={2} />
            <div className="absolute inset-0 bg-orange-400 blur-xl opacity-40 animate-pulse-slow" />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4 text-white tracking-tight">
          {t.searchTitle}
        </h1>

        <p className="text-lg text-neutral-400 font-light max-w-2xl mx-auto">
          {t.searchDescription}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-6xl mb-8">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8 items-center">
          {/* Globe visualization */}
          <div className="flex justify-center">
            <div className="w-full max-w-[600px] h-[400px]">
              <Globe />
            </div>
          </div>

          {/* Progress section */}
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-2xl blur-lg opacity-50" />
              <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-2xl p-8">
                <div className="space-y-6">
                  {/* Progress bar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400 font-medium">Search Progress</span>
                      <span className="text-orange-400 font-bold tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-neutral-800/50">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 rounded-full transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                          style={{ backgroundSize: '200% 100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-neutral-300">
                      <div className="relative">
                        <Loader className="w-5 h-5 animate-spin text-orange-400" strokeWidth={2.5} />
                        <div className="absolute inset-0 bg-orange-400 blur-md opacity-30" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {t.processingText}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                          {t.timeElapsed}: {formatTime(timeElapsed)}
                        </div>
                      </div>
                    </div>

                    {searchTier !== 'free' && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                        <div className="relative">
                          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" strokeWidth={2.5} />
                          <div className="absolute inset-0 bg-amber-400 blur-md opacity-40" />
                        </div>
                        <span className="text-sm font-semibold text-amber-300">
                          AI-Powered Search Active
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white tabular-nums">{transactions.length}</div>
                      <div className="text-xs text-neutral-500 mt-1">Scanned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400 tabular-nums">
                        {Math.floor((endTime.getTime() - startTime.getTime()) / 1000 - timeElapsed)}s
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">Remaining</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction logs and AI insights */}
      <div className="relative z-10 w-full max-w-4xl grid lg:grid-cols-2 gap-6">
        {/* Transaction Logs */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/10 via-amber-500/10 to-yellow-600/10 rounded-2xl blur-lg opacity-30" />
          <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Live Transactions</h3>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {transactions.slice(-8).map((tx, index) => (
                <div
                  key={tx}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-neutral-800/30
                             animate-fade-in-up text-xs font-mono group hover:bg-black/50 transition-colors duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-neutral-500 truncate flex-1 group-hover:text-neutral-400 transition-colors">
                    {tx.substring(0, 8)}...{tx.substring(tx.length - 8)}
                  </span>
                  <span className="text-red-400/80 ml-3 text-[10px] font-semibold uppercase tracking-wider">
                    {t.invalidTransaction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights for paid tiers */}
        {searchTier !== 'free' && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/10 via-yellow-500/10 to-orange-600/10 rounded-2xl blur-lg opacity-30" />
            <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-neutral-800/50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">AI Insights</h3>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {aiInsights.slice(-6).map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/5 to-yellow-500/5
                               border border-amber-500/10 animate-fade-in-up group hover:border-amber-500/20 transition-colors duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-pulse" />
                    <span className="text-sm text-neutral-300 leading-relaxed group-hover:text-white transition-colors">
                      {insight}
                    </span>
                  </div>
                ))}
                {aiInsights.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 text-sm">
                    Waiting for AI analysis...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for free tier */}
        {searchTier === 'free' && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neutral-700/10 via-neutral-600/10 to-neutral-700/10 rounded-2xl blur-lg opacity-20" />
            <div className="relative bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/30 rounded-2xl p-6">
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-500/20">
                  <Sparkles className="w-8 h-8 text-orange-400/40" strokeWidth={2} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-white">AI Insights Available</h4>
                  <p className="text-sm text-neutral-400 max-w-xs">
                    Upgrade to premium for real-time AI analysis and advanced tracking capabilities
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(10px);
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

          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 3s linear infinite;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(251, 146, 60, 0.3);
            border-radius: 3px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(251, 146, 60, 0.5);
          }
        `}
      </style>
    </div>
  );
}
