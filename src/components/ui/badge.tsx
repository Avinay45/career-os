import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'blue';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors duration-200",
        {
          "bg-zinc-800 border-zinc-700 text-zinc-100": variant === 'default',
          "bg-zinc-900/50 border-zinc-800 text-zinc-400": variant === 'secondary',
          "border-zinc-700 text-zinc-300 bg-transparent": variant === 'outline',
          "bg-emerald-950/60 border-emerald-800/60 text-emerald-300": variant === 'success',
          "bg-amber-950/60 border-amber-800/60 text-amber-300": variant === 'warning',
          "bg-red-950/60 border-red-800/60 text-red-300": variant === 'destructive',
          "bg-blue-950/60 border-blue-800/60 text-blue-300": variant === 'blue',
        },
        className
      )}
      {...props}
    />
  );
}
