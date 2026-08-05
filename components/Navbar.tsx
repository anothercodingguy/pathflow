'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Activity, GitFork, Trophy, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/feed', icon: Activity },
    { label: 'Inspector', href: '/paths/path-1', icon: GitFork },
    { label: 'Leaderboards', href: '/leaderboards', icon: Trophy },
    { label: 'Resume', href: '/dashboard', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#0A0A0C]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/feed" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FC4C02] text-white shadow-sm">
              <Flame className="h-4 w-4 fill-white stroke-none" />
            </div>
            <span className="font-bold tracking-tight text-white text-base font-sans uppercase">
              PATH<span className="text-[#FC4C02]">FLOW</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href.startsWith('/paths') && pathname?.startsWith('/paths'));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-zinc-800/60 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md border border-zinc-800 bg-[#111113] p-1 pr-3 hover:border-zinc-700 transition-colors text-xs text-zinc-300">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Suyash"
              className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
            />
            <span className="font-medium text-white">Suyash</span>
          </Link>
        </div>

      </div>
    </header>
  );
}
