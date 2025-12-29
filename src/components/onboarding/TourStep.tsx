/**
 * TourStep Component
 * Renders the spotlight and tooltip for each tour step
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTour } from './TourProvider';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

interface TourOverlayProps {
  locale?: 'ar' | 'en';
}

export function TourOverlay({ locale = 'ar' }: TourOverlayProps) {
  const { isActive, currentStep, steps, nextStep, prevStep, endTour, markTourComplete } = useTour();
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const [mounted, setMounted] = useState(false);

  const step = steps[currentStep];
  const isRtl = locale === 'ar';
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate target element position
  const calculatePositions = useCallback(() => {
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      // If target not found, show tooltip in center
      setTargetPosition(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 175,
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = step.spotlightPadding ?? 8;

    setTargetPosition({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding + window.scrollX,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on placement
    const tooltipWidth = 350;
    const tooltipHeight = 200;
    const gap = 16;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (step.placement) {
      case 'top':
        tooltipTop = rect.top + window.scrollY - tooltipHeight - gap;
        tooltipLeft = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        tooltipTop = rect.bottom + window.scrollY + gap;
        tooltipLeft = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.left + window.scrollX - tooltipWidth - gap;
        break;
      case 'right':
        tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.right + window.scrollX + gap;
        break;
      default:
        tooltipTop = rect.bottom + window.scrollY + gap;
        tooltipLeft = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
    }

    // Keep tooltip within viewport
    tooltipTop = Math.max(16, Math.min(tooltipTop, window.innerHeight - tooltipHeight - 16));
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
  }, [step]);

  // Recalculate on step change or window resize
  useEffect(() => {
    if (!isActive) return;

    calculatePositions();

    window.addEventListener('resize', calculatePositions);
    window.addEventListener('scroll', calculatePositions);

    return () => {
      window.removeEventListener('resize', calculatePositions);
      window.removeEventListener('scroll', calculatePositions);
    };
  }, [isActive, currentStep, calculatePositions]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          endTour();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!isRtl) nextStep();
          else prevStep();
          break;
        case 'ArrowLeft':
          if (!isRtl) prevStep();
          else nextStep();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isRtl, nextStep, prevStep, endTour]);

  if (!mounted || !isActive || !step) return null;

  const title = isRtl ? step.titleAr : step.title;
  const content = isRtl ? step.contentAr : step.content;

  const overlay = (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label={isRtl ? 'جولة تعريفية' : 'Onboarding tour'}>
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetPosition && (
              <rect
                x={targetPosition.left}
                y={targetPosition.top}
                width={targetPosition.width}
                height={targetPosition.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {targetPosition && (
        <div
          className="absolute pointer-events-none rounded-lg ring-4 ring-emerald-400 ring-opacity-80 animate-pulse"
          style={{
            top: targetPosition.top,
            left: targetPosition.left,
            width: targetPosition.width,
            height: targetPosition.height,
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          className={cn(
            'absolute z-10 w-[350px] bg-white rounded-2xl shadow-2xl',
            'border border-gray-200 overflow-hidden',
            'animate-in fade-in-0 zoom-in-95 duration-300',
          )}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className={cn('text-lg font-bold text-white', isRtl && 'font-arabic')}>
                {title}
              </h3>
            </div>
            <button
              onClick={endTour}
              className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-white/80 hover:text-white transition-colors rounded-lg"
              aria-label={isRtl ? 'إغلاق الجولة' : 'Close tour'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <p className={cn('text-gray-600 leading-relaxed', isRtl && 'font-arabic')}>
              {content}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    index === currentStep
                      ? 'bg-emerald-500 w-4'
                      : index < currentStep
                      ? 'bg-emerald-300'
                      : 'bg-gray-300'
                  )}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  className={cn(
                    'min-w-[44px] min-h-[44px] px-4 flex items-center justify-center gap-1.5',
                    'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors',
                    'text-sm font-medium'
                  )}
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  {isRtl ? 'السابق' : 'Back'}
                </button>
              )}
              <button
                onClick={isLastStep ? markTourComplete : nextStep}
                className={cn(
                  'min-w-[44px] min-h-[44px] px-4 flex items-center justify-center gap-1.5',
                  'bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors',
                  'text-sm font-medium'
                )}
              >
                {isLastStep
                  ? (isRtl ? 'انتهاء' : 'Finish')
                  : (isRtl ? 'التالي' : 'Next')}
                {!isLastStep && (isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={markTourComplete}
        className={cn(
          'fixed bottom-6 min-h-[44px] px-4 py-2',
          'bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20',
          'rounded-full text-sm font-medium transition-colors',
          isRtl ? 'left-6' : 'right-6'
        )}
      >
        {isRtl ? 'تخطي الجولة' : 'Skip tour'}
      </button>
    </div>
  );

  return createPortal(overlay, document.body);
}

// Re-export button component to trigger tour manually
interface TourTriggerButtonProps {
  locale?: 'ar' | 'en';
  className?: string;
}

export function TourTriggerButton({ locale = 'ar', className }: TourTriggerButtonProps) {
  const { startTour, hasCompletedTour } = useTour();
  const isRtl = locale === 'ar';

  return (
    <button
      onClick={startTour}
      className={cn(
        'min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-2',
        'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors',
        'text-sm font-medium',
        className
      )}
      aria-label={isRtl ? 'بدء الجولة التعريفية' : 'Start tour'}
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">{isRtl ? 'جولة تعريفية' : 'Tour'}</span>
    </button>
  );
}
