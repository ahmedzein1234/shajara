'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { VoiceInput } from './VoiceInput';
import { cn } from '@/lib/utils';

interface VoiceTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  voiceLang?: string;
  dir?: 'rtl' | 'ltr';
  helperText?: string;
}

const translations = {
  ar: {
    voiceHint: 'اضغط على الميكروفون للإدخال الصوتي',
  },
  en: {
    voiceHint: 'Tap the microphone for voice input',
  },
};

export function VoiceTextField({
  value,
  onChange,
  label,
  placeholder,
  required,
  disabled,
  className,
  inputClassName,
  voiceLang,
  dir,
  helperText,
}: VoiceTextFieldProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];
  const [interimText, setInterimText] = React.useState('');

  const handleTranscript = (text: string) => {
    // Append to existing value with space
    const newValue = value ? `${value} ${text}` : text;
    onChange(newValue.trim());
    setInterimText('');
  };

  const handleInterimTranscript = (text: string) => {
    setInterimText(text);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center gap-2">
        <input
          type="text"
          value={interimText ? `${value} ${interimText}`.trim() : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          dir={dir || (locale === 'ar' ? 'rtl' : 'ltr')}
          className={cn(
            'flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all',
            interimText && 'text-slate-400 dark:text-slate-500',
            disabled && 'opacity-50 cursor-not-allowed',
            inputClassName
          )}
        />

        <VoiceInput
          onTranscript={handleTranscript}
          onInterimTranscript={handleInterimTranscript}
          lang={voiceLang || (locale === 'ar' ? 'ar-SA' : 'en-US')}
          disabled={disabled}
        />
      </div>

      {helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
