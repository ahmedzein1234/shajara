'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
}

const Dropdown = ({ trigger, children, align = 'start', side = 'bottom', className }: DropdownProps) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on escape
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const alignStyles = {
    start: 'start-0',
    center: 'start-1/2 -translate-x-1/2',
    end: 'end-0',
  };

  const sideStyles = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            'absolute z-50',
            'min-w-[8rem] p-1',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'rounded-lg shadow-lg',
            alignStyles[align],
            sideStyles[side],
            className
          )}
          role="menu"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                onClick: (e: React.MouseEvent) => {
                  child.props.onClick?.(e);
                  setOpen(false);
                },
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
  selected?: boolean;
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, icon, destructive = false, selected = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2',
          'text-sm text-start rounded-md',
          'transition-colors duration-150',
          destructive
            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          'disabled:opacity-50 disabled:pointer-events-none',
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1">{children}</span>
        {selected && <Check size={16} className="shrink-0" />}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

const DropdownSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        className={cn('h-px my-1 bg-slate-200 dark:bg-slate-700', className)}
        {...props}
      />
    );
  }
);

DropdownSeparator.displayName = 'DropdownSeparator';

export interface DropdownLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownLabel = React.forwardRef<HTMLDivElement, DropdownLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400',
          className
        )}
        {...props}
      />
    );
  }
);

DropdownLabel.displayName = 'DropdownLabel';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${React.useId()}`;
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {props.required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              // Base styles
              'w-full h-10 px-3 py-2 text-base',
              'bg-white dark:bg-slate-800',
              'border rounded-lg',
              'text-slate-900 dark:text-slate-100',
              // RTL support
              'dir-rtl:text-right dir-ltr:text-left',
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
              // Error state
              hasError
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600',
              // Disabled state
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900',
              // Appearance
              'appearance-none',
              'pe-10',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-slate-400">
            <ChevronDown size={16} />
          </div>
        </div>

        {error && (
          <p id={`${selectId}-error`} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel, Select };
