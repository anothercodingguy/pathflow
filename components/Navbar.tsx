'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Play, GitBranch, ArrowLeftRight, Settings, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [apiKey, setApiKey] = useState('pf_live_secret_key');
  const [currency, setCurrency] = useState<CurrencyMode>('USD');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = session?.user?.email || 'admin@pathflow.dev';
  const userName = session?.user?.name || 'Developer';
  const userImage = session?.user?.image;
  const userApiKey = (session?.user as any)?.apiKey || apiKey;

  useEffect(() => {
    const key = localStorage.getItem('pathflow_api_key');
    const savedCurrency = localStorage.getItem('pathflow_currency') as CurrencyMode;
    const savedTheme = localStorage.getItem('pathflow_theme') as 'dark' | 'light';

    if (key) setApiKey(key);
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

  const handleSignOut = async () => {
    localStorage.removeItem('pathflow_api_key');
    localStorage.removeItem('pathflow_auth_provider');
    document.cookie = 'authjs.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'pathflow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await signOut({ callbackUrl: '/login' });
  };

  const navItems = [
    { label: 'Runs', href: '/runs', icon: Play },
    { label: 'Compare', href: '/compare', icon: ArrowLeftRight },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header className="h-12 border-b border-[#1E1E24] bg-[#09090B] px-4 flex items-center justify-between text-xs select-none sticky top-0 z-50">
      
      {/* Brand & Core Navigation */}
      <div className="flex items-center gap-6">
        <Link href="/runs" className="flex items-center gap-2 group">
          <span className="font-extrabold tracking-tight text-white uppercase text-sm font-sans">
            PATH<span className="text-blue-500">FLOW</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors font-medium ${
                  isActive
                    ? 'bg-[#18181B] text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Menu */}
      <div className="flex items-center gap-3">
        
        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#111113] hover:bg-[#18181B] border border-[#1E1E24] text-zinc-300 transition-colors cursor-pointer"
          >
            {userImage ? (
              <img src={userImage} alt={userName} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px]">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-mono text-[11px] max-w-[140px] truncate text-zinc-200">{userEmail}</span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded border border-[#1E1E24] bg-[#0F0F12] shadow-xl py-1 z-50 text-xs font-mono">
              <div className="px-3 py-2 border-b border-[#1E1E24] space-y-1">
                <p className="font-sans font-semibold text-white truncate">{userName}</p>
                <p className="text-zinc-400 text-[11px] truncate">{userEmail}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:bg-[#18181B] hover:text-white transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-zinc-400" />
                <span>Settings & API Keys</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-[#1E1E24] mt-1 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
