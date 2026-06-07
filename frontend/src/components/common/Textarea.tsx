'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, ...rest },
  ref,
) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 bg-dark-100 border border-gray-700 rounded-lg text-white placeholder-gray-500 min-h-[100px] resize-none',
          'transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          error && 'border-red-500',
        )}
        {...rest}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
});
