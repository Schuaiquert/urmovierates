import { Skeleton } from './Skeleton';

export function MovieCardSkeleton() {
  return (
    <div className="bg-dark-100 rounded-xl overflow-hidden border border-white/5">
      <Skeleton className="aspect-[2/3] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
