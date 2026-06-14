'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { signIn } from '../services/client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Password recovery is currently set as a placeholder. In production, this triggers an email verification callback.");
  };

  return (
    <Card className="w-full max-w-md glass-panel border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl relative select-none">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-white">Welcome Back</CardTitle>
        <CardDescription className="text-xs text-zinc-400 mt-1">
          Access your AI career operating workspace
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-900/60 bg-red-950/20 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Mail className="h-4 w-4" />
              </span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-4 py-2 text-xs font-semibold"
          >
            Sign In to CareerOS
          </Button>

        </form>
      </CardContent>

      <CardFooter className="flex justify-center pt-4 border-t border-zinc-900 mt-4 text-xs text-zinc-500">
        <span>Don't have an account? </span>
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 ml-1 font-medium transition-colors">
          Sign Up
        </Link>
      </CardFooter>
    </Card>
  );
}
