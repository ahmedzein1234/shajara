'use client';

/**
 * Try Shajara - Zero Friction Start
 *
 * Allows users to create a family tree without registration.
 * Data is stored locally and can be claimed by registering later.
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  TreeDeciduous,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { useGuest } from '@/contexts/GuestContext';

export default function TryPage() {
  const { locale } = useParams();
  const router = useRouter();
  const { tree, hasData, startGuestTree, isLoading } = useGuest();

  const [treeName, setTreeName] = useState('');
  const [step, setStep] = useState<'welcome' | 'name' | 'redirect'>('welcome');
  const isRTL = locale === 'ar';

  const t = {
    ar: {
      title: 'جرّب شجرة مجاناً',
      subtitle: 'أنشئ شجرة عائلتك الآن بدون تسجيل',
      welcomeTitle: 'مرحباً بك في شجرة',
      welcomeDesc: 'ابدأ ببناء شجرة عائلتك الآن. يمكنك الحفظ والتسجيل لاحقاً.',
      features: [
        'أضف أفراد العائلة وعلاقاتهم',
        'شاهد الشجرة بشكل تفاعلي',
        'احفظ تقدمك محلياً',
        'سجّل لحفظ دائم ومشاركة',
      ],
      startBtn: 'ابدأ الآن',
      continueBtn: 'أكمل شجرتك',
      existingTree: 'لديك شجرة محفوظة',
      nameTitle: 'سمّ شجرتك',
      nameLabel: 'اسم العائلة أو الشجرة',
      namePlaceholder: 'مثال: عائلة الأحمد',
      createBtn: 'أنشئ الشجرة',
      back: 'رجوع',
      or: 'أو',
      loginToSave: 'سجّل دخولك للحفظ الدائم',
      dataWarning: 'البيانات محفوظة على جهازك فقط. سجّل للحفظ الدائم.',
    },
    en: {
      title: 'Try Shajara Free',
      subtitle: 'Create your family tree now without registration',
      welcomeTitle: 'Welcome to Shajara',
      welcomeDesc: 'Start building your family tree now. You can save and register later.',
      features: [
        'Add family members and relationships',
        'View interactive tree visualization',
        'Save your progress locally',
        'Register for permanent storage & sharing',
      ],
      startBtn: 'Start Now',
      continueBtn: 'Continue Your Tree',
      existingTree: 'You have a saved tree',
      nameTitle: 'Name Your Tree',
      nameLabel: 'Family or tree name',
      namePlaceholder: 'e.g., The Smith Family',
      createBtn: 'Create Tree',
      back: 'Back',
      or: 'or',
      loginToSave: 'Log in for permanent storage',
      dataWarning: 'Data is stored on your device only. Register for permanent storage.',
    },
  };

  const text = t[locale as 'ar' | 'en'] || t.en;

  // Redirect if already has a guest tree
  useEffect(() => {
    if (!isLoading && tree && step === 'welcome') {
      // Show option to continue
    }
  }, [isLoading, tree, step]);

  const handleStart = () => {
    if (hasData && tree) {
      // Continue with existing tree
      router.push(`/${locale}/try/tree`);
    } else {
      setStep('name');
    }
  };

  const handleCreate = () => {
    if (!treeName.trim()) return;

    startGuestTree(treeName.trim());
    router.push(`/${locale}/try/tree`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heritage-turquoise"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Hero Section */}
      <div className="bg-gradient-heritage text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 rounded-full">
              <TreeDeciduous className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">
            {text.title}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            {text.subtitle}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {step === 'welcome' && (
          <div className="max-w-2xl mx-auto">
            {/* Welcome Card */}
            <div className="bg-white rounded-2xl shadow-card-warm p-8 mb-8">
              <h2 className="text-2xl font-bold text-heritage-navy mb-4">
                {text.welcomeTitle}
              </h2>
              <p className="text-warm-600 mb-6">
                {text.welcomeDesc}
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {text.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-heritage-turquoise/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-heritage-turquoise" />
                    </div>
                    <span className="text-warm-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Existing Tree Notice */}
              {hasData && tree && (
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <TreeDeciduous className="w-5 h-5 text-gold-600" />
                    <div>
                      <p className="font-medium text-gold-800">
                        {text.existingTree}
                      </p>
                      <p className="text-sm text-gold-600">
                        {tree.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleStart}
                className="w-full bg-heritage-turquoise text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-heritage-turquoise/90 transition-all flex items-center justify-center gap-2"
              >
                {hasData ? text.continueBtn : text.startBtn}
                {isRTL ? (
                  <ArrowLeft className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>

              {/* Data Warning */}
              <div className="mt-6 flex items-start gap-2 text-sm text-warm-500">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{text.dataWarning}</p>
              </div>
            </div>

            {/* Login Prompt */}
            <div className="text-center">
              <p className="text-warm-500 mb-3">{text.or}</p>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 text-heritage-turquoise hover:underline font-medium"
              >
                <LogIn className="w-4 h-4" />
                {text.loginToSave}
              </Link>
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-card-warm p-8">
              <button
                onClick={() => setStep('welcome')}
                className="flex items-center gap-2 text-warm-500 hover:text-warm-700 mb-6"
              >
                {isRTL ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                {text.back}
              </button>

              <h2 className="text-2xl font-bold text-heritage-navy mb-6">
                {text.nameTitle}
              </h2>

              <div className="mb-6">
                <label className="block text-warm-700 font-medium mb-2">
                  {text.nameLabel}
                </label>
                <input
                  type="text"
                  value={treeName}
                  onChange={(e) => setTreeName(e.target.value)}
                  placeholder={text.namePlaceholder}
                  className="w-full px-4 py-3 border border-warm-300 rounded-xl focus:ring-2 focus:ring-heritage-turquoise focus:border-heritage-turquoise outline-none transition-all"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!treeName.trim()}
                className="w-full bg-heritage-turquoise text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-heritage-turquoise/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                {text.createBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
