import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, User, Mail, Phone, MapPin, Flag, Copy, Check, Loader, ArrowLeft, FileText, AlertCircle, X } from 'lucide-react';
import type { PersonalInfo } from '../types';
import { generateSecretCode } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useI18n, translations } from '../lib/i18n';
import { secureStorage } from '../lib/storage';

const RESEND_COOLDOWN = 60;
const MAX_OTP_ATTEMPTS = 3;

export function PersonalInfoForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useI18n();
  const t = translations[language];
  const [formData, setFormData] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    nationality: '',
    identityDocument: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOTP] = useState('');
  const [otpError, setOTPError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [currentEmail, setCurrentEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [showIdWarning, setShowIdWarning] = useState(false);

  useEffect(() => {
    const code = location.state?.secretCode;
    if (code) {
      const checkTempCode = async () => {
        const { data, error } = await supabase
          .from('temp_codes')
          .select('*')
          .eq('code', code)
          .eq('used', false)
          .maybeSingle();

        if (error || !data) {
          navigate('/code-entry');
        }
      };

      checkTempCode();
    } else {
      navigate('/code-entry');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const Logo = () => (
    <svg
      className="w-16 h-16"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="url(#bgGradient)"/>
      <path
        d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z"
        fill="url(#shieldGradient)"
      />
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0a0a"/>
          <stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
      </defs>
    </svg>
  );

  const validateField = (name: string, value: string | File | null) => {
    switch (name) {
      case 'name':
        return !value ? 'Name is required' : '';
      case 'email':
        return !value ? 'Email is required' :
               !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string) ? 'Invalid email address' : '';
      case 'phone':
        return !value ? 'Phone number is required' : '';
      case 'address':
        return !value ? 'Address is required' : '';
      case 'nationality':
        return !value ? 'Nationality is required' : '';
      case 'identityDocument':
        return !value ? 'Identity document is required' : '';
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

  const handleFieldChange = (name: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (showValidation) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const sendOTP = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setShowOTPInput(true);
      setResendCooldown(RESEND_COOLDOWN);
      setError('');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setError(errorMessage);
      return false;
    }
  };

  const verifyOTP = async () => {
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      setOTPError('Maximum verification attempts reached. Please try again later.');
      return;
    }

    setIsVerifying(true);
    setOTPError('');

    try {
      const { data: otpData, error: otpError } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', formData.email)
        .eq('code', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpData) {
        setOtpAttempts(prev => prev + 1);
        throw new Error('Invalid or expired OTP');
      }

      await supabase
        .from('email_otps')
        .update({ verified: true })
        .eq('id', otpData.id);

      await createUser();
    } catch (error) {
      setOTPError(error instanceof Error ? error.message : 'Failed to verify OTP');
      setIsVerifying(false);
    }
  };

  const sendWelcomeEmail = async (email: string, name: string, code: string): Promise<void> => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email1`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, name, secretCode: code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send welcome email');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to send welcome email');
      }
    } catch (error) {
      console.error('Welcome email request failed:', error);
      throw error;
    }
  };

  const createUser = async () => {
    try {
      const { data: existingUsers } = await supabase
        .from('users')
        .select('secret_code')
        .eq('email', formData.email);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error(t.emailAlreadyRegistered);
      }

      const tempCode = location.state?.secretCode;
      if (!tempCode) {
        throw new Error('No temporary code found');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          nationality: formData.nationality,
          secret_code: tempCode
        })
        .select()
        .single();

      if (userError) {
        if (userError.code === '23505') {
          throw new Error(t.emailAlreadyRegistered);
        }
        throw userError;
      }

      await supabase
        .from('temp_codes')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('code', tempCode);

      const { error: searchError } = await supabase
        .from('search_results')
        .insert({
          user_id: userData.id,
          status: 'searching',
          found_transactions: []
        });

      if (searchError) throw searchError;

      await sendWelcomeEmail(formData.email, formData.name, tempCode);

      secureStorage.set({ secretCode: tempCode });

      navigate('/transaction-info', { state: { secretCode: tempCode } });
      setIsVerifying(false);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(error.message || t.networkError);
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.identityDocument) {
      setShowIdWarning(true);
      return;
    }

    setShowValidation(true);
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setCurrentEmail(formData.email);

    try {
      const success = await sendOTP();
      if (success) {
        setShowOTPInput(true);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(error.message || t.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    await sendOTP();
  };

  const handleBack = () => {
    setShowOTPInput(false);
    setOTP('');
    setOTPError('');
    setOtpAttempts(0);
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

      {/* ID Verification Warning Modal */}
      {showIdWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/30 via-red-500/30 to-red-600/30 rounded-2xl blur-lg" />
            <div className="relative bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md mx-4 border border-red-500/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">ID Verification Required</h3>
                  <p className="text-neutral-400 text-sm">
                    Please upload a valid identification document to proceed with the verification process. This is mandatory for security purposes.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowIdWarning(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-5xl font-bold mb-3 text-white tracking-tight">
            {showOTPInput ? t.verifyEmail : t.secureVerification}
          </h1>
          <p className="text-base text-neutral-400 font-light">
            {showOTPInput ? (
              <>
                {t.verifyEmailDesc} <span className="text-orange-400">{currentEmail}</span>
              </>
            ) : (
              t.provideDetails
            )}
          </p>
        </div>

        {/* Form card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/20 via-amber-500/20 to-yellow-600/20 rounded-2xl blur-lg opacity-30" />

          <div className="relative bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/50 rounded-2xl p-8 shadow-2xl">
            {showOTPInput ? (
              <div className="space-y-6">
                {otpError && (
                  <div className="flex items-start gap-3 text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-4 py-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{otpError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-300">
                    {t.enterVerificationCode}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full px-4 py-3.5 bg-black/40 border border-neutral-700/50 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 text-center text-2xl tracking-widest font-mono"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                  />
                  {otpAttempts > 0 && (
                    <p className="text-sm text-neutral-500">
                      {MAX_OTP_ATTEMPTS - otpAttempts} attempts remaining
                    </p>
                  )}
                </div>

                <button
                  onClick={verifyOTP}
                  disabled={isVerifying || otp.length !== 6 || otpAttempts >= MAX_OTP_ATTEMPTS}
                  className="relative w-full group overflow-hidden rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 transition-all duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                  <span className="relative flex items-center justify-center px-6 py-3.5 text-white font-semibold text-base">
                    {isVerifying ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      t.verifyCode
                    )}
                  </span>
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t.backToForm}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0}
                    className={`text-orange-400 hover:text-orange-300 transition-colors duration-200 ${
                      resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {resendCooldown > 0
                      ? `${t.resendCode} (${resendCooldown}s)`
                      : t.resendCode}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-3 text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-4 py-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={t.fullName}
                      required
                      className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                        showValidation && fieldErrors.name ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                      } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                    />
                    {showValidation && fieldErrors.name && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{fieldErrors.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="email"
                      placeholder={t.emailAddress}
                      required
                      className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                        showValidation && fieldErrors.email ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                      } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                    />
                    {showValidation && fieldErrors.email && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{fieldErrors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="tel"
                      placeholder={t.phoneNumber}
                      required
                      className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                        showValidation && fieldErrors.phone ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                      } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                    />
                    {showValidation && fieldErrors.phone && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{fieldErrors.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={t.currentAddress}
                      required
                      className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                        showValidation && fieldErrors.address ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                      } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                    />
                    {showValidation && fieldErrors.address && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{fieldErrors.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={t.nationality}
                      required
                      className={`w-full pl-11 pr-4 py-3.5 bg-black/40 border ${
                        showValidation && fieldErrors.nationality ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50'
                      } rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300`}
                      value={formData.nationality}
                      onChange={(e) => handleFieldChange('nationality', e.target.value)}
                    />
                    {showValidation && fieldErrors.nationality && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{fieldErrors.nationality}</span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      {t.identityVerification} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        required
                        onChange={(e) => handleFieldChange('identityDocument', e.target.files?.[0] || null)}
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center w-full p-4 border-2 border-dashed
                                 ${showValidation && fieldErrors.identityDocument ? 'border-red-500/50 bg-red-950/20' : 'border-neutral-700/50 bg-black/20'}
                                 rounded-lg cursor-pointer hover:border-orange-500/50
                                 transition-all duration-200 group`}
                      >
                        <div className="text-center">
                          <FileText className={`w-10 h-10 mx-auto mb-2 ${showValidation && fieldErrors.identityDocument ? 'text-red-400' : 'text-neutral-500'} group-hover:text-orange-400 transition-colors`} />
                          <span className={`text-sm font-medium ${showValidation && fieldErrors.identityDocument ? 'text-red-400' : 'text-neutral-400'} group-hover:text-white`}>
                            {formData.identityDocument ? formData.identityDocument.name : t.uploadIdDocument}
                          </span>
                          <p className={`text-xs ${showValidation && fieldErrors.identityDocument ? 'text-red-400/60' : 'text-neutral-500'} mt-1`}>
                            {showValidation && fieldErrors.identityDocument ? fieldErrors.identityDocument : t.idDocumentTypes}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <button
                    type="submit"
                    className="relative w-full group overflow-hidden rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 transition-all duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                    <span className="relative flex items-center justify-center px-6 py-3.5 text-white font-semibold text-base">
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        t.continue
                      )}
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
            )}
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
