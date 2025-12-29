/**
 * Hijri/Gregorian date utilities
 * Uses @internationalized/date for accurate conversions
 */

import {
  CalendarDate,
  IslamicUmalquraCalendar,
  toCalendar,
  GregorianCalendar,
} from '@internationalized/date';

export type CalendarType = 'gregorian' | 'hijri';

export interface DualDate {
  gregorian: string; // ISO format YYYY-MM-DD
  hijri: string; // Format: YYYY-MM-DD in Hijri
  hijriDisplay: string; // Formatted for display
  gregorianDisplay: string; // Formatted for display
}

// Hijri month names in Arabic
export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qi\'dah',
  'Dhu al-Hijjah',
];

export const GREGORIAN_MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/**
 * Convert Gregorian date to Hijri
 */
export function gregorianToHijri(date: Date | string): DualDate {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return {
      gregorian: '',
      hijri: '',
      hijriDisplay: '',
      gregorianDisplay: '',
    };
  }

  const gregorianDate = new CalendarDate(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );

  const hijriDate = toCalendar(gregorianDate, new IslamicUmalquraCalendar());

  const gregorian = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hijri = `${hijriDate.year}-${String(hijriDate.month).padStart(2, '0')}-${String(hijriDate.day).padStart(2, '0')}`;

  return {
    gregorian,
    hijri,
    hijriDisplay: `${hijriDate.day} ${HIJRI_MONTHS_AR[hijriDate.month - 1]} ${hijriDate.year}`,
    gregorianDisplay: `${d.getDate()} ${GREGORIAN_MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`,
  };
}

/**
 * Convert Hijri date to Gregorian
 */
export function hijriToGregorian(year: number, month: number, day: number): DualDate {
  try {
    const hijriDate = new CalendarDate(
      new IslamicUmalquraCalendar(),
      year,
      month,
      day
    );

    const gregorianDate = toCalendar(hijriDate, new GregorianCalendar());

    const gregorian = `${gregorianDate.year}-${String(gregorianDate.month).padStart(2, '0')}-${String(gregorianDate.day).padStart(2, '0')}`;
    const hijri = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
      gregorian,
      hijri,
      hijriDisplay: `${day} ${HIJRI_MONTHS_AR[month - 1]} ${year}`,
      gregorianDisplay: `${gregorianDate.day} ${GREGORIAN_MONTHS_AR[gregorianDate.month - 1]} ${gregorianDate.year}`,
    };
  } catch {
    return {
      gregorian: '',
      hijri: '',
      hijriDisplay: '',
      gregorianDisplay: '',
    };
  }
}

/**
 * Parse a date string and determine if it's Hijri or Gregorian
 */
export function parseDate(dateStr: string): DualDate | null {
  if (!dateStr) return null;

  // Try parsing as ISO date (Gregorian)
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return gregorianToHijri(date);
  }

  return null;
}

/**
 * Get current Hijri date
 */
export function getCurrentHijriDate(): DualDate {
  return gregorianToHijri(new Date());
}

/**
 * Format date for display based on locale
 */
export function formatDate(
  dateStr: string | null | undefined,
  locale: 'ar' | 'en',
  showHijri: boolean = true
): string {
  if (!dateStr) return '';

  const dualDate = parseDate(dateStr);
  if (!dualDate) return dateStr;

  if (locale === 'ar') {
    return showHijri
      ? `${dualDate.hijriDisplay} (${dualDate.gregorianDisplay})`
      : dualDate.gregorianDisplay;
  }

  // For English, show Gregorian first
  const d = new Date(dateStr);
  const formatted = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return showHijri ? `${formatted} (${dualDate.hijriDisplay})` : formatted;
}

/**
 * Calculate age from birth date
 */
export function calculateAge(
  birthDate: string | null | undefined,
  deathDate: string | null | undefined = null
): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();

  if (isNaN(birth.getTime())) return null;
  if (deathDate && isNaN(end.getTime())) return null;

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get Hijri year from Gregorian year
 */
export function getApproximateHijriYear(gregorianYear: number): number {
  // Approximate conversion: Hijri year = (Gregorian year - 622) * 1.03
  return Math.round((gregorianYear - 622) * 1.03);
}

/**
 * Generate year options for date picker
 */
export function getYearOptions(
  calendarType: CalendarType,
  startYear?: number,
  endYear?: number
): number[] {
  const currentYear = new Date().getFullYear();
  const currentHijriYear = getApproximateHijriYear(currentYear);

  if (calendarType === 'hijri') {
    const start = startYear || currentHijriYear - 150;
    const end = endYear || currentHijriYear + 5;
    return Array.from({ length: end - start + 1 }, (_, i) => end - i);
  }

  const start = startYear || currentYear - 150;
  const end = endYear || currentYear + 5;
  return Array.from({ length: end - start + 1 }, (_, i) => end - i);
}

/**
 * Get days in a month
 */
export function getDaysInMonth(
  year: number,
  month: number,
  calendarType: CalendarType
): number {
  if (calendarType === 'hijri') {
    try {
      const calendar = new IslamicUmalquraCalendar();
      // Hijri months alternate between 29 and 30 days
      // Month 12 (Dhu al-Hijjah) has 30 days in leap years
      const isLeapYear = (11 * year + 14) % 30 < 11;
      if (month === 12) {
        return isLeapYear ? 30 : 29;
      }
      return month % 2 === 1 ? 30 : 29;
    } catch {
      return 30;
    }
  }

  return new Date(year, month, 0).getDate();
}
