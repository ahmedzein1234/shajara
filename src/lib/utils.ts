import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS class deduplication
 * @param inputs - Class names to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an Arabic name with patronymic chain
 * Example: "محمد بن أحمد بن علي"
 * @param firstName - First name
 * @param patronymicChain - Array of ancestor names
 * @param locale - Current locale ('ar' or 'en')
 * @returns Formatted full name
 */
export function formatArabicName(
  firstName: string,
  patronymicChain: string[] = [],
  locale: 'ar' | 'en' = 'ar'
): string {
  if (patronymicChain.length === 0) {
    return firstName;
  }

  const connector = locale === 'ar' ? 'بن' : 'bin';
  const parts = [firstName, ...patronymicChain];

  return parts.join(` ${connector} `);
}

/**
 * Formats a date in Arabic or English with optional Hijri calendar support
 * @param date - Date to format
 * @param locale - Current locale ('ar' or 'en')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale: 'ar' | 'en' = 'ar',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(dateObj);
}

/**
 * Formats a date in Hijri calendar
 * @param date - Date to format
 * @param locale - Current locale ('ar' or 'en')
 * @returns Formatted Hijri date string
 */
export function formatHijriDate(
  date: Date | string | number,
  locale: 'ar' | 'en' = 'ar'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    calendar: 'islamic-umalqura',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Truncates text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Gets initials from a name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Validates Arabic text
 * @param text - Text to validate
 * @returns True if text contains Arabic characters
 */
export function isArabicText(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

/**
 * Generates a random color for avatars
 * @param seed - Seed for color generation (e.g., user ID or name)
 * @returns Hex color code
 */
export function generateAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];

  return colors[Math.abs(hash) % colors.length];
}
