import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';
const SIZES: Record<Size, string> = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-8 h-8' };

interface RatingProps {
  value?: number;
  max?: number;
  size?: Size;
  interactive?: boolean;
  onChange?: (v: number) => void;
}

export function Rating({ value = 0, max = 5, size = 'md', interactive, onChange }: RatingProps) {
  return (
    <div className={cn('flex gap-1', interactive && 'cursor-pointer')} role="img" aria-label={`${value} de ${max} estrelas`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            aria-label={`${i + 1} estrelas`}
            className={cn(
              'p-0 bg-transparent border-0 outline-none',
              SIZES[size],
              filled ? 'text-yellow-400' : 'text-gray-600',
              interactive && 'hover:scale-110 transition-transform',
            )}
          >
            <Star className="w-full h-full" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}
