'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  className?: string;
  disabled?: boolean;
  lang?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
}

// Use type assertion with window for SpeechRecognition API
type SpeechRecognitionConstructor = new () => ISpeechRecognition;

const translations = {
  ar: {
    startRecording: 'اضغط للتحدث',
    stopRecording: 'اضغط للإيقاف',
    listening: 'جاري الاستماع...',
    notSupported: 'التعرف الصوتي غير مدعوم في هذا المتصفح',
    noPermission: 'يرجى السماح بالوصول إلى الميكروفون',
  },
  en: {
    startRecording: 'Tap to speak',
    stopRecording: 'Tap to stop',
    listening: 'Listening...',
    notSupported: 'Speech recognition not supported in this browser',
    noPermission: 'Please allow microphone access',
  },
};

export function VoiceInput({
  onTranscript,
  onInterimTranscript,
  className,
  disabled,
  lang,
}: VoiceInputProps) {
  const locale = useLocale() as 'ar' | 'en';
  const t = translations[locale];
  const recognitionRef = React.useRef<ISpeechRecognition | null>(null);

  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Check for speech recognition support
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
    }
  }, []);

  const startListening = React.useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition as SpeechRecognitionConstructor;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor() as ISpeechRecognition;
    recognitionRef.current = recognition;

    // Configure for Arabic or English
    recognition.lang = lang || (locale === 'ar' ? 'ar-SA' : 'en-US');
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: Event) => {
      setIsListening(false);
      const errorEvent = event as { error?: string };
      if (errorEvent.error === 'not-allowed') {
        setError(t.noPermission);
      } else if (errorEvent.error === 'no-speech') {
        // Silent, just retry
      } else {
        setError(String(errorEvent.error || 'Unknown error'));
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript && onInterimTranscript) {
        onInterimTranscript(interimTranscript);
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setError(t.notSupported);
    }
  }, [locale, lang, onTranscript, onInterimTranscript, t]);

  const stopListening = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          'p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
          className
        )}
        title={t.notSupported}
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={cn(
          'p-3 rounded-xl transition-all duration-200',
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title={isListening ? t.stopRecording : t.startRecording}
      >
        {isListening ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -top-8 start-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            {t.listening}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute -bottom-6 start-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
