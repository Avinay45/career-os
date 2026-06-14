import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 relative overflow-hidden select-none">
      {/* Background neon blur shapes */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-blue-900/10 blur-[100px] z-0" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-900/10 blur-[100px] z-0" />
      
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
