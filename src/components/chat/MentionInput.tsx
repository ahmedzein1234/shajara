'use client';

import * as React from 'react';
import { AtSign, Loader2 } from 'lucide-react';
import { searchUsersForMention } from '@/lib/db/chat-actions';

interface MentionInputProps {
  treeId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  locale?: 'ar' | 'en';
  onSubmit?: () => void;
  rows?: number;
  maxLength?: number;
}

interface MentionSuggestion {
  id: string;
  name: string;
}

export function MentionInput({
  treeId,
  value,
  onChange,
  placeholder,
  locale = 'ar',
  onSubmit,
  rows = 1,
  maxLength,
}: MentionInputProps) {
  const isRTL = locale === 'ar';

  const [suggestions, setSuggestions] = React.useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [mentionStart, setMentionStart] = React.useState(-1);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionStart(cursorPos - query.length - 1);
      setShowSuggestions(true);
      setSelectedIndex(0);
      searchUsers(query);
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
      setMentionStart(-1);
    }
  };

  // Search for users
  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsersForMention(treeId, query);
      setSuggestions(results);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Insert mention
  const insertMention = (user: MentionSuggestion) => {
    if (mentionStart === -1) return;

    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1);
    const mention = `@[${user.name}](${user.id}) `;

    const newValue = before + mention + after;
    onChange(newValue);

    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStart(-1);

    // Focus back on input
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div className="relative" dir={isRTL ? 'rtl' : 'ltr'}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-islamic-primary resize-none"
        style={{ minHeight: rows === 1 ? '40px' : undefined }}
      />

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && (
        <div className={`absolute bottom-full mb-2 ${isRTL ? 'right-0' : 'left-0'} w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50`}>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-islamic-primary" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-sm text-slate-400 text-center">
              {locale === 'ar' ? 'لا توجد نتائج' : 'No results'}
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((user, index) => (
                <li key={user.id}>
                  <button
                    onClick={() => insertMention(user)}
                    className={`w-full px-4 py-2 text-start flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      index === selectedIndex ? 'bg-slate-100 dark:bg-slate-700' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-islamic-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-islamic-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hint */}
      <div className="absolute end-3 bottom-2 flex items-center gap-1 text-slate-400 text-xs pointer-events-none">
        <AtSign className="w-3 h-3" />
        <span>{locale === 'ar' ? 'للإشارة' : 'to mention'}</span>
      </div>
    </div>
  );
}
