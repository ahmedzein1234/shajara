'use client';

import * as React from 'react';
import {
  Users, Search, GitMerge, X, Check, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type DuplicateCandidate,
  type FamilyMemberBasic,
  getDuplicateCandidates,
  scanForDuplicates,
  resolveDuplicateCandidate,
  mergeDuplicateMembers,
} from '@/lib/db/smart-actions';

interface DuplicateDetectorProps {
  treeId: string;
  locale?: 'ar' | 'en';
}

const translations = {
  ar: {
    title: 'كشف التكرارات',
    subtitle: 'البحث عن أعضاء مكررين محتملين',
    scan: 'فحص الشجرة',
    scanning: 'جاري الفحص...',
    noDuplicates: 'لم يتم العثور على تكرارات',
    similarity: 'نسبة التشابه',
    notDuplicate: 'ليسوا مكررين',
    merge: 'دمج',
    reasons: {
      name_match_ar: 'تطابق الاسم (عربي)',
      name_match_en: 'تطابق الاسم (إنجليزي)',
      family_name_match: 'تطابق اسم العائلة',
      birth_date_match: 'تطابق تاريخ الميلاد',
      death_date_match: 'تطابق تاريخ الوفاة',
      gender_match: 'تطابق الجنس',
    },
    mergeDialog: {
      title: 'دمج السجلات',
      selectFields: 'اختر البيانات التي تريد الاحتفاظ بها',
      keepFrom: 'الاحتفاظ من',
      member1: 'العضو الأول',
      member2: 'العضو الثاني',
      confirmMerge: 'تأكيد الدمج',
      cancel: 'إلغاء',
    },
    fields: {
      first_name_ar: 'الاسم الأول (عربي)',
      first_name_en: 'الاسم الأول (إنجليزي)',
      last_name_ar: 'اسم العائلة (عربي)',
      last_name_en: 'اسم العائلة (إنجليزي)',
      birth_date: 'تاريخ الميلاد',
      death_date: 'تاريخ الوفاة',
      photo_url: 'الصورة',
    },
  },
  en: {
    title: 'Duplicate Detection',
    subtitle: 'Find potential duplicate members',
    scan: 'Scan Tree',
    scanning: 'Scanning...',
    noDuplicates: 'No duplicates found',
    similarity: 'Similarity',
    notDuplicate: 'Not Duplicates',
    merge: 'Merge',
    reasons: {
      name_match_ar: 'Name Match (Arabic)',
      name_match_en: 'Name Match (English)',
      family_name_match: 'Family Name Match',
      birth_date_match: 'Birth Date Match',
      death_date_match: 'Death Date Match',
      gender_match: 'Gender Match',
    },
    mergeDialog: {
      title: 'Merge Records',
      selectFields: 'Select which data to keep',
      keepFrom: 'Keep from',
      member1: 'Member 1',
      member2: 'Member 2',
      confirmMerge: 'Confirm Merge',
      cancel: 'Cancel',
    },
    fields: {
      first_name_ar: 'First Name (Arabic)',
      first_name_en: 'First Name (English)',
      last_name_ar: 'Last Name (Arabic)',
      last_name_en: 'Last Name (English)',
      birth_date: 'Birth Date',
      death_date: 'Death Date',
      photo_url: 'Photo',
    },
  },
};

function MemberCard({
  member,
  locale,
  selected,
  onClick,
}: {
  member: FamilyMemberBasic;
  locale: 'ar' | 'en';
  selected?: boolean;
  onClick?: () => void;
}) {
  const name = locale === 'ar'
    ? `${member.first_name_ar} ${member.last_name_ar}`
    : `${member.first_name_en || member.first_name_ar} ${member.last_name_en || member.last_name_ar}`;

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl border-2 transition-all text-start ${
        selected
          ? 'border-islamic-primary bg-islamic-light/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-3">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <User className="w-6 h-6 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 dark:text-white truncate">
            {name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {member.birth_date && <span>{member.birth_date}</span>}
            {member.death_date && <span>- {member.death_date}</span>}
          </div>
        </div>
        {selected && (
          <Check className="w-5 h-5 text-islamic-primary shrink-0" />
        )}
      </div>
    </button>
  );
}

export function DuplicateDetector({ treeId, locale = 'ar' }: DuplicateDetectorProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [candidates, setCandidates] = React.useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [scanning, setScanning] = React.useState(false);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [mergeDialogId, setMergeDialogId] = React.useState<string | null>(null);
  const [selectedMember, setSelectedMember] = React.useState<'member1' | 'member2'>('member1');
  const [fieldChoices, setFieldChoices] = React.useState<Record<string, 'member1' | 'member2'>>({});

  const loadCandidates = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDuplicateCandidates(treeId, 'pending');
      setCandidates(data);
    } catch (error) {
      console.error('Failed to load duplicates:', error);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  React.useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await scanForDuplicates(treeId);
      await loadCandidates();
    } catch (error) {
      console.error('Failed to scan:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleNotDuplicate = async (candidateId: string) => {
    setProcessingId(candidateId);
    try {
      await resolveDuplicateCandidate(candidateId, 'not_duplicate');
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
    } catch (error) {
      console.error('Failed to resolve:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenMerge = (candidate: DuplicateCandidate) => {
    setMergeDialogId(candidate.id);
    setSelectedMember('member1');
    // Initialize field choices with member1 as default
    const fields = ['first_name_ar', 'first_name_en', 'last_name_ar', 'last_name_en', 'birth_date', 'death_date', 'photo_url'];
    const choices: Record<string, 'member1' | 'member2'> = {};
    fields.forEach(f => { choices[f] = 'member1'; });
    setFieldChoices(choices);
  };

  const handleMerge = async () => {
    if (!mergeDialogId) return;

    const candidate = candidates.find(c => c.id === mergeDialogId);
    if (!candidate) return;

    setProcessingId(mergeDialogId);
    try {
      const keepMemberId = selectedMember === 'member1'
        ? candidate.member1_id
        : candidate.member2_id;

      await mergeDuplicateMembers(mergeDialogId, keepMemberId, fieldChoices);
      setCandidates(prev => prev.filter(c => c.id !== mergeDialogId));
      setMergeDialogId(null);
    } catch (error) {
      console.error('Failed to merge:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const mergeCandidate = candidates.find(c => c.id === mergeDialogId);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-sm text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin me-2" />
                {t.scanning}
              </>
            ) : (
              <>
                <Search className="w-4 h-4 me-2" />
                {t.scan}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Candidates List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-islamic-primary" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.noDuplicates}</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <div key={candidate.id} className="p-4">
              {/* Similarity Header */}
              <button
                onClick={() => setExpandedId(expandedId === candidate.id ? null : candidate.id)}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.similarity}: {Math.round(candidate.similarity_score * 100)}%
                  </span>
                </div>
                {expandedId === candidate.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {/* Member Comparison */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <MemberCard member={candidate.member1!} locale={locale} />
                <MemberCard member={candidate.member2!} locale={locale} />
              </div>

              {/* Match Reasons (Expanded) */}
              {expandedId === candidate.id && (
                <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">
                    {locale === 'ar' ? 'أسباب التطابق:' : 'Match reasons:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.match_reasons.map((reason) => (
                      <span
                        key={reason}
                        className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                      >
                        {t.reasons[reason as keyof typeof t.reasons] || reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {processingId === candidate.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotDuplicate(candidate.id)}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 me-1" />
                      {t.notDuplicate}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenMerge(candidate)}
                      className="flex-1 bg-islamic-primary hover:bg-islamic-dark"
                    >
                      <GitMerge className="w-4 h-4 me-1" />
                      {t.merge}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Merge Dialog */}
      {mergeDialogId && mergeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {t.mergeDialog.title}
                </h3>
                <button
                  onClick={() => setMergeDialogId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Select Primary Member */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {t.mergeDialog.selectFields}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <MemberCard
                  member={mergeCandidate.member1!}
                  locale={locale}
                  selected={selectedMember === 'member1'}
                  onClick={() => setSelectedMember('member1')}
                />
                <MemberCard
                  member={mergeCandidate.member2!}
                  locale={locale}
                  selected={selectedMember === 'member2'}
                  onClick={() => setSelectedMember('member2')}
                />
              </div>

              {/* Field Choices */}
              <div className="space-y-3 mb-4">
                {Object.keys(fieldChoices).map((field) => {
                  const m1Value = mergeCandidate.member1![field as keyof FamilyMemberBasic];
                  const m2Value = mergeCandidate.member2![field as keyof FamilyMemberBasic];

                  if (!m1Value && !m2Value) return null;

                  return (
                    <div key={field} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <p className="text-xs text-slate-500 mb-2">
                        {t.fields[field as keyof typeof t.fields] || field}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setFieldChoices(prev => ({ ...prev, [field]: 'member1' }))}
                          className={`p-2 text-sm rounded-lg border-2 transition-all ${
                            fieldChoices[field] === 'member1'
                              ? 'border-islamic-primary bg-islamic-light/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {String(m1Value) || '-'}
                        </button>
                        <button
                          onClick={() => setFieldChoices(prev => ({ ...prev, [field]: 'member2' }))}
                          className={`p-2 text-sm rounded-lg border-2 transition-all ${
                            fieldChoices[field] === 'member2'
                              ? 'border-islamic-primary bg-islamic-light/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {String(m2Value) || '-'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setMergeDialogId(null)}
                className="flex-1"
              >
                {t.mergeDialog.cancel}
              </Button>
              <Button
                onClick={handleMerge}
                disabled={processingId === mergeDialogId}
                className="flex-1 bg-islamic-primary hover:bg-islamic-dark"
              >
                {processingId === mergeDialogId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <GitMerge className="w-4 h-4 me-2" />
                    {t.mergeDialog.confirmMerge}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
