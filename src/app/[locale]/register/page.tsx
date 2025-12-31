'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { register } from '@/lib/auth/actions';
import { Mail, Lock, Eye, EyeOff, User, Loader2, Gift, TreeDeciduous, Check, X } from 'lucide-react';
import { useGuest } from '@/contexts/GuestContext';

const translations = {
  ar: {
    title: 'إنشاء حساب',
    subtitle: 'انضم إلى شجرة وابدأ بتوثيق تاريخ عائلتك',
    name: 'الاسم الكامل',
    namePlaceholder: 'أدخل اسمك الكامل',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    passwordRequirement: '12 حرفًا على الأقل',
    passwordMatch: 'كلمات المرور متطابقة',
    passwordNoMatch: 'كلمات المرور غير متطابقة',
    emailValid: 'بريد إلكتروني صالح',
    emailInvalid: 'يرجى إدخال بريد إلكتروني صالح',
    nameValid: 'اسم صالح',
    nameInvalid: 'حرفان على الأقل',
    confirmPassword: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
    accountCreated: 'تم إنشاء حسابك بنجاح!',
    treeTransferred: 'تم نقل شجرتك بنجاح!',
    referralCode: 'رمز الإحالة (اختياري)',
    referralCodePlaceholder: 'أدخل رمز الإحالة إن وجد',
    register: 'إنشاء الحساب',
    registering: 'جاري إنشاء الحساب...',
    hasAccount: 'لديك حساب بالفعل؟',
    login: 'تسجيل الدخول',
    errors: {
      email_exists: 'البريد الإلكتروني مسجل مسبقاً',
      registration_failed: 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى',
      passwords_mismatch: 'كلمات المرور غير متطابقة',
      password_short: 'كلمة المرور يجب أن تكون 12 حرفًا على الأقل',
      claim_failed: 'فشل نقل الشجرة، لكن تم إنشاء حسابك بنجاح',
    },
    guestTreeNotice: 'لديك شجرة محفوظة! سيتم نقلها إلى حسابك الجديد.',
    claimingTree: 'جاري نقل الشجرة...',
    orContinueWith: 'أو المتابعة عبر',
    google: 'Google',
    apple: 'Apple',
    terms: 'بإنشائك حساباً، فإنك توافق على',
    termsLink: 'شروط الخدمة',
    and: 'و',
    privacyLink: 'سياسة الخصوصية',
  },
  en: {
    title: 'Create Account',
    subtitle: 'Join Shajara and start documenting your family history',
    name: 'Full Name',
    namePlaceholder: 'Enter your full name',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    passwordRequirement: 'At least 12 characters',
    passwordMatch: 'Passwords match',
    passwordNoMatch: 'Passwords do not match',
    emailValid: 'Valid email',
    emailInvalid: 'Please enter a valid email',
    nameValid: 'Valid name',
    nameInvalid: 'At least 2 characters',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    accountCreated: 'Account created successfully!',
    treeTransferred: 'Your tree was transferred successfully!',
    referralCode: 'Referral Code (optional)',
    referralCodePlaceholder: 'Enter referral code if you have one',
    register: 'Create Account',
    registering: 'Creating account...',
    hasAccount: 'Already have an account?',
    login: 'Sign in',
    errors: {
      email_exists: 'Email already registered',
      registration_failed: 'Registration failed, please try again',
      passwords_mismatch: 'Passwords do not match',
      password_short: 'Password must be at least 12 characters',
      claim_failed: 'Failed to transfer tree, but your account was created successfully',
    },
    guestTreeNotice: 'You have a saved tree! It will be transferred to your new account.',
    claimingTree: 'Transferring tree...',
    orContinueWith: 'Or continue with',
    google: 'Google',
    apple: 'Apple',
    terms: 'By creating an account, you agree to our',
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
  },
};

export default function RegisterPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = translations[locale];
  const { hasData, tree, exportForClaim, clearAll } = useGuest();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [referralCode, setReferralCode] = React.useState(searchParams.get('ref') || '');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [claiming, setClaiming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Real-time validation states
  const emailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = name.trim().length >= 2;
  const passwordLengthValid = password.length >= 12;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  // Claim guest tree after registration
  const claimGuestTree = async (): Promise<string | null> => {
    if (!hasData) return null;

    try {
      setClaiming(true);
      const guestData = exportForClaim();

      const response = await fetch('/api/trees/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestData),
      });

      if (response.ok) {
        const result = await response.json();
        clearAll(); // Clear localStorage after successful claim
        return result.tree.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to claim guest tree:', error);
      return null;
    } finally {
      setClaiming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password
    if (password.length < 12) {
      setError(t.errors.password_short);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.errors.passwords_mismatch);
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        email,
        password,
        name,
        locale,
        referralCode: referralCode || undefined,
      });

      if (result.success) {
        // Try to claim guest tree if exists
        if (hasData) {
          const claimedTreeId = await claimGuestTree();
          if (claimedTreeId) {
            // Success - show message and redirect
            setSuccess(t.treeTransferred);
            setTimeout(() => {
              router.push(`/${locale}/tree/${claimedTreeId}`);
              router.refresh();
            }, 1500);
          } else {
            // Tree claim failed but account created - show warning and redirect
            setSuccess(t.accountCreated);
            setError(t.errors.claim_failed);
            setTimeout(() => {
              router.push(`/${locale}/tree`);
              router.refresh();
            }, 2500);
          }
        } else {
          // No guest tree - just show success and redirect
          setSuccess(t.accountCreated);
          setTimeout(() => {
            router.push(`/${locale}/tree`);
            router.refresh();
          }, 1500);
        }
      } else {
        setError(t.errors[result.error as keyof typeof t.errors] || t.errors.registration_failed);
      }
    } catch {
      setError(t.errors.registration_failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t.subtitle}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Guest tree notice */}
            {hasData && tree && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <TreeDeciduous className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {t.guestTreeNotice}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      {tree.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.name} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="ps-10"
                  required
                />
              </div>
              {/* Name validation indicator */}
              {name.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${nameValid ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {nameValid ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>{nameValid ? t.nameValid : t.nameInvalid}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.email} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="ps-10"
                  required
                  dir="ltr"
                />
              </div>
              {/* Email validation indicator */}
              {email.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${emailValid ? 'text-emerald-600' : 'text-red-500'}`}>
                  {emailValid ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>{emailValid ? t.emailValid : t.emailInvalid}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.password} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="ps-10 pe-10"
                  required
                  dir="ltr"
                  minLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Password requirements indicator */}
              {password.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${passwordLengthValid ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {passwordLengthValid ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">
                      {password.length}
                    </span>
                  )}
                  <span>{t.passwordRequirement}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.confirmPassword} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="ps-10"
                  required
                  dir="ltr"
                />
              </div>
              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                  {passwordsMatch ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>{passwordsMatch ? t.passwordMatch : t.passwordNoMatch}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.referralCode}
              </label>
              <div className="relative">
                <Gift className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder={t.referralCodePlaceholder}
                  className="ps-10"
                  dir="ltr"
                  maxLength={8}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading || claiming}
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t.claimingTree}
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t.registering}
                </>
              ) : (
                t.register
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
            {t.terms}{' '}
            <a href={`/${locale}/terms`} className="text-emerald-600 hover:underline">
              {t.termsLink}
            </a>{' '}
            {t.and}{' '}
            <a href={`/${locale}/privacy`} className="text-emerald-600 hover:underline">
              {t.privacyLink}
            </a>
          </p>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-800 text-slate-500">
                {t.orContinueWith}
              </span>
            </div>
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t.google}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <svg className="w-5 h-5 me-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {t.apple}
            </Button>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
            {t.hasAccount}{' '}
            <a
              href={`/${locale}/login`}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
            >
              {t.login}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
