'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRight, Check, Key } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('suyash@pathflow.dev');
  const [password, setPassword] = useState('••••••••••••');
  const [apiKey, setApiKey] = useState('pf_live_suyash_secret_9942');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [isDeveloperFormOpen, setIsDeveloperFormOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    setOauthLoading(provider);

    const userEmail = provider === 'google' ? 'suyash.google@pathflow.dev' : 'suyash.github@pathflow.dev';
    const oauthKey = `pf_live_${provider}_${Date.now().toString().slice(-6)}`;

    setTimeout(() => {
      localStorage.setItem('pathflow_api_key', oauthKey);
      localStorage.setItem('pathflow_auth_provider', provider);
      localStorage.setItem('pathflow_user_email', userEmail);
      document.cookie = `pathflow_session=${oauthKey}; path=/; max-age=2592000`;

      setOauthLoading(null);
      setSaved(true);
      setTimeout(() => {
        router.push('/runs');
      }, 300);
    }, 600);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    localStorage.setItem('pathflow_api_key', apiKey);
    localStorage.setItem('pathflow_auth_provider', 'email');
    localStorage.setItem('pathflow_user_email', email);
    document.cookie = `pathflow_session=${apiKey}; path=/; max-age=2592000`;

    setTimeout(() => {
      setIsLoading(false);
      setSaved(true);
      setTimeout(() => {
        router.push('/runs');
      }, 300);
    }, 500);
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
              Track, inspect and optimize AI agent execution.
            </p>
          </div>
        </div>

        {/* Primary & Secondary Authentication Buttons */}
        <div className="space-y-2.5">
          
          {/* Primary CTA: Continue with Google */}
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthLoading !== null || isLoading}
            className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 active:scale-[0.99] transition-all duration-200 shadow-md disabled:opacity-50 font-sans cursor-pointer"
          >
            {oauthLoading === 'google' ? (
              <span className="text-white/90">Authorizing with Google...</span>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 text-white" /> Authenticated
              </>
            ) : (
              <span>Continue with Google</span>
            )}
          </button>

          {/* Secondary CTA: Continue with GitHub */}
          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            disabled={oauthLoading !== null || isLoading}
            className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 font-sans cursor-pointer"
          >
            {oauthLoading === 'github' ? (
              <span className="text-zinc-300">Authorizing with GitHub...</span>
            ) : (
              <span>Continue with GitHub</span>
            )}
          </button>

        </div>

        {/* Subtle Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#111113] px-3 text-xs text-zinc-500 font-medium">
            or continue with API Key
          </span>
        </div>

        {/* Expandable Advanced Section: Developer Authentication */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsDeveloperFormOpen(!isDeveloperFormOpen)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-1 font-mono cursor-pointer"
          >
            <span>Developer Authentication</span>
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isDeveloperFormOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDeveloperFormOpen && (
            <form onSubmit={handleFormLogin} className="space-y-3.5 pt-1 text-xs font-mono">
              
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Developer Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block flex justify-between">
                  <span>Bearer API Key</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 pl-9 pr-3.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || oauthLoading !== null}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/15 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 font-sans cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Authenticate Session</span> <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

            </form>
          )}
        </div>

        {/* SDK Helper Info */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center space-y-1">
          <p className="text-xs text-zinc-400 font-sans">
            Need to authenticate an SDK?
          </p>
          <p className="text-[11px] text-zinc-500 font-sans">
            Generate or paste an API key after signing in under <strong className="text-zinc-300">Settings → API Keys</strong>.
          </p>
        </div>

      </main>

    </div>
  );
}
