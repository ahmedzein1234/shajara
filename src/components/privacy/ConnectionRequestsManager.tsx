'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Check, X, Loader2, Clock, Ban, User, Mail, Calendar } from 'lucide-react';
import type { ConnectionRequest, AccessLevel } from '@/lib/privacy/actions';
import { getConnectionRequests, reviewConnectionRequest } from '@/lib/privacy/actions';

interface ConnectionRequestsManagerProps {
  treeId: string;
  locale: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'طلبات الانضمام',
    noRequests: 'لا توجد طلبات',
    noRequestsDesc: 'ستظهر هنا طلبات الانضمام من الأقارب',
    pending: 'قيد الانتظار',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',
    blocked: 'محظور',
    approve: 'موافقة',
    reject: 'رفض',
    block: 'حظر',
    accessLevel: 'مستوى الوصول',
    viewer: 'مشاهد',
    family: 'فرد من العائلة',
    trusted: 'موثوق',
    editor: 'محرر',
    relationship: 'العلاقة المُدّعاة',
    message: 'الرسالة',
    requestedAt: 'تاريخ الطلب',
    processing: 'جاري المعالجة...',
  },
  en: {
    title: 'Connection Requests',
    noRequests: 'No requests',
    noRequestsDesc: 'Connection requests from relatives will appear here',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    blocked: 'Blocked',
    approve: 'Approve',
    reject: 'Reject',
    block: 'Block',
    accessLevel: 'Access Level',
    viewer: 'Viewer',
    family: 'Family',
    trusted: 'Trusted',
    editor: 'Editor',
    relationship: 'Claimed Relationship',
    message: 'Message',
    requestedAt: 'Requested At',
    processing: 'Processing...',
  },
};

export default function ConnectionRequestsManager({
  treeId,
  locale,
}: ConnectionRequestsManagerProps) {
  const t = translations[locale];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [treeId]);

  const loadRequests = async () => {
    try {
      const data = await getConnectionRequests(treeId);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    requestId: string,
    decision: 'approved' | 'rejected' | 'blocked',
    accessLevel?: AccessLevel
  ) => {
    setProcessingId(requestId);
    startTransition(async () => {
      try {
        await reviewConnectionRequest(requestId, decision, accessLevel);
        await loadRequests();
        router.refresh();
      } catch (error) {
        console.error('Failed to review request:', error);
      } finally {
        setProcessingId(null);
      }
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      blocked: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    const labels = {
      pending: t.pending,
      approved: t.approved,
      rejected: t.rejected,
      blocked: t.blocked,
    };
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-islamic-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          {t.noRequests}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t.noRequestsDesc}
        </p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            {t.pending} ({pendingRequests.length})
          </h4>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-islamic-100 dark:bg-islamic-900/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-islamic-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {request.requester_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {request.requester_email}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                {request.claimed_relationship && (
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1">{t.relationship}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                      {request.claimed_relationship}
                    </div>
                  </div>
                )}

                {request.message && (
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-1">{t.message}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                      {request.message}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  {formatDate(request.created_at)}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  {processingId === request.id ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.processing}
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center gap-2">
                        <select
                          id={`access-${request.id}`}
                          defaultValue="viewer"
                          className="text-sm px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="viewer">{t.viewer}</option>
                          <option value="family">{t.family}</option>
                          <option value="trusted">{t.trusted}</option>
                          <option value="editor">{t.editor}</option>
                        </select>
                        <button
                          onClick={() => {
                            const select = document.getElementById(`access-${request.id}`) as HTMLSelectElement;
                            handleReview(request.id, 'approved', select.value as AccessLevel);
                          }}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          {t.approve}
                        </button>
                      </div>
                      <button
                        onClick={() => handleReview(request.id, 'rejected')}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        {t.reject}
                      </button>
                      <button
                        onClick={() => handleReview(request.id, 'blocked')}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        {t.block}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-500 dark:text-slate-400 mb-4">
            {locale === 'ar' ? 'الطلبات السابقة' : 'Previous Requests'} ({reviewedRequests.length})
          </h4>
          <div className="space-y-2">
            {reviewedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {request.requester_name || request.requester_email}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {request.granted_access_level && (
                    <span className="text-xs text-slate-500">
                      {t[request.granted_access_level as keyof typeof t] || request.granted_access_level}
                    </span>
                  )}
                  {getStatusBadge(request.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
