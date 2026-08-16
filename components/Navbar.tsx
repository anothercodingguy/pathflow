'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Settings, LogOut, ChevronDown, Search, Command,
  BarChart3, AlertTriangle, Bug, Zap, Users, Activity,
  Radio, Shield, Bell, FileText, FlaskConical, X,
  Layers, LayoutDashboard, Sun, Moon, MessageSquare
} from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

const navGroups = [
  {
    label: 'Observe',
    items: [
      { label: 'Runs', href: '/runs', icon: Radio },
      { label: 'Sessions', href: '/sessions', icon: MessageSquare },
      { label: 'Agents', href: '/agents', icon: Users },
    ],
  },
  {
    label: 'Understand',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Detections', href: '/detections', icon: AlertTriangle },
    ],
  },
  {
    label: 'Debug',
    items: [
      { label: 'Compare', href: '/compare', icon: Layers },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const userEmail = session?.user?.email || 'admin@pathflow.dev';
  const userName = session?.user?.name || 'Developer';
  const userImage = session?.user?.image;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLight = document.documentElement.classList.contains('light');
      setTheme(isLight ? 'light' : 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      localStorage.setItem('pathflow_theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('pathflow_theme', 'dark');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cmd+K global search shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  // Hide Navbar completely on the authentication / login page
  if (pathname === '/login') {
    return null;
  }

  const handleSignOut = async () => {
    localStorage.removeItem('pathflow_api_key');
    localStorage.removeItem('pathflow_auth_provider');
    document.cookie = 'authjs.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'pathflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await signOut({ callbackUrl: '/app/login' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/runs?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://thepathflow.online';

  return (
    <>
      <header className="h-11 border-b border-white/[0.07] bg-[#0C0C0F] px-4 flex items-center justify-between text-[13px] select-none sticky top-0 z-50 font-sans">
        
        {/* Brand & Navigation */}
        <div className="flex items-center gap-6">
          <a 
            href={marketingUrl} 
            title="Return to PathFlow Marketing Website" 
            className="flex items-center gap-2 group shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="font-black tracking-tight text-white uppercase text-xs font-sans">
              PATH<span className="text-blue-500">FLOW</span>
            </span>
          </a>

          <nav className="flex items-center gap-1">
            {navGroups.map((group) => (
              <div key={group.label} className="flex items-center">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                        active
                          ? 'text-white bg-white/[0.07]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="w-px h-4 bg-white/[0.07] mx-1" />
              </div>
            ))}
            <Link
              href="/settings"
              className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/settings')
                  ? 'text-white bg-white/[0.07]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* Right Side: Search + Theme Toggle + Profile */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#14141A] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12] transition-colors text-[11px] font-mono"
          >
            <Search className="h-3 w-3" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-zinc-500">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 rounded-md bg-[#14141A] hover:bg-[#1A1A22] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-blue-400" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#14141A] hover:bg-[#1A1A22] border border-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
            >
              {userImage ? (
                <img src={userImage} alt={userName} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-600/80 text-white flex items-center justify-center font-bold text-[9px]">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-white/10 bg-[#121217] shadow-2xl py-1 z-50 text-xs font-mono">
                <div className="px-3 py-2 border-b border-white/[0.07] space-y-0.5">
                  <p className="font-sans font-semibold text-white truncate">{userName}</p>
                  <p className="text-zinc-400 text-[11px] truncate">{userEmail}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-[#1A1A22] hover:text-white transition-colors font-sans text-xs"
                >
                  <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Settings & API Keys</span>
                </Link>

                <Link
                  href="/settings/billing"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-purple-300 hover:bg-[#1A1A22] hover:text-white transition-colors font-sans text-xs"
                >
                  <Zap className="h-3.5 w-3.5 text-purple-400" />
                  <span>Billing & Plans</span>
                  <span className="text-[10px] text-purple-400 ml-auto font-mono font-bold">Pro / Team</span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-[#1A1A22] hover:text-white transition-colors font-sans text-xs text-left"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-3.5 w-3.5 text-amber-400" />
                      <span>Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-3.5 w-3.5 text-blue-400" />
                      <span>Dark Theme</span>
                    </>
                  )}
                </button>

                <a
                  href={marketingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-zinc-300 hover:bg-[#1A1A22] hover:text-white transition-colors font-sans text-xs border-t border-white/[0.07]"
                >
                  <span>Marketing Website</span>
                  <span className="text-[10px] text-zinc-500 ml-auto">thepathflow.online ↗</span>
                </a>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-white/[0.07] mt-1 cursor-pointer font-sans text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* Beautiful UI Global AI Prompt & Search Modal */}
      {isSearchOpen && (
        <div 
          onClick={() => setIsSearchOpen(false)}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#111115] border border-white/15 rounded-2xl shadow-2xl overflow-hidden p-3 font-sans"
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/[0.08]">
              <span className="text-[12px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <Command className="h-3.5 w-3.5 text-blue-400" />
                PathFlow AI Assistant & Trace Spotlight
              </span>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="pt-3">
              <div className="flex items-center gap-2 rounded-xl bg-[#09090C] border border-white/10 px-3 py-2 focus-within:border-blue-500/50">
                <Search className="h-4 w-4 text-zinc-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Ask AI or query traces (e.g. status:failed, model:claude, cost>0.02)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white transition-transform hover:bg-blue-500 disabled:opacity-30"
                >
                  ↵
                </button>
              </div>
            </form>

            {/* Quick prompt suggestions */}
            <div className="mt-3 grid grid-cols-2 gap-1.5 pt-2 border-t border-white/[0.06]">
              {[
                { label: 'Find high-latency spans (>2s)', query: 'duration>2000' },
                { label: 'Show failed LLM executions', query: 'status:failed' },
                { label: 'Analyze token explosion runs', query: 'status:error tokens' },
                { label: 'Filter Claude 3.7 traces', query: 'model:claude-3-7' },
              ].map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    router.push(`/runs?q=${encodeURIComponent(sug.query)}`);
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <span className="text-blue-400 text-[10px]">↗</span>
                  <span className="truncate">{sug.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
              <span>Press <kbd className="rounded bg-white/10 px-1 py-0.5 text-zinc-400">Esc</kbd> to exit</span>
              <span><kbd className="rounded bg-white/10 px-1 py-0.5 text-zinc-400">⌘K</kbd> anywhere</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
