'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TreeDeciduous, Users, Check, X, Clock, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { acceptInvitation, declineInvitation, type TreeInvitation } from '@/lib/db/invitation-actions';

interface InviteClientProps {
  invitation: TreeInvitation | null;
  code: string;
  locale: 'ar' | 'en';
  isLoggedIn: boolean;
  userEmail?: string;
}

const translations = {
  ar: {
    title: 'دعوة للانضمام',
    invitedBy: 'تمت دعوتك بواسطة',
    toJoin: 'للانضمام إلى شجرة',
    asRole: 'بصلاحية',
    guest: 'ضيف',
    member: 'عضو',
    manager: 'مدير',
    guestDesc: 'يمكنك رؤية الشجرة والبحث في الأعضاء',
    memberDesc: 'يمكنك إضافة وتعديل أفراد العائلة',
    managerDesc: 'صلاحيات كاملة بما في ذلك دعوة الآخرين',
    accept: 'قبول الدعوة',
    decline: 'رفض',
    accepting: 'جاري القبول...',
    loginRequired: 'يجب تسجيل الدخول أولاً',
    loginToAccept: 'سجل الدخول لقبول هذه الدعوة',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    notFound: 'الدعوة غير موجودة',
    notFoundDesc: 'هذا الرابط غير صالح أو تم استخدامه بالفعل',
    expired: 'انتهت صلاحية الدعوة',
    expiredDesc: 'اطلب من المرسل إرسال دعوة جديدة',
    alreadyUsed: 'تم استخدام الدعوة',
    alreadyUsedDesc: 'هذه الدعوة تم قبولها أو رفضها بالفعل',
    success: 'تم قبول الدعوة!',
    successDesc: 'أنت الآن عضو في هذه الشجرة',
    viewTree: 'عرض الشجرة',
    goHome: 'العودة للرئيسية',
    message: 'رسالة من المرسل',
  },
  en: {
    title: 'Invitation to Join',
    invitedBy: 'You have been invited by',
    toJoin: 'to join the family tree',
    asRole: 'with access level',
    guest: 'Guest',
    member: 'Member',
    manager: 'Manager',
    guestDesc: 'You can view the tree and search members',
    memberDesc: 'You can add and edit family members',
    managerDesc: 'Full access including inviting others',
    accept: 'Accept Invitation',
    decline: 'Decline',
    accepting: 'Accepting...',
    loginRequired: 'Login Required',
    loginToAccept: 'Sign in to accept this invitation',
    login: 'Sign In',
    register: 'Create Account',
    notFound: 'Invitation Not Found',
    notFoundDesc: 'This link is invalid or has already been used',
    expired: 'Invitation Expired',
    expiredDesc: 'Ask the sender to create a new invitation',
    alreadyUsed: 'Invitation Already Used',
    alreadyUsedDesc: 'This invitation has already been accepted or declined',
    success: 'Invitation Accepted!',
    successDesc: 'You are now a member of this family tree',
    viewTree: 'View Tree',
    goHome: 'Go Home',
    message: 'Message from sender',
  },
};

const roleDescriptions = {
  ar: {
    guest: 'يمكنك رؤية الشجرة والبحث في الأعضاء',
    member: 'يمكنك إضافة وتعديل أفراد العائلة',
    manager: 'صلاحيات كاملة بما في ذلك دعوة الآخرين',
  },
  en: {
    guest: 'You can view the tree and search members',
    member: 'You can add and edit family members',
    manager: 'Full access including inviting others',
  },
};

export function InviteClient({ invitation, code, locale, isLoggedIn, userEmail }: InviteClientProps) {
  const t = translations[locale];
  const router = useRouter();
  const [status, setStatus] = React.useState<'pending' | 'accepting' | 'accepted' | 'declined' | 'error'>('pending');
  const [error, setError] = React.useState('');

  // Check if invitation is valid
  const isExpired = invitation && invitation.expires_at * 1000 < Date.now();
  const isAlreadyUsed = invitation && invitation.status !== 'pending';

  const handleAccept = async () => {
    setStatus('accepting');
    const result = await acceptInvitation(code);

    if (result.success) {
      setStatus('accepted');
      setTimeout(() => {
        router.push(`/${locale}/tree/${result.treeId}`);
      }, 2000);
    } else {
      setStatus('error');
      setError(result.error || 'Failed to accept invitation');
    }
  };

  const handleDecline = async () => {
    const result = await declineInvitation(code);
    if (result.success) {
      setStatus('declined');
    }
  };

  // Not found
  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.notFound}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t.notFoundDesc}
          </p>
          <Link href={`/${locale}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {t.goHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Expired
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.expired}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t.expiredDesc}
          </p>
          <Link href={`/${locale}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {t.goHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Already used
  if (isAlreadyUsed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-slate-600 dark:text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.alreadyUsed}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t.alreadyUsedDesc}
          </p>
          <Link href={`/${locale}`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {t.goHome}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success
  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t.success}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t.successDesc}
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full">
          {/* Tree Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <TreeDeciduous className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {locale === 'ar' ? invitation.tree_name_ar : invitation.tree_name_en}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t.invitedBy} <span className="font-medium">{invitation.inviter_name}</span>
            </p>
          </div>

          {/* Login Required */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {t.loginRequired}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t.loginToAccept}
                </p>
              </div>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            <Link href={`/${locale}/login?redirect=/invite/${code}`} className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
                {t.login}
              </Button>
            </Link>
            <Link href={`/${locale}/register?redirect=/invite/${code}`} className="block">
              <Button variant="outline" className="w-full py-3">
                {t.register}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full">
        {/* Tree Info */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <TreeDeciduous className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {locale === 'ar' ? invitation.tree_name_ar : invitation.tree_name_en}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t.invitedBy} <span className="font-medium">{invitation.inviter_name}</span>
          </p>
        </div>

        {/* Role Info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t.asRole}</p>
          <p className="font-bold text-lg text-emerald-600">
            {t[invitation.role as keyof typeof t]}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {roleDescriptions[locale][invitation.role]}
          </p>
        </div>

        {/* Personal Message */}
        {invitation.message && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 mb-6">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{t.message}</p>
            <p className="text-slate-700 dark:text-slate-300 italic">"{invitation.message}"</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={status === 'accepting'}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
          >
            {status === 'accepting' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.accepting}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                {t.accept}
              </span>
            )}
          </Button>

          <Button
            onClick={handleDecline}
            variant="outline"
            className="w-full py-3 text-slate-600 dark:text-slate-400"
          >
            <X className="w-5 h-5 me-2" />
            {t.decline}
          </Button>
        </div>
      </div>
    </div>
  );
}
