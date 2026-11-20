'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Key, ArrowRight, ShieldCheck, AlertCircle, FlaskConical, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-line" />
      <span className="font-mono text-2xs uppercase tracking-wide text-ink-3">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get('callbackUrl') || '/app/runs';
  const callbackUrl = rawCallback.startsWith('/app') ? rawCallback : `/app${rawCallback.startsWith('/') ? '' : '/'}${rawCallback}`;
  const errorParam = searchParams.get('error');

  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyLoginOpen, setIsApiKeyLoginOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl, redirectTo: callbackUrl });
    } catch (err) {
      console.error('Sign in error:', err);
      setIsLoading(false);
    }
  };

  const handleDemoGuestAccess = () => {
    document.cookie = `pathflow_session=pf_demo_guest_session; path=/; max-age=2592000`;
    localStorage.setItem('pathflow_api_key', 'pf_live_secret_key');
    const targetUrl = callbackUrl.startsWith('/app') ? callbackUrl : `/app${callbackUrl.startsWith('/') ? '' : '/'}${callbackUrl}`;
    window.location.href = targetUrl;
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    // Set fallback session cookie for API Key developer session
    document.cookie = `pathflow_session=${apiKey.trim()}; path=/; max-age=2592000`;
    localStorage.setItem('pathflow_api_key', apiKey.trim());
    const targetUrl = callbackUrl.startsWith('/app') ? callbackUrl : `/app${callbackUrl.startsWith('/') ? '' : '/'}${callbackUrl}`;
    window.location.href = targetUrl;
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-canvas p-4 font-sans sm:p-8">
      <div className="w-full max-w-[420px] space-y-6 rounded-xl border border-line bg-surface p-5 shadow-2xl sm:p-7">

        {/* Branding & heading */}
        <div className="space-y-3">
          <span className="text-sm font-black uppercase tracking-tight text-ink">
            PATH<span className="text-accent">FLOW</span>
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink">Sign in to PathFlow</h1>
            <p className="text-sm leading-relaxed text-ink-2">Trace, profile and debug AI agent runs.</p>
          </div>
        </div>

        {errorParam && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-bad/30 bg-bad/10 p-3 text-xs text-bad">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Sign-in failed. Try again, or use the demo workspace below.</span>
          </div>
        )}

        {/* Demo workspace */}
        <div className="space-y-2">
          <Button variant="primary" size="lg" className="w-full" onClick={handleDemoGuestAccess}>
            <FlaskConical aria-hidden />
            Launch Instant Demo Workspace
            <ArrowRight aria-hidden />
          </Button>
          <p className="text-center text-xs leading-relaxed text-ink-2">
            No account needed. The demo workspace shows built-in sample runs, not your own data.
          </p>
        </div>

        <Divider>or sign in</Divider>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              <span>Redirecting to Google…</span>
            </>
          ) : (
            <>
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* API key sign-in */}
        <div className="space-y-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setIsApiKeyLoginOpen(!isApiKeyLoginOpen)}
            aria-expanded={isApiKeyLoginOpen}
            aria-controls="api-key-form"
            className="flex w-full items-center justify-between rounded px-1 py-1 text-xs font-medium text-ink-2 transition-colors hover:text-ink"
          >
            <span className="flex items-center gap-1.5">
              <Key className="size-3.5 text-ink-3" aria-hidden />
              Sign in with an API key
            </span>
            <ChevronDown className={`size-3.5 transition-transform ${isApiKeyLoginOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          {isApiKeyLoginOpen && (
            <form id="api-key-form" onSubmit={handleApiKeySubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="api-key">API key</Label>
                <Input
                  id="api-key"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="pf_live_…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  controlSize="lg"
                  className="font-mono"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Continue with API key
                <ArrowRight aria-hidden />
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-1 rounded-md border border-line bg-inset p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-2">
            <ShieldCheck className="size-3.5 text-ok" aria-hidden />
            <span>Secure Google OAuth Authentication</span>
          </p>
          <p className="text-2xs leading-relaxed text-ink-3">
            PathFlow isolates execution telemetry and traces strictly to your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div role="status" className="flex min-h-dvh w-full items-center justify-center bg-canvas font-sans text-xs text-ink-2">
        Loading sign-in…
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
