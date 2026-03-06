import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export default function Avatar({ src, alt = 'Avatar', size = 'md', className }: AvatarProps) {
  if (!src) {
    return (
      <div
        className={cn(
          'rounded-full bg-card border border-border flex items-center justify-center',
          sizes[size],
          className
        )}
      >
        <User className={cn('text-muted', iconSizes[size])} />
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden bg-card', sizes[size], className)}>
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    </div>
  );
}
