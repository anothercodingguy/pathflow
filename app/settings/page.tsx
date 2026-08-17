'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Copy, Check, Key, Terminal, Server, FolderGit2, Moon, Sun, DollarSign, UserCheck, Zap, Bell, ShieldAlert, Plus, Trash2, Send, AlertTriangle, CheckCircle2, MessageSquarePlus, Lightbulb, Bug, HelpCircle, Loader2, Sparkles, Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { CurrencyMode } from '@/lib/data';

interface WebhookItem {
  id: string;
  name: string;
  type: string;
  url: string;
  minSeverity: string;
  minCostUsd: number;
  enabled: boolean;
  lastFiredAt?: string;
  failureCount: number;
}

interface BudgetData {
  monthlyLimitUsd: number;
  alertThresholdPct: number;
  circuitBreaker: boolean;
  currentSpendUsd: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'api_keys' | 'sdk' | 'endpoints' | 'workspace' | 'alerts' | 'budget' | 'theme' | 'feedback'>('api_keys');
  const [sdkCommand] = useState('pip install pathflow');
  const [apiKey, setApiKey] = useState('pf_live_secret_key');
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thepathflow.online/app';
  const appBase = rawAppUrl.endsWith('/app') ? rawAppUrl : `${rawAppUrl}/app`;
  const defaultEndpoint = `${appBase}/api/v1`;
  const [endpoint] = useState(defaultEndpoint);
  const [defaultProject, setDefaultProject] = useState('backend-agents');
  const [defaultEnv, setDefaultEnv] = useState('production');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookType, setNewWebhookType] = useState<'SLACK' | 'DISCORD' | 'GENERIC_HTTP'>('SLACK');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newMinSeverity, setNewMinSeverity] = useState('CRITICAL');
  const [newMinCost, setNewMinCost] = useState('0.50');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [testAlertStatus, setTestAlertStatus] = useState<string | null>(null);

  // Budget state
  const [budget, setBudget] = useState<BudgetData>({
    monthlyLimitUsd: 50.0,
    alertThresholdPct: 80,
    circuitBreaker: false,
    currentSpendUsd: 0.0,
  });
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetSaveMessage, setBudgetSaveMessage] = useState<string | null>(null);

  // Feedback & Feature Request State
  const [feedbackType, setFeedbackType] = useState<'FEATURE' | 'BUG' | 'INTEGRATION' | 'GENERAL'>('FEATURE');
  const [feedbackPriority, setFeedbackPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER'>('MEDIUM');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const userEmail = session?.user?.email || 'admin@pathflow.dev';
  const userName = session?.user?.name || 'Developer';
  const displayApiKey = (session?.user as any)?.apiKey || apiKey;

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSdk, setCopiedSdk] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem('pathflow_currency') as CurrencyMode;
    const savedTheme = localStorage.getItem('pathflow_theme') as 'dark' | 'light';
    const savedKey = localStorage.getItem('pathflow_api_key');

    if (savedCurrency === 'INR' || savedCurrency === 'USD') setCurrency(savedCurrency);
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    if (savedKey) setApiKey(savedKey);

    loadWebhooks();
    loadBudget();
  }, []);

  const loadWebhooks = async () => {
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/alerts`);
      const data = await res.json();
      if (data.success) setWebhooks(data.webhooks || []);
    } catch {}
  };

  const loadBudget = async () => {
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/budget?project=${encodeURIComponent(defaultProject)}`);
      const data = await res.json();
      if (data.success && data.budget) {
        setBudget({
          monthlyLimitUsd: data.budget.monthlyLimitUsd,
          alertThresholdPct: data.budget.alertThresholdPct,
          circuitBreaker: data.budget.circuitBreaker,
          currentSpendUsd: data.status?.currentSpendUsd || 0,
        });
      }
    } catch {}
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookName || !newWebhookUrl) return;
    setIsSavingWebhook(true);
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWebhookName,
          type: newWebhookType,
          url: newWebhookUrl,
          minSeverity: newMinSeverity,
          minCostUsd: newMinCost,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewWebhookName('');
        setNewWebhookUrl('');
        loadWebhooks();
      }
    } catch {} finally {
      setIsSavingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      await fetch(`${apiBase}/api/v1/alerts?id=${id}`, { method: 'DELETE' });
      loadWebhooks();
    } catch {}
  };

  const handleTestAlert = async (url?: string, type?: string) => {
    setTestAlertStatus('Sending test notification...');
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/alerts/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
      });
      const data = await res.json();
      if (data.success) {
        setTestAlertStatus('✅ Test alert sent successfully!');
      } else {
        setTestAlertStatus(`❌ Failed: ${data.error}`);
      }
    } catch (err: any) {
      setTestAlertStatus('❌ Network error sending alert');
    }
    setTimeout(() => setTestAlertStatus(null), 4000);
  };

  const handleSaveBudget = async () => {
    setIsSavingBudget(true);
    setBudgetSaveMessage(null);
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: defaultProject,
          monthlyLimitUsd: budget.monthlyLimitUsd,
          alertThresholdPct: budget.alertThresholdPct,
          circuitBreaker: budget.circuitBreaker,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBudgetSaveMessage('✅ Budget and circuit breaker saved successfully!');
      }
    } catch {
      setBudgetSaveMessage('❌ Failed to update budget.');
    } finally {
      setIsSavingBudget(false);
      setTimeout(() => setBudgetSaveMessage(null), 3000);
    }
  };

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

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDescription.trim()) return;

    setIsSubmittingFeedback(true);
    setFeedbackStatus(null);

    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          priority: feedbackPriority,
          title: feedbackTitle,
          description: feedbackDescription,
          email: feedbackEmail || userEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackStatus({
          type: 'success',
          message: 'Thank you! Your feedback has been sent directly to the engineering team.',
        });
        setFeedbackTitle('');
        setFeedbackDescription('');
      } else {
        setFeedbackStatus({ type: 'error', message: data.error || 'Failed to submit feedback.' });
      }
    } catch {
      setFeedbackStatus({ type: 'error', message: 'Network error. Please try again or email admin@pathflow.dev.' });
    } finally {
      setIsSubmittingFeedback(false);
    }
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

pf = PathFlow()

@pf.trace(
    name="Support Ticket Agent",
    project="${defaultProject}",
    environment="${defaultEnv}"
)
def run_agent():
    # Your LLM / Tool execution code here
    pass

run_agent()`;

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-3 space-y-4 font-mono text-xs">
      
      {/* Header Bar */}
      <div className="flex items-baseline justify-between border-b border-[#1E1E24] pb-2.5">
        <h1 className="text-dev-title text-white font-sans uppercase">Settings</h1>
        <span className="text-xs text-zinc-500 font-mono">
          Developer API Keys, SDK Telemetry Setup & Workspace Preferences
        </span>
      </div>

      {/* DevTools Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Left Navigation Tabs */}
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
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'alerts'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-blue-400" />
            Alerts & Webhooks
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'budget'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
            Budgets & Circuit Breakers
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

          <Link
            href="/settings/billing"
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left text-purple-300 hover:text-white hover:bg-[#16161A] border border-purple-500/20 bg-purple-500/5"
          >
            <Zap className="h-3.5 w-3.5 text-purple-400" />
            <span>Billing & Plans</span>
            <span className="ml-auto text-[10px] px-1 rounded bg-purple-500/20 text-purple-300 font-bold">PRO</span>
          </Link>

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

          <button
            onClick={() => setActiveTab('feedback')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors text-left ${
              activeTab === 'feedback'
                ? 'bg-[#16161A] text-white font-bold border border-[#1E1E24]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0F0F12]'
            }`}
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-blue-400" />
            Request Feature & Feedback
          </button>
        </div>

        {/* Right Content Panel */}
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
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">1. Install Python Package</label>
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
                <p className="text-zinc-400 text-xs mt-0.5">Self-hosted, cloud telemetry receiver, and OpenTelemetry OTLP URLs.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Native Telemetry HTTP Collector URL</label>
                <div className="flex items-center gap-2 bg-[#08080A] border border-[#1E1E24] rounded p-2">
                  <span className="text-zinc-200 flex-1 font-mono">{endpoint}</span>
                  <button onClick={() => copyText(endpoint, 'endpoint')} className="linear-btn shrink-0">
                    {copiedEndpoint ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedEndpoint ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold block">OpenTelemetry (OTLP/HTTP) Exporter Endpoint</label>
                <div className="flex items-center gap-2 bg-[#08080A] border border-[#1E1E24] rounded p-2">
                  <span className="text-zinc-200 flex-1 font-mono">{endpoint}/otel/v1/traces</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALERTS & WEBHOOKS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E1E24] pb-2">
                <div>
                  <h2 className="font-bold text-white text-sm font-sans uppercase">Alerts & Webhooks</h2>
                  <p className="text-zinc-400 text-xs mt-0.5">Receive immediate notifications on Slack, Discord, or Custom HTTP endpoints for Critical Anomaly Detections.</p>
                </div>
                {testAlertStatus && (
                  <span className="text-xs font-mono text-blue-400 animate-pulse">{testAlertStatus}</span>
                )}
              </div>

              {/* Add Webhook Form */}
              <form onSubmit={handleAddWebhook} className="bg-[#08080A] border border-[#1E1E24] rounded-lg p-3 space-y-3">
                <div className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add Alert Webhook</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Prod Incident Slack"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      className="w-full rounded border border-[#1E1E24] bg-[#121217] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Platform</label>
                    <select
                      value={newWebhookType}
                      onChange={(e) => setNewWebhookType(e.target.value as any)}
                      className="w-full rounded border border-[#1E1E24] bg-[#121217] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="SLACK">Slack Webhook</option>
                      <option value="DISCORD">Discord Webhook</option>
                      <option value="GENERIC_HTTP">Custom HTTP Endpoint</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Min Cost Trigger ($)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={newMinCost}
                      onChange={(e) => setNewMinCost(e.target.value)}
                      className="w-full rounded border border-[#1E1E24] bg-[#121217] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Webhook URL</label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full rounded border border-[#1E1E24] bg-[#121217] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestAlert(newWebhookUrl, newWebhookType)}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-mono flex items-center gap-1"
                  >
                    <Send className="w-3 h-3 text-blue-400" />
                    <span>Test URL</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingWebhook || !newWebhookName || !newWebhookUrl}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                  >
                    {isSavingWebhook ? 'Saving...' : 'Save Webhook'}
                  </button>
                </div>
              </form>

              {/* Active Webhooks List */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Active Webhook Channels ({webhooks.length})</div>
                {webhooks.length === 0 ? (
                  <div className="p-4 bg-[#08080A] border border-[#1E1E24] rounded-lg text-center text-zinc-500 text-xs font-mono">
                    No webhooks configured. Add a Slack or Discord webhook to receive live anomaly alerts.
                  </div>
                ) : (
                  webhooks.map((wh) => (
                    <div key={wh.id} className="p-3 bg-[#08080A] border border-[#1E1E24] rounded-lg flex items-center justify-between font-mono text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{wh.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">{wh.type}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-sm">{wh.url}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestAlert(wh.url, wh.type)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 text-[10px]"
                        >
                          Send Test
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: BUDGETS & CIRCUIT BREAKERS */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <h2 className="font-bold text-white text-sm font-sans uppercase">Cost Budgets & Circuit Breakers</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Configure monthly spend caps and automatic circuit breakers to protect against runaway tool loops.</p>
              </div>

              {budgetSaveMessage && (
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {budgetSaveMessage}
                </div>
              )}

              {/* Spend Progress Bar */}
              <div className="p-4 bg-[#08080A] border border-[#1E1E24] rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">30-Day Project Spend:</span>
                  <span className="font-bold text-white">${budget.currentSpendUsd.toFixed(3)} / ${budget.monthlyLimitUsd.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all ${
                      (budget.currentSpendUsd / budget.monthlyLimitUsd) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((budget.currentSpendUsd / budget.monthlyLimitUsd) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 text-right">
                  {Math.round((budget.currentSpendUsd / budget.monthlyLimitUsd) * 100)}% of monthly budget utilized
                </div>
              </div>

              {/* Budget Settings Form */}
              <div className="space-y-3 bg-[#08080A] border border-[#1E1E24] rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Monthly Cost Limit ($ USD)</label>
                    <input
                      type="number"
                      step="5"
                      value={budget.monthlyLimitUsd}
                      onChange={(e) => setBudget({ ...budget, monthlyLimitUsd: parseFloat(e.target.value) || 50 })}
                      className="w-full rounded border border-[#1E1E24] bg-[#121217] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Alert Threshold (%)</label>
                    <input
                      type="number"
                      value={budget.alertThresholdPct}
                      onChange={(e) => setBudget({ ...budget, alertThresholdPct: parseInt(e.target.value, 10) || 80 })}
                      className="w-full rounded border border-[#1E1E24] bg-[#121217] px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Circuit Breaker Toggle */}
                <div className="pt-3 border-t border-[#1E1E24] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Automated Circuit Breaker</div>
                    <div className="text-[10px] text-zinc-500">Automatically pause new agent runs if the monthly spend limit is 100% exceeded.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={budget.circuitBreaker}
                    onChange={(e) => setBudget({ ...budget, circuitBreaker: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1E1E24] bg-[#121217] text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={handleSaveBudget}
                    disabled={isSavingBudget}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                  >
                    {isSavingBudget ? 'Saving...' : 'Save Budget Configuration'}
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
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                      INR (₹ Rupees)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: REQUEST A FEATURE & GIVE FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="border-b border-[#1E1E24] pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-blue-400" />
                  <h2 className="font-bold text-white text-sm font-sans uppercase">Request a Feature & Feedback</h2>
                </div>
                <p className="text-zinc-400 text-xs mt-0.5 font-sans">
                  Have an idea for a new agent tracing feature, framework integration, or improvement? Share it directly with our core engineering team.
                </p>
              </div>

              {feedbackStatus && (
                <div className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                  feedbackStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {feedbackStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{feedbackStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
                {/* Category Selection */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5 font-mono">Feedback Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'FEATURE', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-400' },
                      { id: 'BUG', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
                      { id: 'INTEGRATION', label: 'Integration', icon: Sparkles, color: 'text-purple-400' },
                      { id: 'GENERAL', label: 'General Feedback', icon: Heart, color: 'text-pink-400' },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = feedbackType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFeedbackType(cat.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded border text-xs font-mono text-left transition-colors ${
                            isSelected
                              ? 'bg-[#16161A] text-white font-bold border-blue-500 shadow-sm'
                              : 'bg-[#08080A] text-zinc-400 border-[#1E1E24] hover:text-white'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 font-mono">Priority / Importance</label>
                    <select
                      value={feedbackPriority}
                      onChange={(e) => setFeedbackPriority(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded border border-[#1E1E24] bg-[#08080A] text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="LOW">Nice to have (Low)</option>
                      <option value="MEDIUM">Important for workflow (Medium)</option>
                      <option value="HIGH">High priority requirement (High)</option>
                      <option value="BLOCKER">Blocking production deployment (Blocker)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 font-mono">Your Email (for updates)</label>
                    <input
                      type="email"
                      placeholder={userEmail}
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-[#1E1E24] bg-[#08080A] text-white font-mono text-xs placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 font-mono">Summary / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Add native LangGraph multi-agent DAG visualizer or Discord webhook formatting"
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#1E1E24] bg-[#08080A] text-white font-mono text-xs placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 font-mono">Details / User Story *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe what you want to achieve, how it should work, or the issue you encountered..."
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#1E1E24] bg-[#08080A] text-white font-mono text-xs placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Direct Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#1E1E24]">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span>Direct contact:</span>
                    <a
                      href="mailto:admin@pathflow.dev?subject=PathFlow%20Feedback"
                      className="text-blue-400 hover:underline"
                    >
                      admin@pathflow.dev
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackTitle.trim() || !feedbackDescription.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs font-mono transition-colors shadow-lg active:scale-95 cursor-pointer"
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
