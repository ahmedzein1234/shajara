/**
 * CelebrationOverlay Component
 * Shows celebratory confetti and messages for family tree milestones
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Heart, Users, TreeDeciduous, BookOpen, Camera } from 'lucide-react';

export type MilestoneType =
  | 'first_person'
  | 'ten_people'
  | 'five_generations'
  | 'first_story'
  | 'first_photo'
  | 'hundred_people';

interface CelebrationOverlayProps {
  milestone: MilestoneType;
  locale?: 'ar' | 'en';
  onComplete?: () => void;
  personCount?: number;
  generationCount?: number;
}

// Heritage-inspired confetti colors
const CONFETTI_COLORS = [
  '#D4AF37', // Gold
  '#B85C3C', // Terracotta
  '#1B7F7E', // Heritage turquoise
  '#B85C6C', // Heritage rose
  '#2B5B84', // Heritage blue
  '#FAF8F5', // Warm cream
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'star';
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    duration: Math.random() * 2 + 2,
    shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'star',
  }));
}

export function CelebrationOverlay({
  milestone,
  locale = 'ar',
  onComplete,
  personCount,
  generationCount,
}: CelebrationOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const t = locale === 'ar' ? translations.ar : translations.en;

  useEffect(() => {
    // Generate confetti on mount
    setConfetti(generateConfetti(50));

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  }, [onComplete]);

  const getMilestoneContent = () => {
    switch (milestone) {
      case 'first_person':
        return {
          icon: <TreeDeciduous size={48} className="text-heritage-turquoise" />,
          title: t.firstPerson.title,
          message: t.firstPerson.message,
          emoji: '🌱',
        };
      case 'ten_people':
        return {
          icon: <Users size={48} className="text-heritage-turquoise" />,
          title: t.tenPeople.title,
          message: t.tenPeople.message.replace('{count}', String(personCount || 10)),
          emoji: '🌳',
        };
      case 'five_generations':
        return {
          icon: <Sparkles size={48} className="text-gold-300" />,
          title: t.fiveGenerations.title,
          message: t.fiveGenerations.message.replace('{count}', String(generationCount || 5)),
          emoji: '✨',
        };
      case 'first_story':
        return {
          icon: <BookOpen size={48} className="text-heritage-rose" />,
          title: t.firstStory.title,
          message: t.firstStory.message,
          emoji: '📖',
        };
      case 'first_photo':
        return {
          icon: <Camera size={48} className="text-heritage-blue" />,
          title: t.firstPhoto.title,
          message: t.firstPhoto.message,
          emoji: '📷',
        };
      case 'hundred_people':
        return {
          icon: <Heart size={48} className="text-heritage-terracotta" />,
          title: t.hundredPeople.title,
          message: t.hundredPeople.message,
          emoji: '💯',
        };
      default:
        return {
          icon: <Sparkles size={48} className="text-gold-300" />,
          title: t.generic.title,
          message: t.generic.message,
          emoji: '🎉',
        };
    }
  };

  const content = getMilestoneContent();

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/30 backdrop-blur-sm',
        'animate-fade-in'
      )}
      onClick={handleDismiss}
      role="alert"
      aria-live="polite"
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              top: '-20px',
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          >
            {piece.shape === 'circle' && (
              <div
                className="rounded-full"
                style={{
                  width: piece.size,
                  height: piece.size,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                }}
              />
            )}
            {piece.shape === 'square' && (
              <div
                className="rotate-45"
                style={{
                  width: piece.size,
                  height: piece.size,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                }}
              />
            )}
            {piece.shape === 'star' && (
              <svg
                width={piece.size * 2}
                height={piece.size * 2}
                viewBox="0 0 24 24"
                fill={piece.color}
                style={{ transform: `rotate(${piece.rotation}deg)` }}
              >
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Main celebration card */}
      <div
        className={cn(
          'relative bg-warm-100 rounded-3xl shadow-2xl p-8 max-w-md mx-4',
          'border-2 border-gold-300/50',
          'animate-scale-in',
          'text-center'
        )}
        onClick={(e) => e.stopPropagation()}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 bg-gradient-to-br from-gold-200 to-gold-400 rounded-full flex items-center justify-center shadow-gold-glow">
            <span className="text-4xl">{content.emoji}</span>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>

          {/* Title */}
          <h2 className={cn(
            'text-2xl font-bold mb-3',
            'text-warm-800',
            locale === 'ar' && 'font-display'
          )}>
            {content.title}
          </h2>

          {/* Message */}
          <p className={cn(
            'text-warm-600 leading-relaxed mb-6',
            locale === 'ar' && 'leading-arabic'
          )}>
            {content.message}
          </p>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'px-6 py-3 rounded-xl',
              'bg-gradient-to-r from-heritage-turquoise to-heritage-turquoise/80',
              'text-white font-medium',
              'hover:scale-105 active:scale-95',
              'transition-transform duration-200',
              'shadow-islamic',
              'min-h-[48px]'
            )}
          >
            {t.continue}
          </button>
        </div>

        {/* Decorative sparkles */}
        <Sparkles
          size={20}
          className="absolute top-8 left-8 text-gold-300 animate-float"
        />
        <Sparkles
          size={16}
          className="absolute top-12 right-6 text-gold-400 animate-float"
          style={{ animationDelay: '0.5s' }}
        />
        <Sparkles
          size={14}
          className="absolute bottom-12 left-6 text-heritage-turquoise/50 animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

const translations = {
  ar: {
    continue: 'متابعة',
    firstPerson: {
      title: 'بدأت شجرة عائلتك!',
      message: 'أول خطوة في حفظ تراث عائلتك. كل رحلة تبدأ بخطوة واحدة.',
    },
    tenPeople: {
      title: 'شجرتك تنمو!',
      message: 'أضفت {count} أفراد من عائلتك. تاريخ عائلتك يُحفظ للأجيال القادمة.',
    },
    fiveGenerations: {
      title: 'إرث عظيم!',
      message: '{count} أجيال من العائلة موثقة. جذورك تمتد عميقاً في التاريخ.',
    },
    firstStory: {
      title: 'ذكرى محفوظة!',
      message: 'أضفت أول قصة عائلية. القصص تحيي الذكريات للأبد.',
    },
    firstPhoto: {
      title: 'لحظة خالدة!',
      message: 'أضفت أول صورة. الصور تحفظ اللحظات الثمينة.',
    },
    hundredPeople: {
      title: 'عائلة كبيرة!',
      message: 'مئة فرد من العائلة! تاريخ غني يستحق الحفظ.',
    },
    generic: {
      title: 'إنجاز رائع!',
      message: 'شكراً لحفظ تراث عائلتك.',
    },
  },
  en: {
    continue: 'Continue',
    firstPerson: {
      title: 'Your Family Tree Has Begun!',
      message: 'The first step in preserving your family heritage. Every journey begins with a single step.',
    },
    tenPeople: {
      title: 'Your Tree Is Growing!',
      message: 'You\'ve added {count} family members. Your family history is being preserved for future generations.',
    },
    fiveGenerations: {
      title: 'A Great Legacy!',
      message: '{count} generations of family documented. Your roots run deep in history.',
    },
    firstStory: {
      title: 'A Memory Preserved!',
      message: 'You\'ve added your first family story. Stories keep memories alive forever.',
    },
    firstPhoto: {
      title: 'A Timeless Moment!',
      message: 'You\'ve added your first photo. Photos preserve precious moments.',
    },
    hundredPeople: {
      title: 'A Big Family!',
      message: 'One hundred family members! A rich history worth preserving.',
    },
    generic: {
      title: 'Wonderful Achievement!',
      message: 'Thank you for preserving your family heritage.',
    },
  },
};

export default CelebrationOverlay;
