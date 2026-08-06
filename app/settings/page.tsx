'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, CheckCircle2 } from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

export default function SettingsPage() {
  const [sdkCommand] = useState('pip install pathflow');
  const [apiKey, setApiKey] = useState('pf_live_suyash_secret_9942');
  const [endpoint] = useState('http://localhost:3000/api/v1');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [authProvider, setAuthProvider] = useState('email');
  const [userEmail, setUserEmail] = useState('admin@pathflow.dev');

  const [copiedSdk, setCopiedSdk] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('pathflow_currency') as CurrencyMode;
    const savedTheme = localStorage.getItem('pathflow_theme') as 'dark' | 'light';
    const savedKey = localStorage.getItem('pathflow_api_key');
    const savedEmail = localStorage.getItem('pathflow_user_email');
    const savedProv = localStorage.getItem('pathflow_auth_provider');

    if (savedCurrency === 'INR' || savedCurrency === 'USD') setCurrency(savedCurrency);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
    if (savedKey) setApiKey(savedKey);
    if (savedEmail) setUserEmail(savedEmail);
    if (savedProv) setAuthProvider(savedProv);
  }, []);

  const handleCurrencyChange = (mode: CurrencyMode) => {
    setCurrency(mode);
    localStorage.setItem('pathflow_currency', mode);
    window.dispatchEvent(new Event('storage'));
  };

  const handleThemeChange = (mode: 'dark' | 'light') => {
    setTheme(mode);
    localStorage.setItem('pathflow_theme', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new Event('storage'));
  };

  const copyText = (text: string, type: 'sdk' | 'key' | 'endpoint') => {
    navigator.clipboard.writeText(text);
    if (type === 'sdk') {
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 2000);
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-3 space-y-4 font-mono text-xs">
      
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-[#1E1E24] pb-2.5">
        <h1 className="text-dev-title text-white font-sans uppercase">Settings</h1>
        <span className="text-xs text-zinc-500 font-mono">Theme, Currency & API Secret Configuration</span>
      </div>

      {/* Settings Table */}
      <div className="border border-[#1E1E24] rounded overflow-hidden divide-y divide-[#1E1E24]">
        
        {/* Row 1: Theme Customization (Dark vs Light - Text Only) */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F12]">
          <div className="w-40 font-bold text-white uppercase tracking-wider text-[11px]">
            Theme Mode
          </div>
          <div className="flex-1 flex items-center justify-between gap-4 bg-[#08080A] border border-[#1E1E24] rounded px-3 py-1.5">
            <span className="text-zinc-300">Choose preferred workspace appearance mode:</span>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                  theme === 'dark'
                    ? 'bg-[#16161A] text-white font-bold border-blue-500'
                    : 'bg-[#0F0F12] text-zinc-400 border-[#1E1E24] hover:text-white'
                }`}
              >
                Dark Mode
              </button>

              <button
                onClick={() => handleThemeChange('light')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                  theme === 'light'
                    ? 'bg-[#16161A] text-amber-500 font-bold border-amber-500'
                    : 'bg-[#0F0F12] text-zinc-400 border-[#1E1E24] hover:text-white'
                }`}
              >
                Light Mode
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Currency Preference (USD vs INR - Text Only) */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F12]">
          <div className="w-40 font-bold text-white uppercase tracking-wider text-[11px]">
            Currency Display
          </div>
          <div className="flex-1 flex items-center justify-between gap-4 bg-[#08080A] border border-[#1E1E24] rounded px-3 py-1.5">
            <span className="text-zinc-300">Choose preferred currency formatting across all trace cost metrics:</span>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleCurrencyChange('USD')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                  currency === 'USD'
                    ? 'bg-[#16161A] text-white font-bold border-blue-500'
                    : 'bg-[#0F0F12] text-zinc-400 border-[#1E1E24] hover:text-white'
                }`}
              >
                USD ($)
              </button>

              <button
                onClick={() => handleCurrencyChange('INR')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                  currency === 'INR'
                    ? 'bg-[#16161A] text-emerald-400 font-bold border-emerald-500'
                    : 'bg-[#0F0F12] text-zinc-400 border-[#1E1E24] hover:text-white'
                }`}
              >
                INR (₹ Rupees)
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Workspace & SSO */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F12]">
          <div className="w-40 font-bold text-white uppercase tracking-wider text-[11px]">
            Workspace & SSO
          </div>
          <div className="flex-1 flex flex-wrap items-center justify-between gap-4 bg-[#08080A] border border-[#1E1E24] rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300">Active User:</span>
              <strong className="text-white">{userEmail}</strong>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                authProvider === 'google' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : authProvider === 'github' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <CheckCircle2 className="h-3 w-3" />
                {authProvider} OAuth Active
              </span>
            </div>
          </div>
        </div>

        {/* Row 4: API Secret Key */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F12]">
          <div className="w-40 font-bold text-white uppercase tracking-wider text-[11px]">API Secret Key</div>
          <div className="flex-1 flex items-center justify-between gap-4 bg-[#08080A] border border-[#1E1E24] rounded px-3 py-1.5">
            <span className="text-zinc-300 font-mono">{apiKey}</span>
            <button onClick={() => copyText(apiKey, 'key')} className="linear-btn">
              {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedKey ? 'Copied' : 'Copy Key'}
            </button>
          </div>
        </div>

        {/* Row 5: Target Endpoint */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F12]">
          <div className="w-40 font-bold text-white uppercase tracking-wider text-[11px]">Target Endpoint</div>
          <div className="flex-1 flex items-center justify-between gap-4 bg-[#08080A] border border-[#1E1E24] rounded px-3 py-1.5">
            <span className="text-zinc-200">{endpoint}</span>
            <button onClick={() => copyText(endpoint, 'endpoint')} className="linear-btn">
              {copiedEndpoint ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedEndpoint ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Row 6: SDK Package */}
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F12]">
          <div className="w-40 font-bold text-white uppercase tracking-wider text-[11px]">SDK Install</div>
          <div className="flex-1 flex items-center justify-between gap-4 bg-[#08080A] border border-[#1E1E24] rounded px-3 py-1.5">
            <span className="text-zinc-200">{sdkCommand}</span>
            <button onClick={() => copyText(sdkCommand, 'sdk')} className="linear-btn">
              {copiedSdk ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedSdk ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
