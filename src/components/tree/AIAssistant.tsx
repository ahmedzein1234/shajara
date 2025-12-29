/**
 * AI Assistant Component
 * Chat-like interface for adding family members using natural language
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  User,
  AlertCircle,
  CheckCircle,
  Volume2,
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import {
  AIExtractionResult,
  ExtractedPerson,
  ExtractedRelationship,
  FamilyContext,
} from '@/lib/ai/openrouter';
import { TreeNode } from '@/types/tree';
import { Person } from '@/lib/db/schema';
import { AIPreviewModal } from './AIPreviewModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extraction?: AIExtractionResult;
  status?: 'sending' | 'success' | 'error';
}

interface AIAssistantProps {
  nodes: TreeNode[];
  selectedNode?: TreeNode | null;
  locale?: 'ar' | 'en';
  onAddPerson?: (person: Partial<Person>, relationship?: ExtractedRelationship) => void;
  onClose?: () => void;
  className?: string;
}

const EXAMPLE_PROMPTS = {
  ar: [
    { text: 'أبي محمد ولد 1960 في الرياض', short: 'أبي محمد...' },
    { text: 'جدتي فاطمة من جهة أمي توفيت 2015', short: 'جدتي فاطمة...' },
    { text: 'أخي خالد أكبر مني بسنتين', short: 'أخي خالد...' },
    { text: 'زوجتي نورة تزوجنا 2010', short: 'زوجتي نورة...' },
  ],
  en: [
    { text: 'My father Mohammed, born 1960 in Riyadh', short: 'My father...' },
    { text: 'My grandmother Fatima, passed away 2015', short: 'Grandmother...' },
    { text: 'My brother Khaled, 2 years older', short: 'My brother...' },
    { text: 'My wife Noura, married in 2010', short: 'My wife...' },
  ],
};

// Capabilities list for rich welcome
const AI_CAPABILITIES = {
  ar: [
    { icon: '✓', text: 'الأسماء (الاسم، النسب، العائلة)' },
    { icon: '✓', text: 'التواريخ (الميلاد، الوفاة، الزواج)' },
    { icon: '✓', text: 'الأماكن والمدن' },
    { icon: '✓', text: 'العلاقات العائلية' },
  ],
  en: [
    { icon: '✓', text: 'Names (given, patronymic, family)' },
    { icon: '✓', text: 'Dates (birth, death, marriage)' },
    { icon: '✓', text: 'Places and cities' },
    { icon: '✓', text: 'Family relationships' },
  ],
};

// Contextual error messages based on HTTP status
const ERROR_MESSAGES = {
  ar: {
    400: 'الطلب غير صالح. يرجى إعادة صياغة الوصف.',
    401: 'خطأ في المصادقة. يرجى تحديث الصفحة والمحاولة مرة أخرى.',
    403: 'ليس لديك صلاحية لهذا الإجراء.',
    404: 'الخدمة غير متوفرة حالياً.',
    429: 'طلبات كثيرة جداً. انتظر قليلاً ثم حاول مرة أخرى.',
    500: 'خطأ في الخادم. نحاول إصلاح المشكلة.',
    502: 'خطأ في الاتصال بالخادم. جاري إعادة المحاولة...',
    503: 'الخدمة غير متاحة مؤقتاً. جاري إعادة المحاولة...',
    504: 'انتهت مهلة الاتصال. جاري إعادة المحاولة...',
    default: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    retrying: 'جاري إعادة المحاولة... (المحاولة {attempt} من {max})',
    retryFailed: 'فشلت جميع المحاولات. يرجى المحاولة لاحقاً.',
  },
  en: {
    400: 'Invalid request. Please rephrase your description.',
    401: 'Authentication error. Please refresh and try again.',
    403: 'You don\'t have permission for this action.',
    404: 'Service not available at this time.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. We\'re working on fixing it.',
    502: 'Connection error. Retrying...',
    503: 'Service temporarily unavailable. Retrying...',
    504: 'Connection timed out. Retrying...',
    default: 'An unexpected error occurred. Please try again.',
    retrying: 'Retrying... (attempt {attempt} of {max})',
    retryFailed: 'All retry attempts failed. Please try again later.',
  },
};

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// Get contextual error message
const getErrorMessage = (status: number, locale: 'ar' | 'en'): string => {
  const messages = ERROR_MESSAGES[locale];
  return messages[status as keyof typeof messages] || messages.default;
};

// Check if error is retryable
const isRetryableError = (status: number): boolean => {
  return [408, 429, 500, 502, 503, 504].includes(status);
};

export function AIAssistant({
  nodes,
  selectedNode,
  locale = 'ar',
  onAddPerson,
  onClose,
  className,
}: AIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentExtraction, setCurrentExtraction] = useState<AIExtractionResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = locale === 'ar' ? translations.ar : translations.en;

  // Voice input hook
  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    interimTranscript,
    toggleListening,
    resetTranscript,
  } = useVoiceInput({
    locale,
    onResult: (text, isFinal) => {
      if (isFinal) {
        setInputValue(prev => prev + text);
      }
    },
  });

  // Build context from existing nodes
  const buildContext = useCallback((): FamilyContext => {
    return {
      existingPersons: nodes.map(node => ({
        id: node.id,
        name: locale === 'ar'
          ? node.person.full_name_ar || node.person.given_name
          : node.person.full_name_en || node.person.given_name,
        gender: node.person.gender,
      })),
      focusPersonId: selectedNode?.id,
      focusPersonName: selectedNode
        ? (locale === 'ar'
          ? selectedNode.person.full_name_ar || selectedNode.person.given_name
          : selectedNode.person.full_name_en || selectedNode.person.given_name)
        : undefined,
    };
  }, [nodes, selectedNode, locale]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: t.welcome,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, t.welcome]);

  // Escape key handler to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPreview) {
          setShowPreview(false);
          setCurrentExtraction(null);
        } else if (isExpanded) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPreview, isExpanded]);

  // Loading timeout warning (10 seconds)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      setLoadingTimeout(false);
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds
    } else {
      setLoadingTimeout(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Generate suggestions based on input
  useEffect(() => {
    if (inputValue.length > 2) {
      const newSuggestions: string[] = [];

      if (locale === 'ar') {
        if (inputValue.includes('أب') || inputValue.includes('والد')) {
          newSuggestions.push('هل تريد إضافة تاريخ ومكان الميلاد؟');
        }
        if (inputValue.includes('جد')) {
          newSuggestions.push('من أي جهة؟ أبوي أم أموي؟');
        }
        if (inputValue.includes('متزوج') || inputValue.includes('زوج')) {
          newSuggestions.push('هل لديكم أطفال؟');
        }
      } else {
        if (inputValue.toLowerCase().includes('father') || inputValue.toLowerCase().includes('dad')) {
          newSuggestions.push('Would you like to add birth date and place?');
        }
        if (inputValue.toLowerCase().includes('grand')) {
          newSuggestions.push('On which side? Paternal or maternal?');
        }
      }

      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, locale]);

  // Core API call with retry support
  const callExtractionAPI = useCallback(async (
    content: string,
    attempt: number = 0
  ): Promise<{ response?: Response; result?: AIExtractionResult; error?: { status: number; message: string } }> => {
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: content,
          context: buildContext(),
          locale,
        }),
      });

      if (!response.ok) {
        const status = response.status;

        // Check if we should retry
        if (isRetryableError(status) && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return callExtractionAPI(content, attempt + 1);
        }

        return { error: { status, message: getErrorMessage(status, locale) } };
      }

      const result: AIExtractionResult = await response.json();
      return { response, result };
    } catch (error) {
      // Network error - retry if possible
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callExtractionAPI(content, attempt + 1);
      }

      return { error: { status: 0, message: getErrorMessage(0, locale) } };
    }
  }, [buildContext, locale]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    resetTranscript();
    setIsLoading(true);
    setRetryCount(0);
    setIsRetrying(false);
    setSuggestions([]);

    const { result, error } = await callExtractionAPI(userMessage.content);

    if (error) {
      // Handle error with contextual message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'error' } : msg
        )
      );

      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: error.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsLoading(false);
      return;
    }

    if (result) {
      // Update user message status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? { ...msg, status: 'success' } : msg
        )
      );

      if (result.success && (result.persons.length > 0 || result.relationships.length > 0)) {
        // Show preview modal
        setCurrentExtraction(result);
        setShowPreview(true);

        // Add assistant response
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: result.raw_interpretation || t.extractionSuccess,
          timestamp: new Date(),
          extraction: result,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // No extraction or error
        const errorMessage: Message = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: result.error || t.extractionFailed,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    inputRef.current?.focus();
  };

  const handlePreviewConfirm = (
    persons: ExtractedPerson[],
    relationships: ExtractedRelationship[]
  ) => {
    // Call onAddPerson for each extracted person
    persons.forEach((person, index) => {
      const relationship = relationships[index];
      onAddPerson?.({
        given_name: person.given_name,
        patronymic_chain: person.patronymic_chain,
        family_name: person.family_name,
        gender: person.gender,
        birth_date: person.birth_date,
        birth_place: person.birth_place,
        death_date: person.death_date,
        death_place: person.death_place,
        is_living: person.is_living,
        notes: person.notes,
      }, relationship);
    });

    setShowPreview(false);
    setCurrentExtraction(null);

    // Add confirmation message
    const confirmMessage: Message = {
      id: `msg-${Date.now()}-confirm`,
      role: 'assistant',
      content: locale === 'ar'
        ? `تمت إضافة ${persons.length} شخص(أشخاص) إلى شجرة العائلة بنجاح.`
        : `Successfully added ${persons.length} person(s) to the family tree.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'fixed bottom-20 z-30',
          'bg-gradient-to-r from-heritage-turquoise to-heritage-navy',
          'text-white rounded-full p-4 shadow-islamic',
          'hover:scale-105 transition-transform',
          'flex items-center gap-2',
          'min-w-[56px] min-h-[56px]', // 48px+ touch target
          'start-4 md:start-6', // RTL-aware positioning
          className
        )}
        aria-label={locale === 'ar' ? 'فتح المساعد الذكي' : 'Open AI Assistant'}
        data-tour="ai-assistant"
      >
        <Bot size={24} />
        <Sparkles size={16} className="text-gold-200 animate-pulse" />
      </button>
    );
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-20 z-30',
          // Mobile-first responsive width
          'w-[calc(100vw-2rem)] sm:w-[400px] md:w-[420px]',
          'max-h-[calc(100vh-8rem)] md:max-h-[600px]',
          // Glassmorphism styling
          'bg-warm-100/95 backdrop-blur-xl rounded-2xl shadow-glass',
          'border border-warm-200/50 overflow-hidden',
          'flex flex-col',
          'start-4 md:start-6', // RTL-aware positioning
          'animate-slide-up', // Entrance animation
          className
        )}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        role="dialog"
        aria-label={locale === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}
        aria-modal="true"
        data-tour="ai-assistant"
      >
        {/* Header - heritage gradient */}
        <div className="bg-gradient-to-r from-heritage-turquoise to-heritage-navy text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <span className="font-semibold">{t.title}</span>
            <Sparkles size={14} className="text-gold-200" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label={locale === 'ar' ? 'تصغير' : 'Minimize'}
            >
              <ChevronDown size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages - warm background */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] bg-warm-50/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                  message.role === 'user'
                    ? 'bg-heritage-blue text-white'
                    : 'bg-gradient-to-br from-heritage-turquoise to-heritage-navy text-white'
                )}
              >
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  message.role === 'user'
                    ? 'bg-heritage-blue text-white rounded-br-sm'
                    : 'bg-warm-100 text-warm-800 shadow-card-warm border border-warm-200/50 rounded-bl-sm'
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.status === 'sending' && (
                  <Loader2 size={12} className="animate-spin mt-1 opacity-70" />
                )}
                {message.status === 'error' && (
                  <AlertCircle size={12} className="mt-1 text-red-300" />
                )}
                {message.extraction && message.extraction.confidence > 0 && (
                  <div className="mt-2 pt-2 border-t border-warm-200 text-xs text-warm-500">
                    {t.confidence}: {Math.round(message.extraction.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-heritage-turquoise to-heritage-navy text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-warm-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-card-warm border border-warm-200/50">
                <div className="flex gap-1 mb-1">
                  <span className="w-2 h-2 bg-heritage-turquoise rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-heritage-turquoise rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-heritage-turquoise rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {/* Loading timeout warning */}
                {loadingTimeout && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-2">
                    <AlertCircle size={12} />
                    <span>{t.loadingTimeout}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 bg-heritage-turquoise/5 border-t border-heritage-turquoise/20">
            <p className="text-xs text-heritage-turquoise mb-1">{t.suggestion}:</p>
            {suggestions.map((suggestion, i) => (
              <p key={i} className="text-xs text-heritage-navy">{suggestion}</p>
            ))}
          </div>
        )}

        {/* Rich welcome with capabilities (show when no messages) */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 bg-gradient-to-b from-heritage-turquoise/5 to-warm-50 border-t border-heritage-turquoise/10">
            {/* AI Capabilities */}
            <div className="mb-3">
              <p className="text-xs font-medium text-heritage-turquoise mb-2">{t.canExtract}:</p>
              <div className="grid grid-cols-2 gap-1">
                {AI_CAPABILITIES[locale].map((cap, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-warm-600">
                    <span className="text-heritage-turquoise font-bold">{cap.icon}</span>
                    <span>{cap.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Example prompts - full text */}
            <p className="text-xs font-medium text-heritage-turquoise mb-2">{t.tryAsking}:</p>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS[locale].slice(0, 2).map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example.text)}
                  className={cn(
                    'w-full text-start text-xs bg-warm-100 border border-warm-200 rounded-xl',
                    'px-3 py-2.5 min-h-[44px]', // 44px touch target
                    'hover:bg-heritage-turquoise/5 hover:border-heritage-turquoise/30 transition-colors text-warm-700',
                    'flex items-center justify-between gap-2'
                  )}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  aria-label={locale === 'ar' ? `استخدام المثال: ${example.text}` : `Use example: ${example.text}`}
                >
                  <span className="line-clamp-2">{example.text}</span>
                  <span className="text-heritage-turquoise text-[10px] shrink-0">{t.useThis}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area - warm glassmorphism */}
        <div className="p-3 bg-warm-100/80 backdrop-blur-sm border-t border-warm-200/50">
          {/* Voice transcript indicator */}
          {(isListening || interimTranscript) && (
            <div className="mb-2 px-3 py-2 bg-heritage-rose/10 rounded-lg flex items-center gap-2">
              <Volume2 size={14} className="text-heritage-rose animate-pulse" />
              <span className="text-xs text-heritage-rose">
                {interimTranscript || t.listening}
              </span>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                rows={1}
                className={cn(
                  'w-full resize-none rounded-xl border border-warm-200',
                  'px-4 py-2.5 text-sm bg-warm-50',
                  'focus:outline-none focus:ring-2 focus:ring-heritage-turquoise/50 focus:border-heritage-turquoise/30',
                  'placeholder:text-warm-400 text-warm-800',
                  'max-h-32'
                )}
                style={{ minHeight: '44px' }}
              />
            </div>

            {/* Voice input button - 48px touch target */}
            {voiceSupported && (
              <button
                onClick={toggleListening}
                className={cn(
                  'p-3 rounded-xl transition-all min-w-[48px] min-h-[48px]',
                  'flex items-center justify-center',
                  isListening
                    ? 'bg-heritage-rose text-white animate-pulse'
                    : 'bg-warm-200 text-warm-600 hover:bg-warm-300'
                )}
                aria-label={isListening ? t.stopVoice : t.startVoice}
                aria-pressed={isListening}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}

            {/* Send button - 48px touch target */}
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'p-3 rounded-xl transition-all min-w-[48px] min-h-[48px]',
                'flex items-center justify-center',
                inputValue.trim() && !isLoading
                  ? 'bg-gradient-to-r from-heritage-turquoise to-heritage-navy text-white hover:opacity-90'
                  : 'bg-warm-200 text-warm-400 cursor-not-allowed'
              )}
              aria-label={locale === 'ar' ? 'إرسال الرسالة' : 'Send message'}
              aria-disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && currentExtraction && (
        <AIPreviewModal
          extraction={currentExtraction}
          locale={locale}
          onConfirm={handlePreviewConfirm}
          onCancel={() => {
            setShowPreview(false);
            setCurrentExtraction(null);
          }}
        />
      )}
    </>
  );
}

const translations = {
  ar: {
    title: 'مساعد الذكاء الاصطناعي',
    welcome: 'مرحباً! أنا مساعدك الذكي لإضافة أفراد العائلة. صف لي الشخص الذي تريد إضافته وسأساعدك في ذلك.',
    placeholder: 'صف فرد العائلة الذي تريد إضافته...',
    examples: 'أمثلة',
    suggestion: 'اقتراح',
    confidence: 'الدقة',
    extractionSuccess: 'تم استخراج المعلومات بنجاح. راجع التفاصيل وأكد الإضافة.',
    extractionFailed: 'لم أتمكن من استخراج معلومات كافية. حاول وصف الشخص بشكل أوضح.',
    networkError: 'حدث خطأ في الاتصال. حاول مرة أخرى.',
    listening: 'جارٍ الاستماع...',
    startVoice: 'بدء الإدخال الصوتي',
    stopVoice: 'إيقاف الإدخال الصوتي',
    canExtract: 'أستطيع استخراج',
    tryAsking: 'جرب قول',
    useThis: 'استخدم',
    loadingTimeout: 'يستغرق وقتاً أطول من المعتاد. يرجى الانتظار...',
  },
  en: {
    title: 'AI Assistant',
    welcome: 'Hello! I\'m your AI assistant for adding family members. Describe the person you want to add and I\'ll help you.',
    placeholder: 'Describe the family member you want to add...',
    examples: 'Examples',
    suggestion: 'Suggestion',
    confidence: 'Confidence',
    extractionSuccess: 'Information extracted successfully. Review the details and confirm.',
    extractionFailed: 'Could not extract enough information. Try describing the person more clearly.',
    networkError: 'Connection error. Please try again.',
    listening: 'Listening...',
    startVoice: 'Start voice input',
    stopVoice: 'Stop voice input',
    canExtract: 'I can extract',
    tryAsking: 'Try saying',
    useThis: 'Use',
    loadingTimeout: 'Taking longer than usual. Please wait...',
  },
};

export default AIAssistant;
