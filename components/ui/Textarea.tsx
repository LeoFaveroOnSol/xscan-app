import { cn } from '@/lib/utils/cn';
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg bg-card border border-border',
            'text-foreground placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            'transition-colors resize-none',
            error && 'border-danger focus:ring-danger/50',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
