'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Settings, LogOut, ChevronDown } from 'lucide-react';
import { CurrencyMode } from '@/lib/data';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [apiKey, setApiKey] = useState('pf_live_secret_key');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userEmail = session?.user?.email || 'admin@pathflow.dev';
  const userName = session?.user?.name || 'Developer';
  const userImage = session?.user?.image;

  useEffect(() => {
    const key = localStorage.getItem('pathflow_api_key');
    if (key) setApiKey(key);
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
    { label: 'Runs', href: '/runs' },
    { label: 'Compare', href: '/compare' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <header className="h-11 border-b border-white/[0.07] bg-[#0C0C0F] px-5 flex items-center justify-between text-xs select-none sticky top-0 z-50 font-sans">
      
      {/* Brand & Quieter Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/runs" className="flex items-center gap-2 group">
          <span className="font-black tracking-tight text-white uppercase text-xs font-sans">
            PATH<span className="text-blue-500">FLOW</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-3.5 font-medium transition-colors relative ${
                  isActive
                    ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Menu */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#14141A] hover:bg-[#1A1A22] border border-white/[0.08] text-zinc-300 transition-colors cursor-pointer"
          >
            {userImage ? (
              <img src={userImage} alt={userName} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-blue-600/80 text-white flex items-center justify-center font-bold text-[9px]">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-mono text-[11px] max-w-[150px] truncate text-zinc-200">{userEmail}</span>
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-lg border border-white/10 bg-[#121217] shadow-2xl py-1 z-50 text-xs font-mono">
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
  );
}
