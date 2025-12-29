'use client';

import { TreeDeciduous, Users, Calendar, MapPin } from 'lucide-react';

interface ShareablePreviewCardProps {
  treeName: string;
  treeNameAr: string;
  memberCount: number;
  generationCount: number;
  locale?: 'ar' | 'en';
  variant?: 'light' | 'dark' | 'islamic';
  size?: 'sm' | 'md' | 'lg';
}

export function ShareablePreviewCard({
  treeName,
  treeNameAr,
  memberCount,
  generationCount,
  locale = 'ar',
  variant = 'islamic',
  size = 'md',
}: ShareablePreviewCardProps) {
  const isRTL = locale === 'ar';
  const displayName = locale === 'ar' ? treeNameAr : treeName;

  const t = {
    ar: {
      familyTree: 'شجرة عائلة',
      members: 'فرد',
      generations: 'جيل',
      joinUs: 'انضم إلينا',
      poweredBy: 'شجرة',
    },
    en: {
      familyTree: 'Family Tree',
      members: 'members',
      generations: 'generations',
      joinUs: 'Join us',
      poweredBy: 'Shajara',
    },
  }[locale];

  const sizeClasses = {
    sm: 'w-64 p-4',
    md: 'w-80 p-6',
    lg: 'w-96 p-8',
  }[size];

  const variantClasses = {
    light: 'bg-white text-gray-800 border border-gray-200',
    dark: 'bg-gray-900 text-white',
    islamic: 'bg-gradient-to-br from-islamic-primary to-islamic-dark text-white',
  }[variant];

  return (
    <div
      className={`${sizeClasses} ${variantClasses} rounded-2xl shadow-xl overflow-hidden`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="islamic-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3" fill="currentColor" />
            <circle cx="0" cy="0" r="2" fill="currentColor" />
            <circle cx="20" cy="0" r="2" fill="currentColor" />
            <circle cx="0" cy="20" r="2" fill="currentColor" />
            <circle cx="20" cy="20" r="2" fill="currentColor" />
          </pattern>
          <rect width="100" height="100" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${variant === 'islamic' ? 'bg-white/20' : 'bg-islamic-primary/10'}`}>
            <TreeDeciduous className={`w-10 h-10 ${variant === 'islamic' ? 'text-white' : 'text-islamic-primary'}`} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <p className={`text-sm ${variant === 'islamic' ? 'text-white/70' : 'text-gray-500'} mb-1`}>
            {t.familyTree}
          </p>
          <h2 className="text-2xl font-bold">{displayName}</h2>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl mx-auto mb-2 ${variant === 'islamic' ? 'bg-white/20' : 'bg-islamic-primary/10'}`}>
              <Users className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{memberCount}</p>
            <p className={`text-xs ${variant === 'islamic' ? 'text-white/70' : 'text-gray-500'}`}>
              {t.members}
            </p>
          </div>

          <div className="text-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl mx-auto mb-2 ${variant === 'islamic' ? 'bg-white/20' : 'bg-islamic-primary/10'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-2xl font-bold">{generationCount}</p>
            <p className={`text-xs ${variant === 'islamic' ? 'text-white/70' : 'text-gray-500'}`}>
              {t.generations}
            </p>
          </div>
        </div>

        {/* Join Button */}
        <div className={`text-center py-3 rounded-xl ${variant === 'islamic' ? 'bg-white text-islamic-primary' : 'bg-islamic-primary text-white'} font-bold`}>
          {t.joinUs}
        </div>

        {/* Footer */}
        <div className={`text-center mt-4 text-xs ${variant === 'islamic' ? 'text-white/50' : 'text-gray-400'}`}>
          {t.poweredBy} 🌳
        </div>
      </div>
    </div>
  );
}

// Invite-specific preview card
interface InvitePreviewCardProps {
  inviterName: string;
  treeName: string;
  treeNameAr: string;
  role: 'viewer' | 'editor' | 'admin';
  locale?: 'ar' | 'en';
}

export function InvitePreviewCard({
  inviterName,
  treeName,
  treeNameAr,
  role,
  locale = 'ar',
}: InvitePreviewCardProps) {
  const isRTL = locale === 'ar';
  const displayName = locale === 'ar' ? treeNameAr : treeName;

  const t = {
    ar: {
      invitedYou: 'دعاك للانضمام',
      toTree: 'إلى شجرة عائلة',
      as: 'كـ',
      roles: {
        viewer: 'مشاهد',
        editor: 'محرر',
        admin: 'مدير',
      },
      accept: 'قبول الدعوة',
    },
    en: {
      invitedYou: 'invited you to join',
      toTree: 'the family tree of',
      as: 'as',
      roles: {
        viewer: 'Viewer',
        editor: 'Editor',
        admin: 'Admin',
      },
      accept: 'Accept Invitation',
    },
  }[locale];

  return (
    <div
      className="w-80 bg-gradient-to-br from-islamic-primary to-islamic-dark text-white rounded-2xl shadow-xl p-6 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative corner */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-islamic-gold/20 rounded-br-full" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <TreeDeciduous className="w-8 h-8" />
          </div>
        </div>

        {/* Invitation Message */}
        <div className="text-center mb-6">
          <p className="text-lg font-bold mb-1">{inviterName}</p>
          <p className="text-white/80 text-sm">
            {t.invitedYou}
          </p>
          <p className="text-xl font-bold mt-2">{displayName}</p>
          <p className="text-white/70 text-sm mt-1">
            {t.as} <span className="font-semibold">{t.roles[role]}</span>
          </p>
        </div>

        {/* Accept Button */}
        <button className="w-full py-3 bg-white text-islamic-primary rounded-xl font-bold hover:bg-white/90 transition-colors">
          {t.accept}
        </button>
      </div>
    </div>
  );
}

// Person share card
interface PersonShareCardProps {
  personName: string;
  personNameAr?: string;
  birthYear?: number;
  deathYear?: number;
  photoUrl?: string;
  locale?: 'ar' | 'en';
}

export function PersonShareCard({
  personName,
  personNameAr,
  birthYear,
  deathYear,
  photoUrl,
  locale = 'ar',
}: PersonShareCardProps) {
  const isRTL = locale === 'ar';
  const displayName = locale === 'ar' && personNameAr ? personNameAr : personName;

  const lifespan = birthYear
    ? deathYear
      ? `${birthYear} - ${deathYear}`
      : `${birthYear} - ${locale === 'ar' ? 'الآن' : 'Present'}`
    : null;

  return (
    <div
      className="w-72 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-r from-islamic-primary to-islamic-gold" />

      {/* Photo or initials */}
      <div className="-mt-12 flex justify-center">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="w-24 h-24 rounded-full border-4 border-white object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border-4 border-white bg-islamic-light flex items-center justify-center">
            <span className="text-3xl font-bold text-islamic-primary">
              {displayName.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6 text-center">
        <h3 className="text-xl font-bold text-gray-800">{displayName}</h3>
        {lifespan && (
          <p className="text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4" />
            {lifespan}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            {locale === 'ar' ? 'شجرة العائلة' : 'Family Tree'} 🌳
          </p>
        </div>
      </div>
    </div>
  );
}
