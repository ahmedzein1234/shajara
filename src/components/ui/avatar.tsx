import * as React from 'react';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy' | null;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = '',
      fallback,
      size = 'md',
      variant = 'circle',
      status = null,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    const sizeStyles = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
      '2xl': 'h-24 w-24 text-2xl',
    };

    const statusSizeStyles = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4',
      '2xl': 'h-6 w-6',
    };

    const statusColorStyles = {
      online: 'bg-green-500',
      offline: 'bg-slate-400',
      away: 'bg-amber-500',
      busy: 'bg-red-500',
    };

    const variantStyles = {
      circle: 'rounded-full',
      square: 'rounded-lg',
    };

    const initials = fallback ? getInitials(fallback) : '';
    const backgroundColor = fallback ? generateAvatarColor(fallback) : '#94a3b8';

    const showImage = src && !imageError;
    const showFallback = !showImage && fallback;
    const showIcon = !showImage && !fallback;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', sizeStyles[size], className)}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden',
            'w-full h-full',
            variantStyles[variant],
            showFallback && 'text-white font-medium',
            showIcon && 'bg-slate-200 dark:bg-slate-700'
          )}
          style={showFallback ? { backgroundColor } : undefined}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : showFallback ? (
            <span>{initials}</span>
          ) : (
            <User className="w-1/2 h-1/2 text-slate-400" />
          )}
        </div>

        {status && (
          <span
            className={cn(
              'absolute bottom-0 end-0 block rounded-full',
              'ring-2 ring-white dark:ring-slate-800',
              statusSizeStyles[size],
              statusColorStyles[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarProps['size'];
  children: React.ReactElement<AvatarProps>[];
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 3, size = 'md', children, ...props }, ref) => {
    const validChildren = React.Children.toArray(children).filter(
      (child): child is React.ReactElement<AvatarProps> => React.isValidElement(child)
    );

    const displayChildren = max ? validChildren.slice(0, max) : validChildren;
    const remaining = max && validChildren.length > max ? validChildren.length - max : 0;

    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        role="group"
        aria-label="Avatar group"
        {...props}
      >
        <div className="flex -space-x-2 rtl:space-x-reverse">
          {displayChildren.map((child, index) =>
            React.cloneElement(child, {
              key: index,
              size,
              className: cn(
                'ring-2 ring-white dark:ring-slate-800',
                child.props.className
              ),
            })
          )}
          {remaining > 0 && (
            <div
              className={cn(
                'flex items-center justify-center',
                'bg-slate-200 dark:bg-slate-700',
                'text-slate-600 dark:text-slate-300',
                'ring-2 ring-white dark:ring-slate-800',
                'rounded-full font-medium',
                size === 'xs' && 'h-6 w-6 text-xs',
                size === 'sm' && 'h-8 w-8 text-sm',
                size === 'md' && 'h-10 w-10 text-base',
                size === 'lg' && 'h-12 w-12 text-lg',
                size === 'xl' && 'h-16 w-16 text-xl',
                size === '2xl' && 'h-24 w-24 text-2xl'
              )}
            >
              +{remaining}
            </div>
          )}
        </div>
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
