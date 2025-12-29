'use client';

import * as React from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, X, Settings,
  UserPlus, Edit, Image, Gift, MessageSquare, Calendar,
  ChevronDown, Loader2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type Notification,
  type NotificationType,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/lib/db/notification-actions';

interface NotificationCenterProps {
  locale?: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'الإشعارات',
    noNotifications: 'لا توجد إشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    loadMore: 'تحميل المزيد',
    loading: 'جاري التحميل...',
    settings: 'الإعدادات',
    today: 'اليوم',
    yesterday: 'أمس',
    thisWeek: 'هذا الأسبوع',
    earlier: 'أقدم',
    justNow: 'الآن',
    minutesAgo: 'منذ {n} دقيقة',
    hoursAgo: 'منذ {n} ساعة',
    daysAgo: 'منذ {n} أيام',
  },
  en: {
    title: 'Notifications',
    noNotifications: 'No notifications',
    markAllRead: 'Mark all as read',
    loadMore: 'Load more',
    loading: 'Loading...',
    settings: 'Settings',
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    earlier: 'Earlier',
    justNow: 'Just now',
    minutesAgo: '{n} minutes ago',
    hoursAgo: '{n} hours ago',
    daysAgo: '{n} days ago',
  },
};

const notificationIcons: Record<NotificationType, React.ElementType> = {
  tree_invite: UserPlus,
  invite_accepted: UserPlus,
  member_joined: UserPlus,
  person_added: UserPlus,
  person_updated: Edit,
  photo_added: Image,
  contribution_request: Gift,
  contribution_received: Gift,
  contribution_approved: Check,
  contribution_rejected: X,
  memorial_reminder: Calendar,
  birthday_reminder: Calendar,
  mention: MessageSquare,
  message: MessageSquare,
  comment: MessageSquare,
  export_ready: ExternalLink,
  weekly_digest: Bell,
  monthly_digest: Bell,
  system: Bell,
};

const notificationColors: Partial<Record<NotificationType, string>> = {
  tree_invite: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  member_joined: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  contribution_approved: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  contribution_rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  memorial_reminder: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  mention: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function formatTimeAgo(timestamp: number, locale: 'ar' | 'en', t: typeof translations['ar']): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return t.justNow;
  if (diff < 3600) return t.minutesAgo.replace('{n}', Math.floor(diff / 60).toString());
  if (diff < 86400) return t.hoursAgo.replace('{n}', Math.floor(diff / 3600).toString());
  return t.daysAgo.replace('{n}', Math.floor(diff / 86400).toString());
}

function groupNotificationsByDate(
  notifications: Notification[],
  t: typeof translations['ar']
): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const yesterday = today - 86400;
  const weekAgo = today - 604800;

  for (const notification of notifications) {
    let group: string;
    if (notification.created_at >= today) {
      group = t.today;
    } else if (notification.created_at >= yesterday) {
      group = t.yesterday;
    } else if (notification.created_at >= weekAgo) {
      group = t.thisWeek;
    } else {
      group = t.earlier;
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(notification);
  }

  return groups;
}

// Notification Bell with Badge
export function NotificationBell({
  locale = 'ar',
  onClick,
}: {
  locale?: 'ar' | 'en';
  onClick?: () => void;
}) {
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const loadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };
    loadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Notification Dropdown Panel
export function NotificationPanel({
  isOpen,
  onClose,
  locale = 'ar',
}: {
  isOpen: boolean;
  onClose: () => void;
  locale?: 'ar' | 'en';
}) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);

  const loadNotifications = async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : notifications.length;
      const data = await getUserNotifications({ limit: 20, offset });

      if (reset) {
        setNotifications(data);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadNotifications(true);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: Date.now() / 1000 } : n)
    );
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: Date.now() / 1000 })));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    onClose();
  };

  if (!isOpen) return null;

  const groupedNotifications = groupNotificationsByDate(notifications, t);
  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute top-full mt-2 ${isRTL ? 'left-0' : 'right-0'} w-96 max-h-[80vh] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-islamic-primary hover:underline"
              >
                <CheckCheck className="w-4 h-4 inline me-1" />
                {t.markAllRead}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-islamic-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BellOff className="w-12 h-12 mb-4 opacity-50" />
              <p>{t.noNotifications}</p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500">
                  {group}
                </div>
                {items.map(notification => {
                  const Icon = notificationIcons[notification.notification_type] || Bell;
                  const colorClass = notificationColors[notification.notification_type] ||
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
                  const title = locale === 'ar' ? notification.title_ar : notification.title_en;
                  const body = locale === 'ar' ? notification.body_ar : notification.body_en;

                  return (
                    <div
                      key={notification.id}
                      className={`group relative flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-islamic-light/30 dark:bg-islamic-primary/10' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <span className="absolute top-4 end-4 w-2 h-2 bg-islamic-primary rounded-full" />
                      )}

                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''} text-slate-900 dark:text-white`}>
                          {title}
                        </p>
                        {body && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {body}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {formatTimeAgo(notification.created_at, locale, t)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Load more */}
        {hasMore && notifications.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadNotifications()}
              disabled={loading}
            >
              {loading ? t.loading : t.loadMore}
              <ChevronDown className="w-4 h-4 ms-1" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// Combined Notification Center
export function NotificationCenter({ locale = 'ar' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <NotificationBell locale={locale} onClick={() => setIsOpen(!isOpen)} />
      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} locale={locale} />
    </div>
  );
}
