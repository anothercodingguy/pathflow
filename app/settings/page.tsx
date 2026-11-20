'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageShell, PageHeader } from '@/components/ui/Page';
import { Button, buttonClass } from '@/components/ui/Button';
import { InlineError } from '@/components/ui/States';
import { useToast } from '@/components/ui/AnimatedToastStack';
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
  const { toast } = useToast();
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
  // Load errors are shown in the page (with Retry) instead of being swallowed.
  const [webhooksError, setWebhooksError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetLoaded, setBudgetLoaded] = useState(false);

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
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setWebhooks(data.webhooks || []);
        setWebhooksError(null);
      } else {
        setWebhooksError(res.status === 401 ? 'Sign in with an account to manage alert webhooks.' : data.error || `Webhooks could not be loaded (HTTP ${res.status}).`);
      }
    } catch {
      setWebhooksError('Webhooks could not be loaded. Check your connection.');
    }
  };

  const loadBudget = async () => {
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/budget?project=${encodeURIComponent(defaultProject)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.budget) {
        setBudget({
          monthlyLimitUsd: data.budget.monthlyLimitUsd,
          alertThresholdPct: data.budget.alertThresholdPct,
          circuitBreaker: data.budget.circuitBreaker,
          currentSpendUsd: data.status?.currentSpendUsd || 0,
        });
        setBudgetLoaded(true);
        setBudgetError(null);
      } else {
        setBudgetError(res.status === 401 ? 'Sign in with an account to see and change your budget.' : data.error || `The budget could not be loaded (HTTP ${res.status}).`);
      }
    } catch {
      setBudgetError('The budget could not be loaded. Check your connection.');
    }
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
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNewWebhookName('');
        setNewWebhookUrl('');
        loadWebhooks();
        toast({ type: 'success', title: 'Webhook saved' });
      } else {
        toast({ type: 'error', title: 'Webhook was not saved', description: res.status === 401 ? 'Sign in with an account to add webhooks.' : data.error || `The server answered with HTTP ${res.status}.` });
      }
    } catch {
      toast({ type: 'error', title: 'Webhook was not saved', description: 'The request failed. Check your connection.' });
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/v1/alerts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast({ type: 'error', title: 'Webhook was not deleted', description: `The server answered with HTTP ${res.status}.` });
      }
      loadWebhooks();
    } catch {
      toast({ type: 'error', title: 'Webhook was not deleted', description: 'The request failed. Check your connection.' });
    }
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
        setTestAlertStatus('Test alert sent successfully.');
      } else {
        setTestAlertStatus(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setTestAlertStatus('Network error sending alert.');
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
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setBudgetSaveMessage('Budget and circuit breaker saved.');
        setBudgetLoaded(true);
        setBudgetError(null);
      } else {
        toast({ type: 'error', title: 'Budget was not saved', description: res.status === 401 ? 'Sign in with an account to change the budget.' : data.error || `The server answered with HTTP ${res.status}.` });
      }
    } catch {
      toast({ type: 'error', title: 'Budget was not saved', description: 'The request failed. Check your connection.' });
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
    <PageShell className="font-mono">
      <PageHeader title="Settings" description="API keys, SDK setup, alerts, budgets and display preferences." />

      {/* DevTools Settings Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Left Navigation Tabs */}
        <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto pb-1 md:col-span-3 md:block md:space-y-1 md:overflow-visible md:pb-0">
          <button
            type="button"
            aria-current={activeTab === 'api_keys' ? 'page' : undefined}
            onClick={() => setActiveTab('api_keys')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'api_keys'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-accent-ink" />
            API Keys & Auth Secrets
          </button>

          <button
            type="button"
            aria-current={activeTab === 'sdk' ? 'page' : undefined}
            onClick={() => setActiveTab('sdk')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'sdk'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-accent-ink" />
            SDK Setup & Telemetry
          </button>

          <button
            type="button"
            aria-current={activeTab === 'endpoints' ? 'page' : undefined}
            onClick={() => setActiveTab('endpoints')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'endpoints'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-accent-ink" />
            Ingestion Endpoints
          </button>

          <button
            type="button"
            aria-current={activeTab === 'alerts' ? 'page' : undefined}
            onClick={() => setActiveTab('alerts')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'alerts'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-accent-ink" />
            Alerts & Webhooks
          </button>

          <button
            type="button"
            aria-current={activeTab === 'budget' ? 'page' : undefined}
            onClick={() => setActiveTab('budget')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'budget'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-accent-ink" />
            Budgets & Circuit Breakers
          </button>

          <button
            type="button"
            aria-current={activeTab === 'workspace' ? 'page' : undefined}
            onClick={() => setActiveTab('workspace')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'workspace'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5 text-accent-ink" />
            Workspace & Projects
          </button>

          <Link
            href="/settings/billing"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded border border-violet/30 bg-violet/[0.06] px-3 py-2 text-left font-mono text-xs text-violet transition-colors hover:bg-violet/10 md:w-full"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden />
            <span>Billing & Plans</span>
            
          </Link>


          <button
            type="button"
            aria-current={activeTab === 'theme' ? 'page' : undefined}
            onClick={() => setActiveTab('theme')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'theme'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-accent-ink" />
            Theme & Currency Mode
          </button>

          <button
            type="button"
            aria-current={activeTab === 'feedback' ? 'page' : undefined}
            onClick={() => setActiveTab('feedback')}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded border px-3 py-2 text-left font-mono text-xs transition-colors md:w-full ${
              activeTab === 'feedback'
                ? 'border-line bg-raised font-semibold text-ink'
                : 'border-transparent text-ink-2 hover:bg-surface hover:text-ink'
            }`}
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-accent-ink" />
            Request Feature & Feedback
          </button>
        </nav>

        {/* Right Content Panel */}
        <div className="min-w-0 md:col-span-9 border border-line rounded-lg bg-surface p-3 sm:p-4 space-y-4 font-mono text-xs">
          
          {/* TAB 1: API KEYS */}
          {activeTab === 'api_keys' && (
            <div className="space-y-4">
              <div className="border-b border-line pb-2">
                <h2 className="font-sans text-sm font-semibold text-ink">API Secret Keys</h2>
                <p className="mt-0.5 font-sans text-xs text-ink-2">Use this secret key in your environment variables to authenticate PathFlow telemetry calls.</p>
              </div>

              <div className="space-y-2">
                <p className="text-2xs text-ink-3 uppercase font-bold block">Live Production Ingestion Key</p>
                <div className="flex items-center gap-2 bg-canvas border border-line rounded p-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-ink">{apiKey}</span>
                  <button type="button" onClick={() => copyText(apiKey, 'key')} className={buttonClass('secondary', 'sm', 'shrink-0')}>
                    {copiedKey ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
                    {copiedKey ? 'Copied Key' : 'Copy Key'}
                  </button>
                </div>
              </div>

              {apiKey === 'pf_live_secret_key' && (
                <p role="note" className="rounded-md border border-warn/30 bg-warn/[0.06] px-3 py-2 font-sans text-xs leading-relaxed text-ink-2">
                  This is a placeholder, not a working key. Sign in with an account to use your own key here.
                </p>
              )}

              <div className="border-t border-line pt-3 text-ink-2 text-2xs leading-relaxed">
                Environment Variable export:
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded border border-line bg-canvas p-2.5 font-mono text-ink-2">
                  export PATHFLOW_API_KEY=&quot;{apiKey}&quot;
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: SDK SETUP */}
          {activeTab === 'sdk' && (
            <div className="space-y-4">
              <div className="border-b border-line pb-2">
                <h2 className="font-sans text-sm font-semibold text-ink">SDK Telemetry Integration</h2>
                <p className="mt-0.5 font-sans text-xs text-ink-2">Zero-config, invisible observation SDK for Python and TypeScript agent pipelines.</p>
              </div>

              <div className="space-y-2">
                <p className="text-2xs text-ink-3 uppercase font-bold block">1. Install Python Package</p>
                <div className="flex items-center gap-2 bg-canvas border border-line rounded p-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-accent-ink">{sdkCommand}</span>
                  <button type="button" onClick={() => copyText(sdkCommand, 'sdk')} className={buttonClass('secondary', 'sm', 'shrink-0')}>
                    {copiedSdk ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
                    {copiedSdk ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-2xs text-ink-3 uppercase font-bold block">2. Wrap Agent Function with Decorator</p>
                  <button type="button" onClick={() => copyText(pythonSnippet, 'snippet')} className="text-2xs text-accent-ink hover:underline">
                    {copiedSnippet ? 'Copied Snippet' : 'Copy Code Snippet'}
                  </button>
                </div>
                <pre className="bg-canvas border border-line p-3 rounded text-ink-2 font-mono leading-relaxed overflow-x-auto">
                  {pythonSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINTS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="border-b border-line pb-2">
                <h2 className="font-sans text-sm font-semibold text-ink">Ingestion Endpoint Configuration</h2>
                <p className="mt-0.5 font-sans text-xs text-ink-2">Self-hosted, cloud telemetry receiver, and OpenTelemetry OTLP URLs.</p>
              </div>

              <div className="space-y-2">
                <p className="text-2xs text-ink-3 uppercase font-bold block">Native Telemetry HTTP Collector URL</p>
                <div className="flex items-center gap-2 bg-canvas border border-line rounded p-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-ink">{endpoint}</span>
                  <button type="button" onClick={() => copyText(endpoint, 'endpoint')} className={buttonClass('secondary', 'sm', 'shrink-0')}>
                    {copiedEndpoint ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
                    {copiedEndpoint ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-2xs text-ink-3 uppercase font-bold block">OpenTelemetry (OTLP/HTTP) Exporter Endpoint</p>
                <div className="flex items-center gap-2 bg-canvas border border-line rounded p-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-ink">{endpoint}/otel/v1/traces</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALERTS & WEBHOOKS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <div>
                  <h2 className="font-sans text-sm font-semibold text-ink">Alerts & Webhooks</h2>
                  <p className="mt-0.5 font-sans text-xs text-ink-2">Receive immediate notifications on Slack, Discord, or Custom HTTP endpoints for Critical Anomaly Detections.</p>
                </div>
                {testAlertStatus && (
                  <span role="status" className="font-mono text-xs text-accent-ink">{testAlertStatus}</span>
                )}
              </div>

              {webhooksError && <InlineError onRetry={loadWebhooks}>{webhooksError}</InlineError>}

              {/* Add Webhook Form */}
              <form onSubmit={handleAddWebhook} className="bg-canvas border border-line rounded-lg p-3 space-y-3">
                <div className="text-2xs font-bold text-ink uppercase flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-accent-ink" />
                  <span>Add Alert Webhook</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="settings-field-1" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Name</label>
                    <input

                      id="settings-field-1"
                      type="text"
                      placeholder="e.g. Prod Incident Slack"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="settings-field-2" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Platform</label>
                    <select

                      id="settings-field-2"
                      value={newWebhookType}
                      onChange={(e) => setNewWebhookType(e.target.value as any)}
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-blue-500"
                    >
                      <option value="SLACK">Slack Webhook</option>
                      <option value="DISCORD">Discord Webhook</option>
                      <option value="GENERIC_HTTP">Custom HTTP Endpoint</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settings-field-3" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Min Cost Trigger ($)</label>
                    <input

                      id="settings-field-3"
                      type="number"
                      step="0.05"
                      value={newMinCost}
                      onChange={(e) => setNewMinCost(e.target.value)}
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="settings-field-4" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Webhook URL</label>
                  <input

                    id="settings-field-4"
                    type="url"
                    placeholder="https://hooks.slack.com/services/... or https://discord.com/api/webhooks/..."
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button size="sm" onClick={() => handleTestAlert(newWebhookUrl, newWebhookType)} disabled={!newWebhookUrl}>
                    <Send aria-hidden />
                    Test URL
                  </Button>

                  <Button type="submit" variant="primary" size="sm" disabled={isSavingWebhook || !newWebhookName || !newWebhookUrl}>
                    {isSavingWebhook ? 'Saving…' : 'Save webhook'}
                  </Button>
                </div>
              </form>

              {/* Active Webhooks List */}
              <div className="space-y-2">
                <div className="text-2xs text-ink-3 uppercase font-bold">Active Webhook Channels ({webhooks.length})</div>
                {webhooksError ? null : webhooks.length === 0 ? (
                  <div className="p-4 bg-canvas border border-line rounded-lg text-center text-ink-3 text-xs font-sans">
                    No webhooks yet. Add a Slack, Discord or HTTP webhook to be notified about detections.
                  </div>
                ) : (
                  webhooks.map((wh) => (
                    <div key={wh.id} className="p-3 bg-canvas border border-line rounded-lg flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">{wh.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-2xs bg-blue-500/10 text-accent-ink border border-blue-500/20">{wh.type}</span>
                        </div>
                        <div className="max-w-full truncate text-2xs text-ink-3 sm:max-w-sm">{wh.url}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleTestAlert(wh.url, wh.type)}>
                          Send test
                        </Button>
                        <Button variant="danger" size="icon" className="size-7" onClick={() => handleDeleteWebhook(wh.id)} aria-label={`Delete webhook ${wh.name}`}>
                          <Trash2 aria-hidden />
                        </Button>
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
              <div className="border-b border-line pb-2">
                <h2 className="font-sans text-sm font-semibold text-ink">Cost Budgets & Circuit Breakers</h2>
                <p className="mt-0.5 font-sans text-xs text-ink-2">Configure monthly spend caps and automatic circuit breakers to protect against runaway tool loops.</p>
              </div>

              {budgetError && <InlineError onRetry={loadBudget}>{budgetError}</InlineError>}

              {!budgetLoaded && !budgetError && (
                <p role="status" className="font-sans text-xs text-ink-3">Loading budget…</p>
              )}

              {budgetSaveMessage && (
                <div role="status" className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-ok text-xs">
                  {budgetSaveMessage}
                </div>
              )}

              {/* Spend progress: only shown once the real budget has loaded, never from defaults */}
              {budgetLoaded && (
              <div className="p-4 bg-canvas border border-line rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-2">30-Day Project Spend:</span>
                  <span className="font-bold text-ink">${budget.currentSpendUsd.toFixed(3)} / ${budget.monthlyLimitUsd.toFixed(2)}</span>
                </div>
                <div className="w-full bg-tint/5 rounded-full h-2 overflow-hidden border border-line" role="progressbar" aria-label="Monthly budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((budget.currentSpendUsd / budget.monthlyLimitUsd) * 100))}>
                  <div
                    className={`h-full transition-all ${
                      (budget.currentSpendUsd / budget.monthlyLimitUsd) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((budget.currentSpendUsd / budget.monthlyLimitUsd) * 100))}%` }}
                  />
                </div>
                <div className="text-2xs text-ink-3 text-right">
                  {Math.round((budget.currentSpendUsd / budget.monthlyLimitUsd) * 100)}% of monthly budget used
                </div>
              </div>
              )}

              {/* Budget Settings Form */}
              <div className="space-y-3 bg-canvas border border-line rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="settings-field-5" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Monthly Cost Limit ($ USD)</label>
                    <input

                      id="settings-field-5"
                      type="number"
                      step="5"
                      value={budget.monthlyLimitUsd}
                      onChange={(e) => setBudget({ ...budget, monthlyLimitUsd: parseFloat(e.target.value) || 50 })}
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="settings-field-6" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Alert Threshold (%)</label>
                    <input

                      id="settings-field-6"
                      type="number"
                      value={budget.alertThresholdPct}
                      onChange={(e) => setBudget({ ...budget, alertThresholdPct: parseInt(e.target.value, 10) || 80 })}
                      className="w-full rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Circuit Breaker Toggle */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
                  <label htmlFor="circuit-breaker" className="min-w-0 cursor-pointer">
                    <span className="block font-bold text-ink text-xs">Automated Circuit Breaker</span>
                    <span className="block text-2xs text-ink-3">Automatically pause new agent runs if the monthly spend limit is 100% exceeded.</span>
                  </label>
                  <input
                    id="circuit-breaker"
                    type="checkbox"
                    checked={budget.circuitBreaker}
                    onChange={(e) => setBudget({ ...budget, circuitBreaker: e.target.checked })}
                    className="size-4 shrink-0 cursor-pointer accent-[rgb(var(--accent))]"
                  />
                </div>

                <div className="pt-2 text-right">
                  <Button variant="primary" onClick={handleSaveBudget} disabled={isSavingBudget}>
                    {isSavingBudget ? 'Saving…' : 'Save budget'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORKSPACE & PROJECTS */}
          {activeTab === 'workspace' && (
            <div className="space-y-4">
              <div className="border-b border-line pb-2">
                <h2 className="font-sans text-sm font-semibold text-ink">Workspace & Project Settings</h2>
                <p className="mt-0.5 font-sans text-xs text-ink-2">Configure default telemetry workspace namespace and environment tags.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="settings-field-7" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Default Project Tag</label>
                  <input

                    id="settings-field-7"
                    type="text"
                    value={defaultProject}
                    onChange={(e) => setDefaultProject(e.target.value)}
                    className="w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="settings-field-8" className="text-2xs text-ink-3 uppercase font-bold block mb-1">Default Environment</label>
                  <input

                    id="settings-field-8"
                    type="text"
                    value={defaultEnv}
                    onChange={(e) => setDefaultEnv(e.target.value)}
                    className="w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-line pt-3 text-ink-2 text-2xs">
                Active Developer Account: <strong className="text-ink">{userEmail}</strong>
              </div>
            </div>
          )}

          {/* TAB 5: THEME & CURRENCY */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="border-b border-line pb-2">
                <h2 className="font-sans text-sm font-semibold text-ink">Theme & Display Formatting</h2>
                <p className="mt-0.5 font-sans text-xs text-ink-2">Customize DevTools theme and currency symbol across latency/cost tables.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-2xs text-ink-3 uppercase font-bold block mb-1.5">Theme Mode</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={theme === 'dark'}
                      onClick={() => handleThemeChange('dark')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        theme === 'dark' ? 'bg-raised text-ink font-semibold border-accent' : 'bg-canvas text-ink-2 border-line'
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5 text-accent-ink" />
                      Dark DevTools Theme
                    </button>

                    <button
                      type="button"
                      aria-pressed={theme === 'light'}
                      onClick={() => handleThemeChange('light')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        theme === 'light' ? 'bg-raised text-ink font-semibold border-accent' : 'bg-canvas text-ink-2 border-line'
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5 text-warn" />
                      Light Mode
                    </button>
                  </div>
                </div>

                <div className="border-t border-line pt-3">
                  <p className="text-2xs text-ink-3 uppercase font-bold block mb-1.5">Currency Format</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={currency === 'USD'}
                      onClick={() => handleCurrencyChange('USD')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        currency === 'USD' ? 'bg-raised text-ink font-semibold border-accent' : 'bg-canvas text-ink-2 border-line'
                      }`}
                    >
                      <DollarSign className="h-3.5 w-3.5 text-ok" />
                      USD ($ USD)
                    </button>

                    <button
                      type="button"
                      aria-pressed={currency === 'INR'}
                      onClick={() => handleCurrencyChange('INR')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
                        currency === 'INR' ? 'bg-raised text-ink font-semibold border-accent' : 'bg-canvas text-ink-2 border-line'
                      }`}
                    >
                      <DollarSign className="h-3.5 w-3.5 text-ok" />
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
              <div className="border-b border-line pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-accent-ink" />
                  <h2 className="font-sans text-sm font-semibold text-ink">Request a Feature & Feedback</h2>
                </div>
                <p className="text-ink-2 text-xs mt-0.5 font-sans">
                  Have an idea for a new agent tracing feature, framework integration, or improvement? Share it directly with our core engineering team.
                </p>
              </div>

              {feedbackStatus && (
                <div role={feedbackStatus.type === 'success' ? 'status' : 'alert'} className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                  feedbackStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-ok'
                    : 'bg-red-500/10 border-red-500/30 text-bad'
                }`}>
                  {feedbackStatus.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-ok shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-bad shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{feedbackStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
                {/* Category Selection */}
                <div>
                  <p className="text-2xs text-ink-3 uppercase font-bold block mb-1.5 font-mono">Feedback Category</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'FEATURE', label: 'Feature Request', icon: Lightbulb, color: 'text-warn' },
                      { id: 'BUG', label: 'Bug Report', icon: Bug, color: 'text-bad' },
                      { id: 'INTEGRATION', label: 'Integration', icon: Sparkles, color: 'text-violet' },
                      { id: 'GENERAL', label: 'General Feedback', icon: Heart, color: 'text-bad' },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = feedbackType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setFeedbackType(cat.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded border text-xs font-mono text-left transition-colors ${
                            isSelected
                              ? 'bg-raised text-ink font-semibold border-accent'
                              : 'bg-canvas text-ink-2 border-line hover:text-ink'
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
                    <label htmlFor="settings-field-9" className="text-2xs text-ink-3 uppercase font-bold block mb-1 font-mono">Priority / Importance</label>
                    <select

                      id="settings-field-9"
                      value={feedbackPriority}
                      onChange={(e) => setFeedbackPriority(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded border border-line bg-canvas text-ink font-mono text-xs focus:border-blue-500"
                    >
                      <option value="LOW">Nice to have (Low)</option>
                      <option value="MEDIUM">Important for workflow (Medium)</option>
                      <option value="HIGH">High priority requirement (High)</option>
                      <option value="BLOCKER">Blocking production deployment (Blocker)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settings-field-10" className="text-2xs text-ink-3 uppercase font-bold block mb-1 font-mono">Your Email (for updates)</label>
                    <input

                      id="settings-field-10"
                      type="email"
                      placeholder={userEmail}
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-line bg-canvas text-ink font-mono text-xs placeholder:text-ink-3 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="settings-field-11" className="text-2xs text-ink-3 uppercase font-bold block mb-1 font-mono">Summary / Title *</label>
                  <input

                    id="settings-field-11"
                    type="text"
                    required
                    placeholder="e.g. Add native LangGraph multi-agent DAG visualizer or Discord webhook formatting"
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-line bg-canvas text-ink font-mono text-xs placeholder:text-ink-3 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="settings-field-12" className="text-2xs text-ink-3 uppercase font-bold block mb-1 font-mono">Details / User Story *</label>
                  <textarea

                    id="settings-field-12"
                    required
                    rows={5}
                    placeholder="Describe what you want to achieve, how it should work, or the issue you encountered..."
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-line bg-canvas text-ink font-mono text-xs placeholder:text-ink-3 focus:border-blue-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Direct Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-line">
                  <div className="flex items-center gap-2 text-2xs text-ink-3">
                    <span>Direct contact:</span>
                    <a
                      href="mailto:admin@pathflow.dev?subject=PathFlow%20Feedback"
                      className="text-accent-ink hover:underline"
                    >
                      admin@pathflow.dev
                    </a>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingFeedback || !feedbackTitle.trim() || !feedbackDescription.trim()}
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
                  </Button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </PageShell>
  );
}
