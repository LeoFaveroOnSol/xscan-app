import { cn } from '@/lib/utils/cn';
import { formatMultiplier } from '@/lib/utils/formatters';
import { getMultiplierColor } from '@/lib/utils/calculations';

interface MultiplierBadgeProps {
  value: number;
  showPlus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function MultiplierBadge({
  value,
  showPlus = false,
  size = 'md',
  className,
}: MultiplierBadgeProps) {
  const colorClass = getMultiplierColor(value);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const bgOpacity = value >= 2 ? 'bg-current/10' : 'bg-current/5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md',
        colorClass,
        bgOpacity,
        sizeClasses[size],
        className
      )}
    >
      {showPlus && value > 0 && '+'}
      {formatMultiplier(value)}
    </span>
  );
}
