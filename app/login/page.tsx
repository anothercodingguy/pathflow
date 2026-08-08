'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Key, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/runs';
  const errorParam = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyLoginOpen, setIsApiKeyLoginOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      console.error('Sign in error:', err);
      setIsLoading(false);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    // Set fallback session cookie for API Key developer session
    document.cookie = `authjs.session-token=${apiKey.trim()}; path=/; max-age=2592000`;
    localStorage.setItem('pathflow_api_key', apiKey.trim());
    window.location.href = callbackUrl;
  };

  return (
    <div className="w-full min-h-screen bg-[#09090B] flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* Main Auth Card Container (Max Width 440px) */}
      <main className="w-full max-w-[440px] border border-white/10 bg-[#111113] rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-200 hover:border-white/15 space-y-6">
        
        {/* Branding & Heading */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white text-base uppercase font-sans">
              PATH<span className="text-blue-500">FLOW</span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-[30px] font-bold text-white tracking-tight leading-tight font-sans">
              Sign in to PathFlow
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Execution intelligence & profiler platform for AI agents.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorParam && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>Authentication failed. Please check your Google OAuth credentials.</span>
          </div>
        )}

        {/* Primary CTA: Continue with Google */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-white hover:bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 active:scale-[0.99] transition-all duration-200 shadow-md disabled:opacity-50 font-sans cursor-pointer"
          >
            {isLoading ? (
              <span className="text-zinc-700 font-medium">Signing in with Google...</span>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Subtle Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#111113] px-3 text-xs text-zinc-500 font-medium">
            or API Key Authentication
          </span>
        </div>

        {/* API Key Developer Fallback */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsApiKeyLoginOpen(!isApiKeyLoginOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1 px-1 font-mono cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-zinc-500" />
              <span>Developer API Key Sign In</span>
            </span>
            <span className="text-[10px] text-zinc-500 uppercase">{isApiKeyLoginOpen ? 'Hide' : 'Show'}</span>
          </button>

          {isApiKeyLoginOpen && (
            <form onSubmit={handleApiKeySubmit} className="space-y-3 pt-1 text-xs font-mono">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Paste Bearer API Key (pf_live_...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/15 active:scale-[0.99] transition-all duration-200 font-sans cursor-pointer"
              >
                <span>Authenticate Session</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Security Assurance */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center space-y-1">
          <p className="text-xs text-zinc-400 font-sans flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Secure Google OAuth Authentication</span>
          </p>
          <p className="text-[11px] text-zinc-500 font-sans">
            PathFlow isolates execution telemetry and traces strictly to your account.
          </p>
        </div>

      </main>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-[#09090B] flex items-center justify-center text-zinc-400 font-sans text-xs">
        Loading Authentication...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
