'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff, AtSign, User } from 'lucide-react';
import { useCreateStaffUser } from '@/hooks/useStaffData';
import { validateUsername, sanitizeUsername } from '@/lib/shiftCalculations';

interface CreateCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCashierModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCashierModalProps) {
  const createStaffMutation = useCreateStaffUser();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailCustomized, setIsEmailCustomized] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cashier' | 'owner'>('cashier');
  const [showPassword, setShowPassword] = useState(false);

  // Field validation errors
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle username typing with strict validation & auto email suggestion
  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setErrorMsg(null);

    // Validate username in real-time
    const check = validateUsername(val);
    if (!check.isValid && val.trim() !== '') {
      setUsernameError(check.error || 'Invalid username');
    } else {
      setUsernameError(null);
    }

    // Auto-update email suggestion if user hasn't explicitly customized email
    if (!isEmailCustomized) {
      const cleanUser = sanitizeUsername(val);
      setEmail(cleanUser ? `${cleanUser}@hasan.com` : '');
    }
  };

  const handleEmailChange = (val: string) => {
    setIsEmailCustomized(true);
    setEmail(val);
    setErrorMsg(null);

    const trimmed = val.trim();
    if (trimmed.includes(' ')) {
      setEmailError('Email cannot contain spaces.');
    } else if (trimmed && !trimmed.includes('@')) {
      setEmailError('Please include an "@" in the email address.');
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Full name check
    if (!fullName.trim()) {
      setErrorMsg('Please enter a full name.');
      return;
    }

    // 2. Strict Username validation
    const userCheck = validateUsername(username);
    if (!userCheck.isValid) {
      setUsernameError(userCheck.error || 'Invalid username');
      setErrorMsg(userCheck.error || 'Please correct the username.');
      return;
    }

    // 3. Email validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || cleanEmail.includes(' ') || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid email address without spaces (e.g. name@hasan.com).');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // 4. Password validation
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      const cleanUser = sanitizeUsername(username);
      const res = await createStaffMutation.mutateAsync({
        fullName: fullName.trim(),
        username: cleanUser,
        email: cleanEmail,
        phone: phone.trim() || undefined,
        role,
        password,
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1400);
      } else {
        setErrorMsg(res.message || 'Failed to create staff account.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error creating staff account.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Create Staff Account
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Configured with distinct username and auto-confirmed access
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">
                Staff Account Created
              </h4>
              <p className="text-xs text-neutral-500">
                {fullName} is now registered and auto-confirmed in Supabase. They can sign in using their username ({sanitizeUsername(username)}) or email ({email}) immediately!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-800">
                  Full Name / Display Title
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rashed Khan / Person - 1"
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              {/* Username (STRICT: NO spaces, NO symbols) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Username</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    Letters, numbers, underscores only
                  </span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. rashed or person_1"
                  required
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono ${
                    usernameError
                      ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:border-neutral-900'
                  } focus:outline-none`}
                />
                {usernameError ? (
                  <span className="text-[11px] text-rose-600 font-medium block">
                    {usernameError}
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 block">
                    Staff can use this username to sign in directly without typing the full email.
                  </span>
                )}
              </div>

              {/* Distinct Email Address */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Authorized Email Address</span>
                  </label>
                  {isEmailCustomized && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEmailCustomized(false);
                        const cleanUser = sanitizeUsername(username);
                        setEmail(cleanUser ? `${cleanUser}@hasan.com` : '');
                      }}
                      className="text-[10px] text-neutral-500 hover:text-neutral-900 underline"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. rashed@hasan.com"
                  required
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border font-mono ${
                    emailError
                      ? 'border-rose-300 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:border-neutral-900'
                  } focus:outline-none`}
                />
                {emailError && (
                  <span className="text-[11px] text-rose-600 font-medium block">
                    {emailError}
                  </span>
                )}
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-800">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 917 123 4567"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-800">
                  Portal Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('cashier')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      role === 'cashier'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="block font-black">Cashier</span>
                    <span className={`text-[10px] block ${role === 'cashier' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      POS, KDS, &amp; Orders
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      role === 'owner'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="block font-black">Owner / Manager</span>
                    <span className={`text-[10px] block ${role === 'owner' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      Full analytics &amp; staff
                    </span>
                  </button>
                </div>
              </div>

              {/* Initial Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-800">
                  Initial Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min. 6 chars)"
                    required
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Auto-confirmed in Supabase. No confirmation email needed.</span>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaffMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createStaffMutation.isPending ? 'Creating Account...' : 'Create Account Now'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
