import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, DollarSign, User, Building2, MessageSquare, Wallet, FileText, AlertCircle } from 'lucide-react';
import type { TransactionInfo } from '../types';
import { supabase } from '../lib/supabase';
import { useI18n, translations } from '../lib/i18n';

export function TransactionInfoForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const secretCode = location.state?.secretCode;
  const [error, setError] = useState('');
  const { language } = useI18n();
  const t = translations[language];
  const [userId, setUserId] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<TransactionInfo>({
    date: '',
    amount: 0,
    recipientName: '',
    companyName: '',
    reason: '',
    paymentMethod: 'Crypto',
    walletAddress: '',
    transactionProof: null,
  });

  useEffect(() => {
    const initializeForm = async () => {
      if (!secretCode) return;

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('secret_code', secretCode)
          .maybeSingle();

        if (userError) throw userError;
        if (!userData) throw new Error('User not found');

        setUserId(userData.id);
      } catch (error) {
        console.error('Error initializing form:', error);
        setError(t.errorOccurred);
      }
    };

    initializeForm();
  }, [secretCode, t.errorOccurred]);

  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'date':
        return !value ? 'Date is required' : '';
      case 'amount':
        return !value || value <= 0 ? 'Amount must be greater than 0' : '';
      case 'recipientName':
        return !value ? 'Recipient name is required' : '';
      case 'companyName':
        return !value ? 'Company name is required' : '';
      case 'reason':
        return !value ? 'Reason is required' : '';
      case 'walletAddress':
        return formData.paymentMethod === 'Crypto' && !value ? 'Wallet address is required' : '';
      case 'transactionProof':
        return !value ? 'Transaction proof is required' : '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (showValidation) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setShowValidation(true);
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (!userId) {
        setError('Invalid secret code');
        return;
      }

      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: formData.amount,
          date: formData.date,
          recipient_name: formData.recipientName,
          company_name: formData.companyName,
          reason: formData.reason,
          payment_method: formData.paymentMethod,
          wallet_address: formData.walletAddress,
          proof_url: 'https://example.com/proof.pdf'
        })
        .select()
        .maybeSingle();

      if (transactionError) throw transactionError;

      const searchStartTime = new Date();
      const searchEndTime = new Date(searchStartTime.getTime() + (12 * 60 * 60 * 1000));

      const { error: searchError } = await supabase
        .from('search_results')
        .insert({
          user_id: userId,
          status: 'searching',
          search_started_at: searchStartTime.toISOString(),
          search_completed_at: searchEndTime.toISOString(),
          tier: 'free',
          ai_assistance: false,
          found_transactions: []
        });

      if (searchError) throw searchError;

      navigate('/searching', { state: { secretCode } });
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(error.message || t.errorOccurred);
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

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 backdrop-blur-xl border border-orange-500/20 mb-6 shadow-xl">
            <div className="relative">
              <Wallet className="w-9 h-9 text-orange-400" strokeWidth={2} />
              <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30 animate-pulse-slow" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-3 text-white tracking-tight">
            {t.transactionDetails}
          </h1>
          <p className="text-base text-neutral-400 font-light">
            {t.helpLocate}
          </p>
        </div>

        {/* Form card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-2xl blur-lg opacity-30" />

          <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-4 py-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="date"
                    required
                    className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                      showValidation && fieldErrors.date ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                    } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                    value={formData.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                  />
                  {showValidation && fieldErrors.date && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{fieldErrors.date}</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="number"
                    placeholder={t.amount}
                    required
                    min="0"
                    step="0.01"
                    className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                      showValidation && fieldErrors.amount ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                    } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                    value={formData.amount}
                    onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value))}
                  />
                  {showValidation && fieldErrors.amount && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{fieldErrors.amount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder={t.recipientName}
                  required
                  className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                    showValidation && fieldErrors.recipientName ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                  } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                  value={formData.recipientName}
                  onChange={(e) => handleFieldChange('recipientName', e.target.value)}
                />
                {showValidation && fieldErrors.recipientName && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fieldErrors.recipientName}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder={t.companyName}
                  required
                  className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                    showValidation && fieldErrors.companyName ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                  } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                  value={formData.companyName}
                  onChange={(e) => handleFieldChange('companyName', e.target.value)}
                />
                {showValidation && fieldErrors.companyName && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fieldErrors.companyName}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <MessageSquare className="absolute left-3 top-3.5 w-5 h-5 text-neutral-500" />
                <textarea
                  placeholder={t.transactionReason}
                  required
                  className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                    showValidation && fieldErrors.reason ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                  } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 min-h-[100px] resize-none`}
                  value={formData.reason}
                  onChange={(e) => handleFieldChange('reason', e.target.value)}
                />
                {showValidation && fieldErrors.reason && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fieldErrors.reason}</span>
                  </div>
                )}
              </div>

              <div className="relative">
                <select
                  required
                  className={`w-full px-4 py-3.5 bg-black/40 border ${
                    showValidation && fieldErrors.paymentMethod ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                  } rounded-lg text-white focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 appearance-none cursor-pointer`}
                  value={formData.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                >
                  <option value="Crypto">{t.cryptocurrency}</option>
                  <option value="Bank Transfer">{t.bankTransfer}</option>
                  <option value="Wire Transfer">{t.wireTransfer}</option>
                </select>
              </div>

              {formData.paymentMethod === 'Crypto' && (
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder={t.walletAddress}
                    required
                    className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                      showValidation && fieldErrors.walletAddress ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                    } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 font-mono text-sm`}
                    value={formData.walletAddress}
                    onChange={(e) => handleFieldChange('walletAddress', e.target.value)}
                  />
                  {showValidation && fieldErrors.walletAddress && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{fieldErrors.walletAddress}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {t.transactionProof} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    required
                    onChange={(e) => handleFieldChange('transactionProof', e.target.files?.[0] || null)}
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className={`flex items-center justify-center w-full p-4 border-2 border-dashed
                             ${showValidation && fieldErrors.transactionProof ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50 bg-black/20'}
                             rounded-lg cursor-pointer hover:border-orange-500/50
                             transition-all duration-200 group`}
                  >
                    <div className="text-center">
                      <FileText className={`w-10 h-10 mx-auto mb-2 ${showValidation && fieldErrors.transactionProof ? 'text-red-400' : 'text-neutral-500'} group-hover:text-orange-400 transition-colors`} />
                      <span className={`text-sm font-medium ${showValidation && fieldErrors.transactionProof ? 'text-red-400' : 'text-neutral-400'} group-hover:text-white`}>
                        {formData.transactionProof ? formData.transactionProof.name : t.uploadTransactionProof}
                      </span>
                      <p className={`text-xs ${showValidation && fieldErrors.transactionProof ? 'text-red-400/60' : 'text-neutral-500'} mt-1`}>
                        {showValidation && fieldErrors.transactionProof ? fieldErrors.transactionProof : t.fileUploadTypes}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  className="relative w-full group overflow-hidden rounded-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 transition-all duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                  <span className="relative block px-6 py-3.5 text-white font-semibold text-base">
                    {t.startSearch}
                  </span>
                </button>

                <div className="text-center">
                  <p className="text-sm text-neutral-500">
                    {t.byContinuing}{' '}
                    <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors duration-200 underline decoration-orange-400/30 hover:decoration-orange-300/50 underline-offset-2">
                      {t.termsAndConditions}
                    </a>
                  </p>
                </div>
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
