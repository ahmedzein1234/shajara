'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/lib/auth/actions';
import { Mail, Lock, Eye, EyeOff, Loader2, TreeDeciduous, Check } from 'lucide-react';
import { useGuest } from '@/contexts/GuestContext';

const translations = {
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'مرحباً بعودتك إلى شجرة',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    password: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    login: 'تسجيل الدخول',
    loggingIn: 'جاري تسجيل الدخول...',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    register: 'إنشاء حساب جديد',
    errors: {
      email_exists: 'البريد الإلكتروني مسجل مسبقاً',
      invalid_credentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      login_failed: 'فشل تسجيل الدخول، يرجى المحاولة مرة أخرى',
      account_locked: 'تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول متعددة',
      claim_failed: 'فشل نقل الشجرة، لكن تم تسجيل دخولك بنجاح',
    },
    guestTreeNotice: 'لديك شجرة محفوظة! سيتم نقلها إلى حسابك.',
    claimingTree: 'جاري نقل الشجرة...',
    loginSuccess: 'تم تسجيل الدخول بنجاح!',
    treeTransferred: 'تم نقل شجرتك بنجاح!',
    orContinueWith: 'أو المتابعة عبر',
    google: 'Google',
    apple: 'Apple',
  },
  en: {
    title: 'Sign In',
    subtitle: 'Welcome back to Shajara',
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    login: 'Sign In',
    loggingIn: 'Signing in...',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    register: 'Create account',
    errors: {
      email_exists: 'Email already registered',
      invalid_credentials: 'Invalid email or password',
      login_failed: 'Login failed, please try again',
      account_locked: 'Account temporarily locked due to multiple login attempts',
      claim_failed: 'Failed to transfer tree, but you are now logged in',
    },
    guestTreeNotice: 'You have a saved tree! It will be transferred to your account.',
    claimingTree: 'Transferring tree...',
    loginSuccess: 'Login successful!',
    treeTransferred: 'Your tree was transferred successfully!',
    orContinueWith: 'Or continue with',
    google: 'Google',
    apple: 'Apple',
  },
};

export default function LoginPage() {
  const locale = useLocale() as 'ar' | 'en';
  const router = useRouter();
  const t = translations[locale];
  const { hasData, tree, exportForClaim, clearAll } = useGuest();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [claiming, setClaiming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Claim guest tree after login
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

    try {
      const result = await login({ email, password });

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
            // Tree claim failed but login succeeded - show both messages
            setSuccess(t.loginSuccess);
            setError(t.errors.claim_failed);
            setTimeout(() => {
              router.push(`/${locale}/tree`);
              router.refresh();
            }, 2500);
          }
        } else {
          // No guest tree - just show success and redirect
          setSuccess(t.loginSuccess);
          setTimeout(() => {
            router.push(`/${locale}/tree`);
            router.refresh();
          }, 1500);
        }
      } else {
        setError(t.errors[result.error as keyof typeof t.errors] || t.errors.login_failed);
      }
    } catch {
      setError(t.errors.login_failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 px-4">
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
          <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.password} <span className="text-red-500">*</span>
                </label>
                <a
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  {t.forgotPassword}
                </a>
              </div>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
                  {t.loggingIn}
                </>
              ) : (
                t.login
              )}
            </Button>
          </form>

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

          {/* Register link */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
            {t.noAccount}{' '}
            <a
              href={`/${locale}/register`}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
            >
              {t.register}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
