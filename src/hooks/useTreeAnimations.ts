/**
 * useTreeAnimations Hook
 * Provides smooth animation utilities for the family tree
 * Uses requestAnimationFrame for performance-optimized animations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface AnimatedValue {
  current: number;
  target: number;
  velocity: number;
}

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  precision: number;
}

const DEFAULT_SPRING: SpringConfig = {
  stiffness: 200,
  damping: 20,
  mass: 1,
  precision: 0.01,
};

/**
 * Spring animation for smooth transitions
 */
export function useSpring(
  targetValue: number,
  config: Partial<SpringConfig> = {}
): number {
  const springConfig = { ...DEFAULT_SPRING, ...config };
  const [value, setValue] = useState(targetValue);
  const animatedRef = useRef<AnimatedValue>({
    current: targetValue,
    target: targetValue,
    velocity: 0,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    animatedRef.current.target = targetValue;

    const animate = () => {
      const { stiffness, damping, mass, precision } = springConfig;
      const animated = animatedRef.current;

      // Calculate spring force
      const displacement = animated.target - animated.current;
      const springForce = stiffness * displacement;
      const dampingForce = damping * animated.velocity;
      const acceleration = (springForce - dampingForce) / mass;

      // Update velocity and position
      animated.velocity += acceleration * 0.016; // ~60fps
      animated.current += animated.velocity * 0.016;

      // Check if animation is complete
      if (
        Math.abs(displacement) < precision &&
        Math.abs(animated.velocity) < precision
      ) {
        animated.current = animated.target;
        animated.velocity = 0;
        setValue(animated.target);
        return;
      }

      setValue(animated.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, springConfig]);

  return value;
}

/**
 * Animated transform values for pan/zoom
 */
export function useAnimatedTransform(
  targetX: number,
  targetY: number,
  targetScale: number,
  config: Partial<SpringConfig> = {}
): { x: number; y: number; scale: number } {
  const x = useSpring(targetX, config);
  const y = useSpring(targetY, config);
  const scale = useSpring(targetScale, config);

  return { x, y, scale };
}

/**
 * Fade in/out animation
 */
export function useFadeIn(
  isVisible: boolean,
  duration: number = 200
): { opacity: number; isRendered: boolean } {
  const [opacity, setOpacity] = useState(isVisible ? 1 : 0);
  const [isRendered, setIsRendered] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
      // Small delay for mount
      requestAnimationFrame(() => {
        setOpacity(1);
      });
    } else {
      setOpacity(0);
      const timeout = setTimeout(() => {
        setIsRendered(false);
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, duration]);

  return { opacity, isRendered };
}

/**
 * Staggered animation for multiple items
 */
export function useStaggeredAnimation(
  itemCount: number,
  isActive: boolean,
  staggerDelay: number = 50
): number[] {
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    if (isActive) {
      setDelays(
        Array.from({ length: itemCount }, (_, i) => i * staggerDelay)
      );
    } else {
      setDelays([]);
    }
  }, [itemCount, isActive, staggerDelay]);

  return delays;
}

/**
 * Smooth scroll to element
 */
export function useSmoothScroll(): (
  targetX: number,
  targetY: number,
  scale: number,
  callback: (x: number, y: number, scale: number) => void,
  duration?: number
) => void {
  const animationRef = useRef<number | null>(null);

  const scrollTo = useCallback(
    (
      targetX: number,
      targetY: number,
      targetScale: number,
      callback: (x: number, y: number, scale: number) => void,
      duration: number = 500
    ) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const startTime = performance.now();
      let startX = 0;
      let startY = 0;
      let startScale = 1;
      let initialized = false;

      const animate = (currentTime: number) => {
        if (!initialized) {
          // Get current values from first callback
          initialized = true;
          // We'd need current values here - for now, assume smooth start
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (targetX - startX) * eased;
        const currentY = startY + (targetY - startY) * eased;
        const currentScale = startScale + (targetScale - startScale) * eased;

        callback(currentX, currentY, currentScale);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return scrollTo;
}

/**
 * Pulse animation for highlighting
 */
export function usePulse(
  isActive: boolean,
  interval: number = 1000
): number {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setPulse(0);
      return;
    }

    let startTime = performance.now();
    let rafId: number;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const phase = (elapsed % interval) / interval;
      setPulse(Math.sin(phase * Math.PI * 2) * 0.5 + 0.5);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [isActive, interval]);

  return pulse;
}

/**
 * Animated presence - handles enter/exit animations
 */
export function useAnimatedPresence<T>(
  items: T[],
  getKey: (item: T) => string,
  duration: number = 300
): {
  visibleItems: Array<{ item: T; isEntering: boolean; isExiting: boolean }>;
} {
  const [state, setState] = useState<{
    items: T[];
    exiting: Map<string, T>;
  }>({
    items: [],
    exiting: new Map(),
  });

  useEffect(() => {
    const currentKeys = new Set(items.map(getKey));
    const prevKeys = new Set(state.items.map(getKey));

    // Find items that are leaving
    const newExiting = new Map(state.exiting);
    state.items.forEach((item) => {
      const key = getKey(item);
      if (!currentKeys.has(key) && !newExiting.has(key)) {
        newExiting.set(key, item);

        // Remove after animation
        setTimeout(() => {
          setState((prev) => {
            const updated = new Map(prev.exiting);
            updated.delete(key);
            return { ...prev, exiting: updated };
          });
        }, duration);
      }
    });

    setState({
      items,
      exiting: newExiting,
    });
  }, [items, getKey, duration]);

  const visibleItems = [
    ...state.items.map((item) => ({
      item,
      isEntering: !state.exiting.has(getKey(item)),
      isExiting: false,
    })),
    ...Array.from(state.exiting.values()).map((item) => ({
      item,
      isEntering: false,
      isExiting: true,
    })),
  ];

  return { visibleItems };
}

/**
 * CSS animation classes for common transitions
 */
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

/**
 * CSS keyframes as inline styles (for dynamic use)
 */
export const animationStyles = {
  fadeIn: {
    animation: 'fadeIn 200ms ease-out forwards',
  },
  fadeOut: {
    animation: 'fadeOut 200ms ease-in forwards',
  },
  slideUp: {
    animation: 'slideUp 300ms ease-out forwards',
  },
  scaleIn: {
    animation: 'scaleIn 200ms ease-out forwards',
  },
  pulse: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
};

export default useSpring;
