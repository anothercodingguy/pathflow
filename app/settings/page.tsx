'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Key, Terminal, Server, FolderGit2, Moon, Sun, DollarSign } from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api_keys' | 'sdk' | 'endpoints' | 'workspace' | 'theme'>('api_keys');
  const [sdkCommand] = useState('pip install pathflow');
  const [apiKey, setApiKey] = useState('pf_live_suyash_secret_9942');
  const [endpoint] = useState('http://localhost:3000/api/v1');
  const [defaultProject, setDefaultProject] = useState('backend-agents');
  const [defaultEnv, setDefaultEnv] = useState('production');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [userEmail, setUserEmail] = useState('admin@pathflow.dev');

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('pathflow_currency') as CurrencyMode;
    const savedTheme = localStorage.getItem('pathflow_theme') as 'dark' | 'light';
    const savedKey = localStorage.getItem('pathflow_api_key');
    const savedEmail = localStorage.getItem('pathflow_user_email');

    if (savedCurrency === 'INR' || savedCurrency === 'USD') setCurrency(savedCurrency);
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    if (savedKey) setApiKey(savedKey);
    if (savedEmail) setUserEmail(savedEmail);
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

  const copyText = (text: string, type: 'sdk' | 'key' | 'endpoint' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'sdk') {
      setCopiedSdk(true);
      setTimeout(() => setCopiedSdk(false), 2000);
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'endpoint') {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const pythonSnippet = `from pathflow import PathFlow

pf = PathFlow(api_key="${apiKey}")

@pf.trace("Customer Support Agent", project="${defaultProject}", env="${defaultEnv}")
def run():
    # Your LLM / Tool execution code here
    pass

run()`;

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-3 space-y-4 font-mono text-xs">
      
      {/* Header Bar */}
      <div className="flex items-baseline justify-between border-b border-[#1E1E24] pb-2.5">
        <h1 className="text-dev-title text-white font-sans uppercase">Settings</h1>
        <span className="text-xs text-zinc-500 font-mono">
          Developer API Keys, SDK Telemetry Setup & Workspace Preferences
        </span>
      </div>

      {/* DevTools Settings Layout (Navigation Tabs + Settings Card) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Left Navigation Tabs (3 Columns) */}
        <div className="md:col-span-3 space-y-1">
          <button
            onClick={() => setActiveTab('api_keys')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'api_keys'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-blue-400" />
            API Keys & Auth Secrets
          </button>

          <button
            onClick={() => setActiveTab('sdk')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'sdk'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
            SDK Setup & Telemetry
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'endpoints'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-blue-400" />
            Ingestion Endpoints
          </button>

          <button
            onClick={() => setActiveTab('workspace')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'workspace'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5 text-blue-400" />
            Workspace & Projects
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'theme'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-blue-400" />
            Theme & Currency Mode
          </button>
        </div>

        {/* Right Content Panel (9 Columns) */}
        <div className="md:col-span-9 border border-[#1E1E24] rounded bg-[#0F0F12] p-4 space-y-4 font-mono text-xs">
          
          {/* TAB 1: API KEYS */}
          {activeTab === 'api_keys' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <h2 className="font-bold text-white text-sm font-sans uppercase">API Secret Keys</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Use this secret key in your environment variables to authenticate PathFlow telemetry calls.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Live Production Ingestion Key</label>
                <div className="flex items-center gap-2 bg-[#08080A] border border-[#1E1E24] rounded p-2">
                  <span className="text-zinc-200 flex-1 font-mono">{apiKey}</span>
                  <button onClick={() => copyText(apiKey, 'key')} className="linear-btn shrink-0">
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedKey ? 'Copied Key' : 'Copy Key'}
                  </button>
                </div>
              </div>

              <div className="border-t border-[#1E1E24] pt-3 text-zinc-400 text-[11px] leading-relaxed">
                Environment Variable export:
                <pre className="mt-1 bg-[#08080A] border border-[#1E1E24] p-2.5 rounded text-zinc-300 font-mono">
                  export PATHFLOW_API_KEY="{apiKey}"
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: SDK SETUP */}
          {activeTab === 'sdk' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <h2 className="font-bold text-white text-sm font-sans uppercase">SDK Telemetry Integration</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Zero-config, invisible observation SDK for Python and TypeScript agent pipelines.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">1. Install PyPI Package</label>
                <div className="flex items-center gap-2 bg-[#08080A] border border-[#1E1E24] rounded p-2">
                  <span className="text-blue-400 flex-1 font-mono">{sdkCommand}</span>
                  <button onClick={() => copyText(sdkCommand, 'sdk')} className="linear-btn shrink-0">
                    {copiedSdk ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedSdk ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block">2. Wrap Agent Function with Decorator</label>
                  <button onClick={() => copyText(pythonSnippet, 'snippet')} className="text-[10px] text-blue-400 hover:underline">
                    {copiedSnippet ? 'Copied Snippet' : 'Copy Code Snippet'}
                  </button>
                </div>
                <pre className="bg-[#08080A] border border-[#1E1E24] p-3 rounded text-zinc-300 font-mono leading-relaxed overflow-x-auto">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <h2 className="font-bold text-white text-sm font-sans uppercase">Ingestion Endpoint Configuration</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Self-hosted or cloud telemetry receiver URLs.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Telemetry HTTP Collector URL</label>
                <div className="flex items-center gap-2 bg-[#08080A] border border-[#1E1E24] rounded p-2">
                  <span className="text-zinc-200 flex-1 font-mono">{endpoint}</span>
                  <button onClick={() => copyText(endpoint, 'endpoint')} className="linear-btn shrink-0">
                    {copiedEndpoint ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedEndpoint ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKSPACE & PROJECTS */}
          {activeTab === 'workspace' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <h2 className="font-bold text-white text-sm font-sans uppercase">Workspace & Project Settings</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Configure default telemetry workspace namespace and environment tags.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Default Project Tag</label>
                  <input
                    type="text"
                    value={defaultProject}
                    onChange={(e) => setDefaultProject(e.target.value)}
                    className="w-full rounded border border-[#1E1E24] bg-[#08080A] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Default Environment</label>
                  <input
                    type="text"
                    value={defaultEnv}
                    onChange={(e) => setDefaultEnv(e.target.value)}
                    className="w-full rounded border border-[#1E1E24] bg-[#08080A] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-[#1E1E24] pt-3 text-zinc-400 text-[11px]">
                Active Developer Account: <strong className="text-white">{userEmail}</strong>
              </div>
            </div>
          )}

          {/* TAB 5: THEME & CURRENCY */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <h2 className="font-bold text-white text-sm font-sans uppercase">Theme & Display Formatting</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Customize DevTools theme and currency symbol across latency/cost tables.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Theme Mode</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        theme === 'dark' ? 'bg-[#16161A] text-white font-bold border-blue-500' : 'bg-[#08080A] text-zinc-400 border-[#1E1E24]'
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5 text-blue-400" />
                      Dark DevTools Theme
                    </button>

                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        theme === 'light' ? 'bg-[#16161A] text-amber-500 font-bold border-amber-500' : 'bg-[#08080A] text-zinc-400 border-[#1E1E24]'
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-400" />
                      Light Mode
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#1E1E24] pt-3">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Currency Format</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCurrencyChange('USD')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        currency === 'USD' ? 'bg-[#16161A] text-white font-bold border-blue-500' : 'bg-[#08080A] text-zinc-400 border-[#1E1E24]'
                      }`}
                    >
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                      USD ($ USD)
                    </button>

                    <button
                      onClick={() => handleCurrencyChange('INR')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        currency === 'INR' ? 'bg-[#16161A] text-emerald-400 font-bold border-emerald-500' : 'bg-[#08080A] text-zinc-400 border-[#1E1E24]'
                      }`}
                    >
                      INR (₹ Rupees)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
