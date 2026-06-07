import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gradient-to-r from-gray-700/60 via-gray-600/40 to-gray-700/60 bg-[length:200%_100%] animate-shimmer', className)} />;
}
