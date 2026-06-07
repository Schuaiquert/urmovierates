import { cn } from '@/lib/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className }: { size?: SpinnerSize; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn(
        'rounded-full animate-spin border-gray-700 border-t-primary-500',
        SIZES[size],
        className,
      )}
    />
  );
}
