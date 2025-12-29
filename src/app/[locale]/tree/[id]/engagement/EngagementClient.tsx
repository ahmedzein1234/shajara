'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Activity, MessageSquare, Bell, Plus,
  TreeDeciduous, Users, Gift, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '@/components/engagement/ActivityFeed';
import { ContributionRequestCard } from '@/components/engagement/ContributionRequestCard';
import { CreateContributionModal } from '@/components/engagement/CreateContributionModal';
import { MemorialReminders } from '@/components/engagement/MemorialReminders';
import { type ContributionRequest, getTreeContributionRequests } from '@/lib/db/contribution-actions';

interface EngagementClientProps {
  tree: {
    id: string;
    name_ar: string;
    name_en: string;
    owner_id: string;
    owner_name: string;
    isOwner: boolean;
    userRole: string;
  };
  locale: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'تفاعل العائلة',
    subtitle: 'النشاطات والمساهمات والتذكيرات',
    back: 'العودة للشجرة',
    tabs: {
      activity: 'النشاط',
      contributions: 'المساهمات',
      memorials: 'التذكيرات',
    },
    newRequest: 'طلب جديد',
    openRequests: 'الطلبات المفتوحة',
    noRequests: 'لا توجد طلبات مساهمة حالياً',
    createFirst: 'أنشئ طلب مساهمة لجمع معلومات من العائلة',
  },
  en: {
    title: 'Family Engagement',
    subtitle: 'Activities, contributions, and reminders',
    back: 'Back to Tree',
    tabs: {
      activity: 'Activity',
      contributions: 'Contributions',
      memorials: 'Memorials',
    },
    newRequest: 'New Request',
    openRequests: 'Open Requests',
    noRequests: 'No contribution requests yet',
    createFirst: 'Create a contribution request to gather info from family',
  },
};

export function EngagementClient({ tree, locale }: EngagementClientProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [activeTab, setActiveTab] = React.useState<'activity' | 'contributions' | 'memorials'>('activity');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [requests, setRequests] = React.useState<ContributionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(false);

  const treeName = locale === 'ar' ? tree.name_ar : tree.name_en;
  const canManage = tree.isOwner || tree.userRole === 'admin' || tree.userRole === 'editor';

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await getTreeContributionRequests(tree.id, { status: 'open' });
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'contributions') {
      loadRequests();
    }
  }, [activeTab, tree.id]);

  const tabIcons = {
    activity: Activity,
    contributions: Gift,
    memorials: Bell,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
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
                  <Users className="w-5 h-5 text-islamic-primary" />
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h1>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <TreeDeciduous className="w-4 h-4" />
                  {treeName}
                </p>
              </div>
            </div>

            {canManage && activeTab === 'contributions' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-islamic-primary hover:bg-islamic-dark text-white"
              >
                <Plus className="w-4 h-4 me-2" />
                {t.newRequest}
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 -mb-px">
            {(Object.keys(t.tabs) as Array<keyof typeof t.tabs>).map(tab => {
              const Icon = tabIcons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-islamic-primary text-islamic-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.tabs[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'activity' && (
            <ActivityFeed
              treeId={tree.id}
              locale={locale}
              showHeader={false}
            />
          )}

          {activeTab === 'contributions' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-islamic-primary" />
                  {t.openRequests}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRequests}
                  disabled={loadingRequests}
                >
                  <RefreshCw className={`w-4 h-4 me-1 ${loadingRequests ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Requests List */}
              {requests.length === 0 && !loadingRequests ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-600 dark:text-slate-400">{t.noRequests}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t.createFirst}</p>
                  {canManage && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 bg-islamic-primary hover:bg-islamic-dark text-white"
                    >
                      <Plus className="w-4 h-4 me-2" />
                      {t.newRequest}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(request => (
                    <ContributionRequestCard
                      key={request.id}
                      request={request}
                      locale={locale}
                      onUpdate={loadRequests}
                      showActions={canManage}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'memorials' && (
            <MemorialReminders treeId={tree.id} locale={locale} />
          )}
        </div>
      </div>

      {/* Create Contribution Modal */}
      <CreateContributionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        treeId={tree.id}
        locale={locale}
        onSuccess={loadRequests}
      />
    </div>
  );
}
