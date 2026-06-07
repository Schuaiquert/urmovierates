import { Spinner } from '@/components/common/Spinner';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        <div className="aspect-[2/3] bg-dark-300 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-2/3 bg-dark-300 rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-dark-300 rounded animate-pulse" />
          <div className="h-24 bg-dark-300 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
