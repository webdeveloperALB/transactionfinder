import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader, Bitcoin, Wallet, AlertCircle } from 'lucide-react';
import { nowpayments } from '../lib/nowpayments';
import { supabase } from '../lib/supabase';
import type { TransactionInfo } from '../types';

interface PaymentModalProps {
  amount: number;
  tier: string;
  secretCode: string;
  formData: TransactionInfo;
  onSuccess: () => void;
  onClose: () => void;
}

const SUPPORTED_CRYPTOCURRENCIES = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: Bitcoin },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: Wallet },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: Wallet },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: Wallet },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', icon: Wallet },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', icon: Wallet },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', icon: Wallet },
];

export function PaymentModal({ amount, tier, secretCode, formData, onSuccess, onClose }: PaymentModalProps) {
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(SUPPORTED_CRYPTOCURRENCIES[0]);
  const [showCryptoSelect, setShowCryptoSelect] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const initializePayment = async (crypto: typeof SUPPORTED_CRYPTOCURRENCIES[0]) => {
    setLoading(true);
    setError('');
    
    try {
      const payment = await nowpayments.createPayment(amount, tier, secretCode, crypto.id);
      setPaymentData(payment);
      setStatus('pending');
      setRetryCount(0);

      // Start polling for payment status
      const pollInterval = setInterval(async () => {
        try {
          const status = await nowpayments.getPaymentStatus(payment.payment_id);
          if (status.payment_status === 'finished' || status.payment_status === 'confirmed') {
            clearInterval(pollInterval);
            onSuccess();
            navigate('/results', { state: { secretCode } });
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 10000); // Poll every 10 seconds

    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setError(error.message || 'Failed to initialize payment. Please try again.');
      setShowCryptoSelect(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (paymentData?.pay_address) {
      navigator.clipboard.writeText(paymentData.pay_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCryptoSelect = async (crypto: typeof SUPPORTED_CRYPTOCURRENCIES[0]) => {
    setSelectedCrypto(crypto);
    setShowCryptoSelect(false);
    await initializePayment(crypto);
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await initializePayment(selectedCrypto);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#0f1729] rounded-2xl shadow-xl border border-white/5 p-6 max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Complete Payment
          </h2>
          <div className="text-2xl font-bold text-indigo-400">€{amount}</div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Payment Error</span>
              </div>
              <p>{error}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowCryptoSelect(true)}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
              >
                Choose Different Method
              </button>
            </div>
          </div>
        ) : showCryptoSelect ? (
          <div className="space-y-6">
            <p className="text-lg text-white/60">Select payment method:</p>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => {
                const Icon = crypto.icon;
                return (
                  <button
                    key={crypto.id}
                    onClick={() => handleCryptoSelect(crypto)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all
                      ${selectedCrypto.id === crypto.id
                        ? 'border-indigo-500/50 bg-indigo-500/5 text-white'
                        : 'border-white/5 hover:border-indigo-500/30 hover:bg-white/5 text-white/60 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{crypto.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-white/5 rounded-xl space-y-3 backdrop-blur-sm">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Plan</span>
                <span className="text-white/80">{tier} Tier</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Amount</span>
                <span className="text-white/80">{amount} EUR</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-white/5">
                <span className="text-white/60">Pay</span>
                <span className="text-white">{paymentData.pay_amount} {selectedCrypto.symbol}</span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCodeSVG
                  value={paymentData.pay_address}
                  size={180}
                  level="H"
                />
              </div>
              
              <div className="relative w-full">
                <input
                  type="text"
                  value={paymentData.pay_address}
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-white/80"
                />
                <button
                  onClick={handleCopyAddress}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-white/60">Send exactly {paymentData.pay_amount} {selectedCrypto.symbol}</p>
              <p className="text-white/40 text-sm">Payment will be confirmed automatically</p>
            </div>

            {status !== 'pending' && (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-indigo-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Payment {status}...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}