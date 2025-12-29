/**
 * DetailsSidePanel Component
 * A sliding panel that shows detailed information about a selected person
 * Inspired by FamilySearch and MyHeritage's details panels
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Person, Relationship } from '@/lib/db/schema';
import { TreeNode } from '@/types/tree';
import {
  X,
  Edit3,
  UserPlus,
  Heart,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Camera,
  ChevronRight,
  ExternalLink,
  Clock,
  Award,
  Share2,
} from 'lucide-react';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';

interface DetailsSidePanelProps {
  node: TreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  locale?: 'ar' | 'en';
  onEdit?: (person: Person) => void;
  onAddChild?: (person: Person) => void;
  onAddSpouse?: (person: Person) => void;
  onAddParent?: (person: Person) => void;
  onViewFullProfile?: (person: Person) => void;
  onSelectPerson?: (personId: string) => void;
}

const translations = {
  ar: {
    details: 'التفاصيل',
    edit: 'تعديل',
    viewProfile: 'عرض الملف الكامل',
    personalInfo: 'المعلومات الشخصية',
    birthDate: 'تاريخ الميلاد',
    birthPlace: 'مكان الميلاد',
    deathDate: 'تاريخ الوفاة',
    deathPlace: 'مكان الوفاة',
    age: 'العمر',
    living: 'على قيد الحياة',
    deceased: 'متوفى',
    family: 'العائلة',
    parents: 'الوالدين',
    spouses: 'الأزواج',
    children: 'الأبناء',
    siblings: 'الإخوة',
    noInfo: 'لا توجد معلومات',
    addChild: 'إضافة ابن/ابنة',
    addSpouse: 'إضافة زوج/زوجة',
    addParent: 'إضافة والد/والدة',
    quickActions: 'إجراءات سريعة',
    stories: 'القصص والذكريات',
    photos: 'الصور',
    timeline: 'الجدول الزمني',
    years: 'سنة',
    share: 'مشاركة',
    contactInfo: 'معلومات الاتصال',
    notes: 'ملاحظات',
  },
  en: {
    details: 'Details',
    edit: 'Edit',
    viewProfile: 'View Full Profile',
    personalInfo: 'Personal Information',
    birthDate: 'Birth Date',
    birthPlace: 'Birth Place',
    deathDate: 'Death Date',
    deathPlace: 'Death Place',
    age: 'Age',
    living: 'Living',
    deceased: 'Deceased',
    family: 'Family',
    parents: 'Parents',
    spouses: 'Spouses',
    children: 'Children',
    siblings: 'Siblings',
    noInfo: 'No information',
    addChild: 'Add Child',
    addSpouse: 'Add Spouse',
    addParent: 'Add Parent',
    quickActions: 'Quick Actions',
    stories: 'Stories & Memories',
    photos: 'Photos',
    timeline: 'Timeline',
    years: 'years',
    share: 'Share',
    contactInfo: 'Contact Info',
    notes: 'Notes',
  },
};

export function DetailsSidePanel({
  node,
  isOpen,
  onClose,
  locale = 'ar',
  onEdit,
  onAddChild,
  onAddSpouse,
  onAddParent,
  onViewFullProfile,
  onSelectPerson,
}: DetailsSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'family' | 'timeline'>('info');
  const t = translations[locale];
  const isRTL = locale === 'ar';

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!node) return null;

  const { person } = node;
  const avatarColor = generateAvatarColor(person.id);

  // Calculate age
  const birthDate = person.birth_date ? new Date(person.birth_date) : null;
  const deathDate = person.death_date ? new Date(person.death_date) : null;
  const currentAge = birthDate
    ? person.is_living
      ? new Date().getFullYear() - birthDate.getFullYear()
      : deathDate
        ? deathDate.getFullYear() - birthDate.getFullYear()
        : null
    : null;

  // Get display name
  const displayName = locale === 'ar'
    ? (person.full_name_ar || person.given_name)
    : (person.full_name_en || person.given_name);

  // Gender colors
  const genderColor = person.gender === 'male'
    ? 'bg-blue-500'
    : person.gender === 'female'
      ? 'bg-pink-500'
      : 'bg-gray-500';

  const genderLightColor = person.gender === 'male'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : person.gender === 'female'
      ? 'bg-pink-50 text-pink-700 border-pink-200'
      : 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transition-transform duration-300 ease-out overflow-hidden flex flex-col',
          isRTL ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : isRTL
              ? '-translate-x-full'
              : 'translate-x-full'
        )}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className={cn('relative', genderColor)}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Person info header */}
          <div className="pt-6 pb-20 px-6 text-white">
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-4">
              {person.is_living ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {t.living}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  {t.deceased}
                </span>
              )}
              {currentAge && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                  <Clock size={12} />
                  {currentAge} {t.years}
                </span>
              )}
            </div>

            {/* Name */}
            <h2 className="text-2xl font-bold mb-1 leading-tight">
              {displayName}
            </h2>
            {person.family_name && (
              <p className="text-white/80 text-sm">
                {person.family_name}
              </p>
            )}
          </div>

          {/* Avatar - overlapping header and content */}
          <div className="absolute -bottom-12 left-6">
            {person.photo_url ? (
              <img
                src={person.photo_url}
                alt={displayName}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {getInitials(person.given_name)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute -bottom-6 right-6 flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(person)}
                className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-blue-600 transition-all hover:scale-105"
                title={t.edit}
              >
                <Edit3 size={18} />
              </button>
            )}
            {onViewFullProfile && (
              <button
                onClick={() => onViewFullProfile(person)}
                className="p-3 rounded-xl bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-blue-600 transition-all hover:scale-105"
                title={t.viewProfile}
              >
                <ExternalLink size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-16 px-4">
          {(['info', 'family', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'info' && t.personalInfo}
              {tab === 'family' && t.family}
              {tab === 'timeline' && t.timeline}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="p-4 space-y-6">
              {/* Personal Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  {t.personalInfo}
                </h3>
                <div className="space-y-3">
                  {birthDate && (
                    <InfoRow
                      label={t.birthDate}
                      value={birthDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  )}
                  {person.birth_place && (
                    <InfoRow
                      label={t.birthPlace}
                      value={person.birth_place}
                      icon={<MapPin size={14} className="text-gray-400" />}
                    />
                  )}
                  {deathDate && (
                    <InfoRow
                      label={t.deathDate}
                      value={deathDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    />
                  )}
                  {person.death_place && (
                    <InfoRow
                      label={t.deathPlace}
                      value={person.death_place}
                      icon={<MapPin size={14} className="text-gray-400" />}
                    />
                  )}
                </div>
              </section>

              {/* Notes */}
              {person.notes && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen size={16} className="text-gray-400" />
                    {t.notes}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                    {person.notes}
                  </p>
                </section>
              )}

              {/* Quick Actions */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t.quickActions}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {onAddChild && (
                    <QuickActionButton
                      icon={<UserPlus size={18} />}
                      label={t.addChild}
                      onClick={() => onAddChild(person)}
                    />
                  )}
                  {onAddSpouse && (
                    <QuickActionButton
                      icon={<Heart size={18} />}
                      label={t.addSpouse}
                      onClick={() => onAddSpouse(person)}
                    />
                  )}
                  {onAddParent && (
                    <QuickActionButton
                      icon={<Users size={18} />}
                      label={t.addParent}
                      onClick={() => onAddParent(person)}
                    />
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="p-4 space-y-6">
              {/* Parents */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  {t.parents}
                </h3>
                {(node.parents?.length || 0) > 0 ? (
                  <div className="space-y-2">
                    {(node.parents || []).map((parent) => (
                      <RelativeCard
                        key={parent.id}
                        node={parent}
                        locale={locale}
                        onClick={() => onSelectPerson?.(parent.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">{t.noInfo}</p>
                )}
              </section>

              {/* Spouses */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Heart size={16} className="text-gray-400" />
                  {t.spouses}
                </h3>
                {(node.spouses?.length || 0) > 0 ? (
                  <div className="space-y-2">
                    {(node.spouses || []).map((spouse) => (
                      <RelativeCard
                        key={spouse.node.id}
                        node={spouse.node}
                        locale={locale}
                        relationship={spouse.relationship}
                        onClick={() => onSelectPerson?.(spouse.node.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">{t.noInfo}</p>
                )}
              </section>

              {/* Children */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserPlus size={16} className="text-gray-400" />
                  {t.children}
                </h3>
                {(node.children?.length || 0) > 0 ? (
                  <div className="space-y-2">
                    {(node.children || []).map((child) => (
                      <RelativeCard
                        key={child.id}
                        node={child}
                        locale={locale}
                        onClick={() => onSelectPerson?.(child.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">{t.noInfo}</p>
                )}
              </section>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-4">
              <Timeline node={node} locale={locale} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Info row component
 */
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-500 min-w-[100px]">{label}</span>
      <span className="text-gray-900 font-medium flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}

/**
 * Quick action button
 */
function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
    >
      {icon}
      <span className="text-xs text-center leading-tight">{label}</span>
    </button>
  );
}

/**
 * Relative card component
 */
function RelativeCard({
  node,
  locale,
  relationship,
  onClick,
}: {
  node: TreeNode;
  locale: 'ar' | 'en';
  relationship?: Relationship;
  onClick?: () => void;
}) {
  const { person } = node;
  const avatarColor = generateAvatarColor(person.id);
  const displayName = locale === 'ar'
    ? (person.full_name_ar || person.given_name)
    : (person.full_name_en || person.given_name);

  const birthYear = person.birth_date
    ? new Date(person.birth_date).getFullYear()
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
    >
      {/* Avatar */}
      {person.photo_url ? (
        <img
          src={person.photo_url}
          alt={displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(person.given_name)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{displayName}</div>
        <div className="text-xs text-gray-500">
          {birthYear && <span>{birthYear}</span>}
          {relationship?.marriage_date && (
            <span className="ml-2">
              💍 {new Date(relationship.marriage_date).getFullYear()}
            </span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {person.is_living && (
          <span className="w-2 h-2 rounded-full bg-green-400" />
        )}
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </button>
  );
}

/**
 * Timeline component
 */
function Timeline({ node, locale }: { node: TreeNode; locale: 'ar' | 'en' }) {
  const { person } = node;
  const events: Array<{ date: Date; label: string; type: 'birth' | 'death' | 'marriage' }> = [];

  if (person.birth_date) {
    events.push({
      date: new Date(person.birth_date),
      label: locale === 'ar' ? 'الولادة' : 'Born',
      type: 'birth',
    });
  }

  // Add marriage events (with safety check)
  (node.spouses || []).forEach((spouse) => {
    if (spouse.relationship?.marriage_date) {
      events.push({
        date: new Date(spouse.relationship.marriage_date),
        label: locale === 'ar'
          ? `الزواج من ${spouse.node.person.given_name}`
          : `Married ${spouse.node.person.given_name}`,
        type: 'marriage',
      });
    }
  });

  if (person.death_date) {
    events.push({
      date: new Date(person.death_date),
      label: locale === 'ar' ? 'الوفاة' : 'Passed away',
      type: 'death',
    });
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic text-center py-8">
        {locale === 'ar' ? 'لا توجد أحداث مسجلة' : 'No events recorded'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                event.type === 'birth' && 'bg-green-500',
                event.type === 'death' && 'bg-gray-500',
                event.type === 'marriage' && 'bg-pink-500'
              )}
            />
            {idx < events.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 my-1" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium text-gray-900">{event.label}</div>
            <div className="text-xs text-gray-500">
              {event.date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DetailsSidePanel;
