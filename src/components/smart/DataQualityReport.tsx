'use client';

import * as React from 'react';
import {
  BarChart3, TrendingUp, AlertCircle, Camera, Calendar, MapPin,
  FileText, User, Loader2, RefreshCw, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type TreeQualityMetrics,
  type MemberQualityScore,
  getTreeQualityMetrics,
  getLowQualityMembers,
  calculateTreeQuality,
  runSmartAnalysis,
} from '@/lib/db/smart-actions';

interface DataQualityReportProps {
  treeId: string;
  locale?: 'ar' | 'en';
  onMemberClick?: (memberId: string) => void;
}

const translations = {
  ar: {
    title: 'جودة البيانات',
    subtitle: 'نظرة عامة على اكتمال بيانات الشجرة',
    analyze: 'تحليل كامل',
    analyzing: 'جاري التحليل...',
    refresh: 'تحديث',
    healthScore: 'درجة الصحة',
    totalMembers: 'إجمالي الأعضاء',
    withPhotos: 'مع صور',
    withBirthDate: 'تاريخ ميلاد',
    withBirthPlace: 'مكان ميلاد',
    withDeathDate: 'تاريخ وفاة',
    withBio: 'سيرة ذاتية',
    averageCompleteness: 'متوسط الاكتمال',
    duplicates: 'تكرارات محتملة',
    suggestions: 'اقتراحات معلقة',
    needsAttention: 'يحتاج اهتمام',
    lowQualityMembers: 'أعضاء يحتاجون تحسين',
    noData: 'لا توجد بيانات بعد',
    completeness: 'الاكتمال',
    missingFields: 'حقول ناقصة',
    fields: {
      first_name_ar: 'الاسم',
      last_name_ar: 'العائلة',
      gender: 'الجنس',
      birth_date: 'الميلاد',
      birth_place_ar: 'مكان الميلاد',
      death_date: 'الوفاة',
      bio_ar: 'السيرة',
      photo_url: 'الصورة',
      father_id: 'الأب',
      mother_id: 'الأم',
    },
  },
  en: {
    title: 'Data Quality',
    subtitle: 'Overview of tree data completeness',
    analyze: 'Full Analysis',
    analyzing: 'Analyzing...',
    refresh: 'Refresh',
    healthScore: 'Health Score',
    totalMembers: 'Total Members',
    withPhotos: 'With Photos',
    withBirthDate: 'Birth Date',
    withBirthPlace: 'Birth Place',
    withDeathDate: 'Death Date',
    withBio: 'Biography',
    averageCompleteness: 'Avg. Completeness',
    duplicates: 'Potential Duplicates',
    suggestions: 'Pending Suggestions',
    needsAttention: 'Needs Attention',
    lowQualityMembers: 'Members Needing Improvement',
    noData: 'No data yet',
    completeness: 'Completeness',
    missingFields: 'Missing Fields',
    fields: {
      first_name_ar: 'Name',
      last_name_ar: 'Family',
      gender: 'Gender',
      birth_date: 'Birth',
      birth_place_ar: 'Birth Place',
      death_date: 'Death',
      bio_ar: 'Bio',
      photo_url: 'Photo',
      father_id: 'Father',
      mother_id: 'Mother',
    },
  },
};

function ProgressRing({ value, size = 80, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  total?: number;
  color: string;
}) {
  const percentage = total ? Math.round((value / total) * 100) : null;

  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
        {total !== undefined && (
          <span className="text-sm text-slate-400">/ {total}</span>
        )}
        {percentage !== null && (
          <span className={`text-xs ms-auto ${percentage >= 70 ? 'text-green-500' : percentage >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}

export function DataQualityReport({ treeId, locale = 'ar', onMemberClick }: DataQualityReportProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [metrics, setMetrics] = React.useState<TreeQualityMetrics | null>(null);
  const [lowQualityMembers, setLowQualityMembers] = React.useState<MemberQualityScore[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, membersData] = await Promise.all([
        getTreeQualityMetrics(treeId),
        getLowQualityMembers(treeId, 5),
      ]);
      setMetrics(metricsData);
      setLowQualityMembers(membersData);
    } catch (error) {
      console.error('Failed to load quality data:', error);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await runSmartAnalysis(treeId);
      await loadData();
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getMemberName = (member: MemberQualityScore['member']): string => {
    if (!member) return '';
    return locale === 'ar'
      ? `${member.first_name_ar} ${member.last_name_ar}`
      : `${member.first_name_en || member.first_name_ar} ${member.last_name_en || member.last_name_ar}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-sm text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t.analyzing}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 me-2" />
                  {t.analyze}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-islamic-primary" />
        </div>
      ) : !metrics ? (
        <div className="p-8 text-center text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t.noData}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            className="mt-4"
          >
            {t.analyze}
          </Button>
        </div>
      ) : (
        <>
          {/* Health Score */}
          <div className="p-4 flex items-center gap-6 border-b border-slate-200 dark:border-slate-700">
            <ProgressRing value={metrics.overall_health_score} size={100} strokeWidth={10} />
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {t.healthScore}
              </h4>
              <p className="text-sm text-slate-500 mb-2">
                {metrics.overall_health_score >= 80
                  ? (locale === 'ar' ? 'ممتاز! شجرتك بحالة جيدة جداً' : 'Excellent! Your tree is in great shape')
                  : metrics.overall_health_score >= 60
                    ? (locale === 'ar' ? 'جيد، مع مجال للتحسين' : 'Good, with room for improvement')
                    : (locale === 'ar' ? 'يحتاج اهتمام - أضف المزيد من المعلومات' : 'Needs attention - add more information')
                }
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4" />
                  {metrics.total_members} {t.totalMembers.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-3 gap-3 border-b border-slate-200 dark:border-slate-700">
            <StatCard
              icon={Camera}
              label={t.withPhotos}
              value={metrics.members_with_photos}
              total={metrics.total_members}
              color="text-purple-500"
            />
            <StatCard
              icon={Calendar}
              label={t.withBirthDate}
              value={metrics.members_with_birth_date}
              total={metrics.total_members}
              color="text-blue-500"
            />
            <StatCard
              icon={MapPin}
              label={t.withBirthPlace}
              value={metrics.members_with_birth_place}
              total={metrics.total_members}
              color="text-green-500"
            />
            <StatCard
              icon={Calendar}
              label={t.withDeathDate}
              value={metrics.members_with_death_date}
              total={metrics.total_members}
              color="text-slate-500"
            />
            <StatCard
              icon={FileText}
              label={t.withBio}
              value={metrics.members_with_bio}
              total={metrics.total_members}
              color="text-amber-500"
            />
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-islamic-primary" />
                <span className="text-xs text-slate-500">{t.averageCompleteness}</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {Math.round(metrics.average_completeness)}%
              </span>
            </div>
          </div>

          {/* Issues Summary */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              {metrics.duplicate_candidates_count > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    {metrics.duplicate_candidates_count} {t.duplicates}
                  </span>
                </div>
              )}
              {metrics.pending_suggestions_count > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <AlertCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {metrics.pending_suggestions_count} {t.suggestions}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Low Quality Members */}
          {lowQualityMembers.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                {t.lowQualityMembers}
              </h4>
              <div className="space-y-2">
                {lowQualityMembers.map((memberScore) => (
                  <button
                    key={memberScore.id}
                    onClick={() => onMemberClick?.(memberScore.member_id)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-start"
                  >
                    <div className="flex items-center gap-3">
                      {memberScore.member?.photo_url ? (
                        <img
                          src={memberScore.member.photo_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {getMemberName(memberScore.member)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{t.completeness}: {Math.round(memberScore.completeness_score)}%</span>
                          <span>•</span>
                          <span>{memberScore.missing_fields.length} {t.missingFields}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    {/* Missing Fields Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {memberScore.missing_fields.slice(0, 4).map((field) => (
                        <span
                          key={field}
                          className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        >
                          {t.fields[field as keyof typeof t.fields] || field}
                        </span>
                      ))}
                      {memberScore.missing_fields.length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500">
                          +{memberScore.missing_fields.length - 4}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
