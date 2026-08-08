'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Play, GitBranch, ArrowLeftRight, Settings, Terminal, LogOut, ChevronDown } from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [apiKey, setApiKey] = useState('pf_live_secret_key');
  const [userEmail, setUserEmail] = useState('admin@pathflow.dev');
  const [provider, setProvider] = useState<string>('email');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = localStorage.getItem('pathflow_api_key');
    const email = localStorage.getItem('pathflow_user_email');
    const prov = localStorage.getItem('pathflow_auth_provider');
    const savedCurrency = localStorage.getItem('pathflow_currency') as CurrencyMode;
    const savedTheme = localStorage.getItem('pathflow_theme') as 'dark' | 'light';

    if (key) setApiKey(key);
    if (email) setUserEmail(email);
    if (prov) setProvider(prov);
    if (savedCurrency === 'INR' || savedCurrency === 'USD') setCurrency(savedCurrency);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      if (savedTheme === 'light') document.documentElement.classList.add('light');
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide Navbar completely on the authentication / login page
  if (pathname === '/login') {
    return null;
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('pathflow_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    window.dispatchEvent(new Event('storage'));
  };

  const handleSignOut = () => {
    localStorage.removeItem('pathflow_api_key');
    localStorage.removeItem('pathflow_user_email');
    localStorage.removeItem('pathflow_auth_provider');
    document.cookie = 'pathflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsProfileOpen(false);
    router.push('/login');
  };

  // Information Architecture Navigation
  const navItems = [
    { label: 'Runs', href: '/runs', icon: Play },
    { label: 'Compare', href: '/compare', icon: ArrowLeftRight },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const userInitial = userEmail.charAt(0).toUpperCase() || 'P';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1E1E24] bg-[#08080A] px-6 py-2.5 font-mono text-xs">
      <div className="w-full flex items-center justify-between">
        
        {/* Brand Text Only & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/runs" className="group flex items-center">
            <span className="font-extrabold tracking-tight text-white text-sm uppercase font-sans">
              PATH<span className="text-blue-500">FLOW</span>
            </span>
          </Link>

          <span className="text-zinc-700 font-mono">/</span>

          {/* Navigation Tabs (Runs, Trace, Compare) */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === '/runs' && (pathname === '/' || pathname === '/traces')) ||
                (item.href.startsWith('/runs/') && pathname?.startsWith('/runs/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                    isActive
                      ? 'text-white bg-[#0F0F12] font-bold border border-[#1E1E24]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-zinc-400" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Top Right Profile Dropdown Section */}
        <div className="relative" ref={dropdownRef}>
          
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded border border-[#1E1E24] bg-[#0F0F12] px-2.5 py-1 text-xs text-zinc-200 hover:border-zinc-700 transition-colors font-mono"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/40 text-[10px] font-bold text-blue-400">
              {userInitial}
            </div>
            <span className="text-zinc-300 hidden sm:inline max-w-[150px] truncate">{userEmail}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded border border-[#1E1E24] bg-[#0F0F12] p-1.5 shadow-2xl z-50 divide-y divide-[#1E1E24] text-xs font-mono">
              
              {/* Account Header */}
              <div className="px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Profile Account</span>
                  {provider !== 'email' && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] uppercase font-bold">
                      {provider}
                    </span>
                  )}
                </div>
                <div className="text-white font-bold truncate text-[11px]">{userEmail}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-telemetry pt-1">
                  <Terminal className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="truncate">Key: {apiKey.substring(0, 12)}...</span>
                </div>
              </div>

              {/* Theme Toggle & Currency Quick Info */}
              <div className="py-1 space-y-0.5">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 rounded text-zinc-300 hover:bg-[#16161A] hover:text-white transition-colors"
                >
                  <span>Theme Mode</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-[#1E1E24] bg-[#08080A]">
                    {theme}
                  </span>
                </button>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded text-zinc-300 hover:bg-[#16161A] hover:text-white transition-colors"
                >
                  <span>Currency Display</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-[#1E1E24] bg-[#08080A] text-emerald-400">
                    {currency}
                  </span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-zinc-300 hover:bg-[#16161A] hover:text-white transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  Settings & Configurations
                </Link>
              </div>

              {/* Sign Out */}
              <div className="pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-400" />
                  Sign Out
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}
