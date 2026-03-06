import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg bg-card border border-border',
          'text-foreground placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
          'transition-colors',
          error && 'border-danger focus:ring-danger/50',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
