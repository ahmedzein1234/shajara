'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  type CalendarType,
  gregorianToHijri,
  hijriToGregorian,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
  GREGORIAN_MONTHS_AR,
  getYearOptions,
  getDaysInMonth,
  getApproximateHijriYear,
} from '@/lib/date-utils';

export interface DualDatePickerProps {
  value?: string; // ISO date string
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxDate?: string;
  minDate?: string;
}

const translations = {
  ar: {
    gregorian: 'ميلادي',
    hijri: 'هجري',
    year: 'السنة',
    month: 'الشهر',
    day: 'اليوم',
    selectYear: 'اختر السنة',
    selectMonth: 'اختر الشهر',
    selectDay: 'اختر اليوم',
  },
  en: {
    gregorian: 'Gregorian',
    hijri: 'Hijri',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    selectYear: 'Select year',
    selectMonth: 'Select month',
    selectDay: 'Select day',
  },
};

const GREGORIAN_MONTHS_EN = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

export function DualDatePicker({
  value,
  onChange,
  label,
  required,
  disabled,
  className,
}: DualDatePickerProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];

  const currentYear = new Date().getFullYear();
  const currentHijriYear = getApproximateHijriYear(currentYear);

  const [calendarType, setCalendarType] = React.useState<CalendarType>(
    locale === 'ar' ? 'hijri' : 'gregorian'
  );
  const [year, setYear] = React.useState<number | ''>('');
  const [month, setMonth] = React.useState<number | ''>('');
  const [day, setDay] = React.useState<number | ''>('');

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        if (calendarType === 'gregorian') {
          setYear(date.getFullYear());
          setMonth(date.getMonth() + 1);
          setDay(date.getDate());
        } else {
          const dualDate = gregorianToHijri(date);
          const parts = dualDate.hijri.split('-').map(Number);
          setYear(parts[0]);
          setMonth(parts[1]);
          setDay(parts[2]);
        }
      }
    } else {
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value, calendarType]);

  // Update value when date parts change
  const handleDateChange = (
    newYear: number | '',
    newMonth: number | '',
    newDay: number | ''
  ) => {
    setYear(newYear);
    setMonth(newMonth);
    setDay(newDay);

    if (newYear && newMonth && newDay) {
      if (calendarType === 'gregorian') {
        const date = new Date(newYear, newMonth - 1, newDay);
        if (!isNaN(date.getTime())) {
          onChange(date.toISOString().split('T')[0]);
        }
      } else {
        const dualDate = hijriToGregorian(newYear, newMonth, newDay);
        if (dualDate.gregorian) {
          onChange(dualDate.gregorian);
        }
      }
    }
  };

  const handleCalendarTypeChange = (type: CalendarType) => {
    setCalendarType(type);
    // Keep the same date, just change display
    if (value && year && month && day) {
      // Value stays the same, just update display
    }
  };

  const months = calendarType === 'hijri'
    ? (locale === 'ar' ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN)
    : (locale === 'ar' ? GREGORIAN_MONTHS_AR : GREGORIAN_MONTHS_EN);

  const years = getYearOptions(calendarType);
  const days = year && month
    ? Array.from({ length: getDaysInMonth(year, month, calendarType) }, (_, i) => i + 1)
    : [];

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      {/* Calendar Type Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 w-fit">
        <button
          type="button"
          onClick={() => handleCalendarTypeChange('hijri')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium transition-colors',
            calendarType === 'hijri'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          )}
          disabled={disabled}
        >
          {t.hijri}
        </button>
        <button
          type="button"
          onClick={() => handleCalendarTypeChange('gregorian')}
          className={cn(
            'px-4 py-1.5 text-sm font-medium transition-colors',
            calendarType === 'gregorian'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          )}
          disabled={disabled}
        >
          {t.gregorian}
        </button>
      </div>

      {/* Date Selects */}
      <div className="grid grid-cols-3 gap-3">
        {/* Day */}
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t.day}
          </label>
          <div className="relative">
            <select
              value={day}
              onChange={(e) => handleDateChange(year, month, e.target.value ? Number(e.target.value) : '')}
              disabled={disabled || !year || !month}
              className={cn(
                'w-full h-10 px-3 py-2 text-sm appearance-none',
                'bg-white dark:bg-slate-800',
                'border border-slate-300 dark:border-slate-600 rounded-lg',
                'text-slate-900 dark:text-slate-100',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'pe-8'
              )}
            >
              <option value="">{t.selectDay}</option>
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Month */}
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t.month}
          </label>
          <div className="relative">
            <select
              value={month}
              onChange={(e) => handleDateChange(year, e.target.value ? Number(e.target.value) : '', '')}
              disabled={disabled || !year}
              className={cn(
                'w-full h-10 px-3 py-2 text-sm appearance-none',
                'bg-white dark:bg-slate-800',
                'border border-slate-300 dark:border-slate-600 rounded-lg',
                'text-slate-900 dark:text-slate-100',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'pe-8'
              )}
            >
              <option value="">{t.selectMonth}</option>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Year */}
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t.year}
          </label>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => handleDateChange(e.target.value ? Number(e.target.value) : '', '', '')}
              disabled={disabled}
              className={cn(
                'w-full h-10 px-3 py-2 text-sm appearance-none',
                'bg-white dark:bg-slate-800',
                'border border-slate-300 dark:border-slate-600 rounded-lg',
                'text-slate-900 dark:text-slate-100',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'pe-8'
              )}
            >
              <option value="">{t.selectYear}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Display both dates */}
      {value && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>
            {(() => {
              const dualDate = gregorianToHijri(value);
              return calendarType === 'hijri'
                ? `${dualDate.hijriDisplay} = ${dualDate.gregorianDisplay}`
                : `${dualDate.gregorianDisplay} = ${dualDate.hijriDisplay}`;
            })()}
          </span>
        </div>
      )}
    </div>
  );
}
