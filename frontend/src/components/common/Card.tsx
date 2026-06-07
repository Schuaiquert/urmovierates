import { cn } from '@/lib/cn';

export function Card({
  children, className, hoverable = true, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return (
    <div
      className={cn(
        'bg-dark-100 rounded-xl overflow-hidden border border-white/5',
        hoverable && 'transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
