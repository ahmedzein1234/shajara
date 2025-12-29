'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, MessageSquare, TreeDeciduous, Users } from 'lucide-react';
import { ChatRoom } from '@/components/chat';

interface ChatClientProps {
  tree: {
    id: string;
    name_ar: string;
    name_en: string;
  };
  roomId: string;
  currentUserId: string;
  locale: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'محادثة العائلة',
    subtitle: 'تواصل مع أفراد العائلة',
    back: 'العودة للشجرة',
    members: 'الأعضاء',
  },
  en: {
    title: 'Family Chat',
    subtitle: 'Connect with family members',
    back: 'Back to Tree',
    members: 'Members',
  },
};

export function ChatClient({ tree, roomId, currentUserId, locale }: ChatClientProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const treeName = locale === 'ar' ? tree.name_ar : tree.name_en;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}/tree/${tree.id}`}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <BackArrow className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-islamic-primary" />
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h1>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <TreeDeciduous className="w-4 h-4" />
                  {treeName}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/tree/${tree.id}/manage`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Users className="w-4 h-4" />
              {t.members}
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Room */}
      <div className="flex-1 min-h-0">
        <ChatRoom
          roomId={roomId}
          treeId={tree.id}
          currentUserId={currentUserId}
          locale={locale}
        />
      </div>
    </div>
  );
}
