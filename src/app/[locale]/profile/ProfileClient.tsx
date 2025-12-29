'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { updateProfile, type User } from '@/lib/auth/actions';
import {
  User as UserIcon,
  Mail,
  Globe,
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Loader2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const translations = {
  ar: {
    title: 'الملف الشخصي',
    personalInfo: 'المعلومات الشخصية',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم الحفظ',
    referralProgram: 'برنامج الإحالة',
    referralDescription: 'ادعُ أصدقاءك وعائلتك واحصل على مكافآت مميزة',
    yourReferralCode: 'رمز الإحالة الخاص بك',
    copyCode: 'نسخ الرمز',
    copied: 'تم النسخ!',
    shareVia: 'مشاركة عبر',
    whatsapp: 'واتساب',
    twitter: 'تويتر',
    shareEmail: 'البريد',
    referralStats: 'إحصائيات الإحالة',
    totalReferrals: 'إجمالي الإحالات',
    successfulReferrals: 'الإحالات الناجحة',
    rewardsEarned: 'المكافآت المكتسبة',
    referralMessage: 'انضم إلى شجرة - التطبيق العربي الأول لحفظ تاريخ عائلتك! استخدم رمز الإحالة الخاص بي:',
  },
  en: {
    title: 'Profile',
    personalInfo: 'Personal Information',
    name: 'Name',
    email: 'Email',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved',
    referralProgram: 'Referral Program',
    referralDescription: 'Invite friends and family to earn rewards',
    yourReferralCode: 'Your Referral Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    shareVia: 'Share via',
    whatsapp: 'WhatsApp',
    twitter: 'Twitter',
    shareEmail: 'Email',
    referralStats: 'Referral Stats',
    totalReferrals: 'Total Referrals',
    successfulReferrals: 'Successful Referrals',
    rewardsEarned: 'Rewards Earned',
    referralMessage: 'Join Shajara - the Arabic-first family tree app! Use my referral code:',
  },
};

interface ProfileClientProps {
  user: User;
  referralInfo: {
    code: string;
    referralCount: number;
    rewards: { type: string; count: number }[];
  } | null;
  locale: 'ar' | 'en';
}

export default function ProfileClient({ user, referralInfo, locale }: ProfileClientProps) {
  const router = useRouter();
  const t = translations[locale];

  const [name, setName] = React.useState(user.name);
  const [selectedLocale, setSelectedLocale] = React.useState(user.locale);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const referralCode = referralInfo?.code || 'SHAJARA';
  const referralLink = `https://shajara-64n.pages.dev/${locale}/register?ref=${referralCode}`;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ name, locale: selectedLocale });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      if (selectedLocale !== locale) {
        router.push(`/${selectedLocale}/profile`);
      }
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'email') => {
    const message = `${t.referralMessage} ${referralCode}\n\n${referralLink}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('Join Shajara')}&body=${encodeURIComponent(message)}`, '_blank');
        break;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        {t.title}
      </h1>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Personal Information */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-600" />
            {t.personalInfo}
          </h2>

          <div className="flex justify-center mb-6">
            <Avatar
              src={user.avatar_url}
              fallback={user.name}
              size="xl"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.name}
              </label>
              <div className="relative">
                <UserIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={user.email}
                  disabled
                  className="ps-10 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.language}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLocale('ar')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 transition-all',
                    selectedLocale === 'ar'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  {t.arabic}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLocale('en')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg border-2 transition-all',
                    selectedLocale === 'en'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  {t.english}
                </button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t.saving}
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4 me-2" />
                  {t.saved}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 me-2" />
                  {t.save}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            {t.referralProgram}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            {t.referralDescription}
          </p>

          {/* Referral Code */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t.yourReferralCode}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg px-4 py-3 font-mono text-xl font-bold text-emerald-600 tracking-wider text-center border border-emerald-200 dark:border-emerald-800">
                {referralCode}
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
            {isCopied && (
              <p className="text-emerald-600 text-sm mt-2 text-center">{t.copied}</p>
            )}
          </div>

          {/* Share Buttons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              {t.shareVia}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.whatsapp}</span>
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.twitter}</span>
              </button>

              <button
                onClick={() => handleShare('email')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/30 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-slate-500 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.shareEmail}</span>
              </button>
            </div>
          </div>

          {/* Referral Stats */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              {t.referralStats}
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {referralInfo?.referralCount || 0}
                </div>
                <div className="text-xs text-slate-500">{t.totalReferrals}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {referralInfo?.referralCount || 0}
                </div>
                <div className="text-xs text-slate-500">{t.successfulReferrals}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                <Award className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {referralInfo?.rewards.length || 0}
                </div>
                <div className="text-xs text-slate-500">{t.rewardsEarned}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
