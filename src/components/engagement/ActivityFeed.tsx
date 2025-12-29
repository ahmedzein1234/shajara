'use client';

import * as React from 'react';
import {
  Activity, UserPlus, Edit, Trash2, Image, Link2, Users,
  Share2, Gift, Bell, CheckCircle, FileText, MessageSquare,
  Clock, ChevronDown, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ActivityFeedItem, type ActivityType, getActivityFeed } from '@/lib/db/activity-actions';

interface ActivityFeedProps {
  treeId: string;
  locale?: 'ar' | 'en';
  initialActivities?: ActivityFeedItem[];
  limit?: number;
  showHeader?: boolean;
}

const translations = {
  ar: {
    title: 'نشاط العائلة',
    subtitle: 'آخر التحديثات والأنشطة',
    loading: 'جاري التحميل...',
    loadMore: 'تحميل المزيد',
    refresh: 'تحديث',
    noActivity: 'لا يوجد نشاط حتى الآن',
    today: 'اليوم',
    yesterday: 'أمس',
    daysAgo: 'منذ {days} أيام',
    activities: {
      person_added: '{actor} أضاف {target}',
      person_updated: '{actor} حدّث معلومات {target}',
      person_deleted: '{actor} حذف {target}',
      photo_added: '{actor} أضاف صورة لـ {target}',
      photo_updated: '{actor} حدّث صورة {target}',
      relationship_added: '{actor} أضاف علاقة جديدة',
      relationship_updated: '{actor} حدّث علاقة',
      tree_updated: '{actor} حدّث إعدادات الشجرة',
      tree_shared: '{actor} شارك الشجرة',
      member_joined: '{actor} انضم للشجرة',
      member_left: '{actor} غادر الشجرة',
      contribution_received: 'مساهمة جديدة من {actor}',
      contribution_approved: '{actor} وافق على مساهمة',
      milestone_reached: 'إنجاز جديد!',
      memorial_date: 'ذكرى {target}',
      verification_requested: '{actor} طلب التحقق',
      verification_completed: 'تم التحقق من {target}',
      export_requested: '{actor} طلب تصدير البيانات',
      comment_added: '{actor} علّق على {target}',
    },
  },
  en: {
    title: 'Family Activity',
    subtitle: 'Latest updates and activities',
    loading: 'Loading...',
    loadMore: 'Load More',
    refresh: 'Refresh',
    noActivity: 'No activity yet',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    activities: {
      person_added: '{actor} added {target}',
      person_updated: '{actor} updated {target}',
      person_deleted: '{actor} deleted {target}',
      photo_added: '{actor} added a photo to {target}',
      photo_updated: '{actor} updated photo of {target}',
      relationship_added: '{actor} added a new relationship',
      relationship_updated: '{actor} updated a relationship',
      tree_updated: '{actor} updated tree settings',
      tree_shared: '{actor} shared the tree',
      member_joined: '{actor} joined the tree',
      member_left: '{actor} left the tree',
      contribution_received: 'New contribution from {actor}',
      contribution_approved: '{actor} approved a contribution',
      milestone_reached: 'New milestone reached!',
      memorial_date: 'Memorial of {target}',
      verification_requested: '{actor} requested verification',
      verification_completed: '{target} has been verified',
      export_requested: '{actor} requested data export',
      comment_added: '{actor} commented on {target}',
    },
  },
};

const activityIcons: Record<ActivityType, React.ElementType> = {
  person_added: UserPlus,
  person_updated: Edit,
  person_deleted: Trash2,
  photo_added: Image,
  photo_updated: Image,
  relationship_added: Link2,
  relationship_updated: Link2,
  tree_updated: Edit,
  tree_shared: Share2,
  member_joined: UserPlus,
  member_left: Users,
  contribution_received: Gift,
  contribution_approved: CheckCircle,
  milestone_reached: Gift,
  memorial_date: Bell,
  verification_requested: FileText,
  verification_completed: CheckCircle,
  export_requested: FileText,
  comment_added: MessageSquare,
};

const activityColors: Record<ActivityType, string> = {
  person_added: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  person_updated: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  person_deleted: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  photo_added: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  photo_updated: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  relationship_added: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  relationship_updated: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  tree_updated: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  tree_shared: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  member_joined: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  member_left: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
  contribution_received: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  contribution_approved: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  milestone_reached: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  memorial_date: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
  verification_requested: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  verification_completed: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  export_requested: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  comment_added: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

function formatTimeAgo(timestamp: number, locale: 'ar' | 'en', t: typeof translations['ar']): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  const days = Math.floor(diff / (24 * 60 * 60));

  if (days === 0) return t.today;
  if (days === 1) return t.yesterday;
  return t.daysAgo.replace('{days}', days.toString());
}

function formatActivityMessage(
  activity: ActivityFeedItem,
  locale: 'ar' | 'en',
  t: typeof translations['ar']
): string {
  const template = t.activities[activity.activity_type] || activity.activity_type;
  const actorName = activity.actor_name || (locale === 'ar' ? 'مستخدم' : 'User');
  const targetName = locale === 'ar'
    ? activity.target_name_ar || activity.target_name || ''
    : activity.target_name || activity.target_name_ar || '';

  return template
    .replace('{actor}', actorName)
    .replace('{target}', targetName);
}

export function ActivityFeed({
  treeId,
  locale = 'ar',
  initialActivities = [],
  limit = 10,
  showHeader = true,
}: ActivityFeedProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [activities, setActivities] = React.useState<ActivityFeedItem[]>(initialActivities);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [offset, setOffset] = React.useState(initialActivities.length);

  const loadActivities = async (reset = false) => {
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getActivityFeed(treeId, { limit, offset: newOffset });

      if (reset) {
        setActivities(data);
        setOffset(data.length);
      } else {
        setActivities(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }

      setHasMore(data.length === limit);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group activities by date
  const groupedActivities = React.useMemo(() => {
    const groups: { [key: string]: ActivityFeedItem[] } = {};

    activities.forEach(activity => {
      const date = new Date(activity.created_at * 1000);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  }, [activities]);

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-islamic-primary" />
              {t.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t.subtitle}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadActivities(true)}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 me-1 ${loading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
        </div>
      )}

      {activities.length === 0 && !loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t.noActivity}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {formatTimeAgo(dayActivities[0].created_at, locale, t)}
                </span>
              </div>

              <div className="space-y-3">
                {dayActivities.map(activity => {
                  const Icon = activityIcons[activity.activity_type] || Activity;
                  const colorClass = activityColors[activity.activity_type];

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-islamic-primary/30 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {formatActivityMessage(activity, locale, t)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(activity.created_at * 1000).toLocaleTimeString(
                            locale === 'ar' ? 'ar-SA' : 'en-US',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && activities.length > 0 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => loadActivities()}
            disabled={loading}
          >
            {loading ? t.loading : t.loadMore}
            <ChevronDown className="w-4 h-4 ms-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
