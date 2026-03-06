import { cn } from '@/lib/utils/cn';
import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-muted/20 text-muted-foreground',
      success: 'bg-success-muted text-success',
      danger: 'bg-danger-muted text-danger',
      warning: 'bg-warning-muted text-warning',
      primary: 'bg-primary/20 text-primary',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
