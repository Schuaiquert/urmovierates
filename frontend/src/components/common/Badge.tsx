import { cn } from '@/lib/cn';

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-gray-700 text-gray-300',
  primary: 'bg-primary-600/20 text-primary-400',
  success: 'bg-green-600/20 text-green-400',
  warning: 'bg-yellow-600/20 text-yellow-400',
  error: 'bg-red-600/20 text-red-400',
};

export function Badge({
  children, variant = 'default', className,
}: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
