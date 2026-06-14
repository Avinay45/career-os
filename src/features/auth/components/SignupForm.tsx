'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Briefcase, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { signUp } from '../services/client';

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !targetRole) return;
    
    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, fullName, targetRole);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-panel border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl relative select-none">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />

      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-white">Create Account</CardTitle>
        <CardDescription className="text-xs text-zinc-400 mt-1">
          Begin optimizing your professional pipeline
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="h-10 w-10 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Registration Successful!</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-[250px] mx-auto">
                Check your inbox for a verification link. Redirecting you to login...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border border-red-900/60 bg-red-950/20 text-red-300 text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Full Name *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="pl-9 h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Target Role *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                    <Briefcase className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Developer"
                    className="pl-9 h-8.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Email Address *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="pl-10 h-8.5 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">Password *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="pl-10 h-8.5 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-4 py-2 text-xs font-semibold"
            >
              Register & Start Planning
            </Button>

          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center pt-4 border-t border-zinc-900 mt-4 text-xs text-zinc-500">
        <span>Already have an account? </span>
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 ml-1 font-medium transition-colors">
          Log In
        </Link>
      </CardFooter>
    </Card>
  );
}
