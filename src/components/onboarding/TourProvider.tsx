/**
 * TourProvider Component
 * Manages onboarding tour state and progression
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  hasCompletedTour: boolean;
  markTourComplete: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// Default tour steps
const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="tree-view"]',
    title: 'Welcome to Your Family Tree',
    titleAr: 'مرحباً بك في شجرة عائلتك',
    content: 'This is where your family tree comes to life. You can zoom, pan, and explore your family connections.',
    contentAr: 'هنا تنبض شجرة عائلتك بالحياة. يمكنك التكبير والتصغير والتنقل واستكشاف روابط عائلتك.',
    placement: 'bottom',
  },
  {
    id: 'ai-assistant',
    target: '[data-tour="ai-assistant"]',
    title: 'AI Assistant',
    titleAr: 'المساعد الذكي',
    content: 'Need help? Our AI assistant can help you add family members, answer questions, and suggest connections.',
    contentAr: 'هل تحتاج مساعدة؟ مساعدنا الذكي يمكنه مساعدتك في إضافة أفراد العائلة والإجابة على الأسئلة واقتراح الروابط.',
    placement: 'left',
  },
  {
    id: 'navigation',
    target: '[data-tour="nav-controls"]',
    title: 'Navigation Controls',
    titleAr: 'أدوات التنقل',
    content: 'Use these controls to zoom in/out, fit the tree to screen, or reset the view.',
    contentAr: 'استخدم هذه الأدوات للتكبير والتصغير وملاءمة الشجرة للشاشة أو إعادة ضبط العرض.',
    placement: 'left',
  },
  {
    id: 'add-person',
    target: '[data-tour="add-person"]',
    title: 'Add Family Members',
    titleAr: 'إضافة أفراد العائلة',
    content: 'Click here to add new family members to your tree. You can add parents, children, or spouses.',
    contentAr: 'انقر هنا لإضافة أفراد جدد إلى شجرتك. يمكنك إضافة الوالدين أو الأبناء أو الأزواج.',
    placement: 'bottom',
  },
  {
    id: 'keyboard',
    target: '[data-tour="tree-view"]',
    title: 'Keyboard Shortcuts',
    titleAr: 'اختصارات لوحة المفاتيح',
    content: 'Press ? to see all keyboard shortcuts. Use arrow keys to navigate between family members.',
    contentAr: 'اضغط ؟ لرؤية جميع اختصارات لوحة المفاتيح. استخدم مفاتيح الأسهم للتنقل بين أفراد العائلة.',
    placement: 'bottom',
  },
];

const TOUR_STORAGE_KEY = 'shajara-tour-completed';

interface TourProviderProps {
  children: React.ReactNode;
  steps?: TourStep[];
  autoStart?: boolean;
}

export function TourProvider({ children, steps = defaultSteps, autoStart = true }: TourProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Default to true to prevent flash

  // Check if tour has been completed on mount
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(completed === 'true');

    // Auto-start tour for first-time users
    if (autoStart && completed !== 'true') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const markTourComplete = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setHasCompletedTour(true);
    endTour();
  }, [endTour]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      markTourComplete();
    }
  }, [currentStep, steps.length, markTourComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  }, [steps.length]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        hasCompletedTour,
        markTourComplete,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export { TourContext };
