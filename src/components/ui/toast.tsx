/**
 * Toast Notification Component
 * Provides feedback for user actions with support for undo
 */

'use client';

import * as React from 'react';
import { createContext, useContext, useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  error: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  info: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Generate unique ID
function generateId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const duration = toast.duration ?? 5000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'success', title, ...options });
  }, [addToast]);

  const error = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'error', title, duration: 8000, ...options });
  }, [addToast]);

  const info = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'info', title, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'warning', title, duration: 6000, ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Individual Toast
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressRef = useRef<NodeJS.Timeout>();

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  const handleUndo = useCallback(() => {
    if (toast.onUndo) {
      toast.onUndo();
      handleRemove();
    }
  }, [toast.onUndo, handleRemove]);

  // Progress bar animation
  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = 50;
      const decrement = (100 / toast.duration) * interval;

      progressRef.current = setInterval(() => {
        setProgress((prev) => Math.max(0, prev - decrement));
      }, interval);

      return () => {
        if (progressRef.current) clearInterval(progressRef.current);
      };
    }
  }, [toast.duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  };

  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto relative overflow-hidden rounded-xl border shadow-lg',
        'animate-in slide-in-from-right-full duration-300',
        isExiting && 'animate-out slide-out-to-right-full duration-200',
        bgColors[toast.type]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{toast.description}</p>
          )}

          {toast.onUndo && (
            <button
              onClick={handleUndo}
              className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 min-h-[44px] min-w-[44px] -m-2 p-2"
            >
              {toast.undoLabel || 'Undo'}
            </button>
          )}
        </div>

        <button
          onClick={handleRemove}
          className="shrink-0 min-w-[44px] min-h-[44px] -m-2 p-2 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className={cn('h-full transition-all duration-50 ease-linear', progressColors[toast.type])}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export { ToastContext };
export type { Toast, ToastType, ToastContextType };
