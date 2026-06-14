import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          {
            // Primary: bright blue glow in dark mode
            "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/20 active:scale-98": variant === 'primary',
            // Secondary: glass border gray background
            "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border border-zinc-700/50 active:scale-98": variant === 'secondary',
            // Outline: transparent with light border
            "bg-transparent border border-zinc-700 hover:bg-zinc-800 text-zinc-300 hover:text-white": variant === 'outline',
            // Ghost: completely flat until hover
            "bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100": variant === 'ghost',
            // Destructive: warning red
            "bg-red-900/80 hover:bg-red-800/80 border border-red-700/50 text-red-100": variant === 'destructive',
            // Glow: linear gradient border and glowing hover (Cursor style)
            "bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700 shadow-sm relative after:absolute after:inset-[-1px] after:bg-gradient-to-r after:from-blue-500 after:to-indigo-500 after:rounded-md after:z-[-1] after:opacity-0 hover:after:opacity-100 after:transition-opacity duration-300 hover:shadow-blue-500/10 hover:shadow-lg": variant === 'glow',
          },
          {
            "px-3 py-1.5 text-xs": size === 'sm',
            "px-4 py-2 text-sm": size === 'md',
            "px-6 py-3 text-base": size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
