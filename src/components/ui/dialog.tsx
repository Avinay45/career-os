'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Dialog box */}
      <div className={cn(
        "relative w-full max-w-lg rounded-xl border border-zinc-800/80 bg-zinc-950/90 shadow-2xl p-6 text-zinc-100 z-10 glass-panel max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0">
          {title && <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>}
          <button 
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body Content */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
