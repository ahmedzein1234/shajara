/**
 * useVoiceInput Hook
 * Provides voice-to-text functionality using Web Speech API
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVoiceInputOptions {
  locale?: 'ar' | 'en';
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputResult {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Speech Recognition type for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition: new () => SpeechRecognitionInterface;
  }
}

export function useVoiceInput({
  locale = 'ar',
  continuous = true,
  interimResults = true,
  onResult,
  onError,
}: UseVoiceInputOptions = {}): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 1;

      // Set language based on locale
      recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += text;
          } else {
            interimText += text;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setInterimTranscript('');
          onResult?.(finalTranscript, true);
        } else {
          setInterimTranscript(interimText);
          onResult?.(interimText, false);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = getErrorMessage(event.error, locale);
        setError(errorMessage);
        setIsListening(false);
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [locale, continuous, interimResults, onResult, onError]);

  // Update language when locale changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
    }
  }, [locale]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be running
        console.warn('Speech recognition start error:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    error,
  };
}

function getErrorMessage(error: string, locale: 'ar' | 'en'): string {
  const messages: Record<string, { ar: string; en: string }> = {
    'no-speech': {
      ar: 'لم يتم اكتشاف أي كلام. حاول مرة أخرى.',
      en: 'No speech detected. Please try again.',
    },
    'audio-capture': {
      ar: 'لم يتم العثور على ميكروفون. تأكد من توصيله.',
      en: 'No microphone found. Make sure it is connected.',
    },
    'not-allowed': {
      ar: 'تم رفض إذن الميكروفون. يرجى السماح بالوصول.',
      en: 'Microphone permission denied. Please allow access.',
    },
    'network': {
      ar: 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت.',
      en: 'Network error. Check your internet connection.',
    },
    'aborted': {
      ar: 'تم إيقاف التعرف على الصوت.',
      en: 'Speech recognition was aborted.',
    },
    'language-not-supported': {
      ar: 'اللغة غير مدعومة.',
      en: 'Language not supported.',
    },
  };

  return messages[error]?.[locale] || (locale === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
}

export default useVoiceInput;
