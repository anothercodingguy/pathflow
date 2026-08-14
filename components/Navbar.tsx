'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Settings, LogOut, ChevronDown, Search, Command,
  BarChart3, AlertTriangle, Bug, Zap, Users, Activity,
  Radio, Shield, Bell, FileText, FlaskConical, X,
  Layers, LayoutDashboard
} from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

const navGroups = [
  {
    label: 'Observe',
    items: [
      { label: 'Runs', href: '/runs', icon: Radio },
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const userEmail = session?.user?.email || 'admin@pathflow.dev';
  const userName = session?.user?.name || 'Developer';
  const userImage = session?.user?.image;

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
    await signOut({ callbackUrl: '/login' });
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
            <span className="font-black tracking-tight text-white uppercase text-xs font-sans flex items-center gap-1">
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

        {/* Right Side: Search + Profile */}
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

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
          <div className="w-full max-w-lg bg-[#121217] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search runs, agents, traces, errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 focus:outline-none font-sans"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
            <div className="px-4 py-3 text-xs text-zinc-500 font-mono">
              <p>Type to search by run ID, agent name, error message, or model.</p>
              <p className="mt-1">Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-zinc-400">Enter</kbd> to search, <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-zinc-400">Esc</kbd> to close.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
