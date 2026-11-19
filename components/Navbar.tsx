'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Settings, LogOut, ChevronDown, Search, BarChart3, AlertTriangle, Zap, Users,
  Radio, Layers, Sun, Moon, MessageSquare, Menu, X, ArrowUpRight, FlaskConical,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { isDemoWorkspace } from '@/lib/demo';
import { cn } from '@/lib/cn';

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
  {
    label: 'Workspace',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

// Each suggestion is a filter the Runs page really understands (see the
// "Search syntax" block in app/runs/page.tsx).
const searchSuggestions = [
  { label: 'Failed runs', query: 'status:failed' },
  { label: 'Runs longer than 2s', query: 'duration>2000' },
  { label: 'Runs costing more than $0.05', query: 'cost>0.05' },
  { label: 'Runs on Claude models', query: 'model:claude' },
];

const iconButton =
  'inline-flex size-8 items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors hover:border-line-strong hover:text-ink';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [demoWorkspace, setDemoWorkspace] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Without a Google session we do not know who this is. Say what we do know
  // (demo workspace or API-key session) instead of showing a made-up identity.
  const userName = session?.user?.name || (demoWorkspace ? 'Demo workspace' : 'API key session');
  const userEmail = session?.user?.email || (demoWorkspace ? 'Sample data. Not signed in.' : 'Signed in with an API key');
  const userImage = session?.user?.image;

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
    if (!isLight) document.documentElement.classList.add('dark');
    setDemoWorkspace(isDemoWorkspace());
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('pathflow_theme', nextTheme);
  };

  // Close the profile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keys: Cmd/Ctrl+K opens search, Esc closes the menus.
  // (The search dialog handles its own Esc inside <Modal>.)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setIsProfileOpen((open) => {
          if (open) profileButtonRef.current?.focus();
          return false;
        });
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigating closes the mobile menu and the profile menu
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

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

  const runSearch = (query: string) => {
    router.push(`/runs?q=${encodeURIComponent(query)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) runSearch(searchQuery.trim());
  };

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://thepathflow.online';

  const menuItem = 'flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-ink-2 transition-colors hover:bg-raised hover:text-ink';

  return (
    <>
      <header className="sticky top-0 z-50 h-11 border-b border-line bg-inset font-sans text-[13px] select-none">
        <div className="flex h-full items-center justify-between gap-2 px-3 sm:px-4">

          {/* Brand + primary navigation */}
          <div className="flex min-w-0 items-center gap-2 lg:gap-5">
            {/* Mobile menu button (below lg the links do not fit in one row) */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((o) => !o)}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
              className={cn(iconButton, 'lg:hidden')}
            >
              {isMenuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>

            <a
              href={marketingUrl}
              title="PathFlow home"
              className="shrink-0 text-xs font-black uppercase tracking-tight text-ink transition-opacity hover:opacity-80"
            >
              PATH<span className="text-accent">FLOW</span>
            </a>

            {demoWorkspace && (
              <span
                title="You are in the demo workspace: everything shown is built-in sample data."
                className="hidden items-center gap-1 rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 font-mono text-2xs font-semibold leading-none text-warn sm:inline-flex"
              >
                <FlaskConical className="size-3" aria-hidden />
                Demo workspace
              </span>
            )}

            <nav aria-label="Primary" className="hidden items-center lg:flex">
              {navGroups.map((group, gi) => (
                <div key={group.label} className="flex items-center">
                  {gi > 0 && <span aria-hidden className="mx-1.5 h-4 w-px bg-line" />}
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                          active ? 'bg-tint/[0.08] text-ink' : 'text-ink-2 hover:bg-tint/[0.04] hover:text-ink'
                        )}
                      >
                        <Icon className={cn('size-3.5', active && 'text-accent-ink')} aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          {/* Right side: search, theme, profile */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search runs"
              aria-keyshortcuts="Meta+K Control+K"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2.5 font-mono text-2xs text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              <Search className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Search runs</span>
              <kbd className="hidden rounded bg-tint/[0.08] px-1.5 py-0.5 font-mono text-2xs text-ink-2 sm:inline-flex">⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className={iconButton}
            >
              {theme === 'dark' ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                ref={profileButtonRef}
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label={`Account menu for ${userName}`}
                aria-expanded={isProfileOpen}
                aria-controls="account-menu"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt="" className="size-4 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="flex size-4 items-center justify-center rounded-full bg-accent-strong text-2xs font-bold leading-none text-white">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
                <ChevronDown className={cn('size-3 transition-transform', isProfileOpen && 'rotate-180')} aria-hidden />
              </button>

              {isProfileOpen && (
                <div
                  id="account-menu"
                  className="absolute right-0 z-50 mt-1.5 w-60 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-line-strong bg-surface py-1 shadow-2xl animate-fade-in"
                >
                  <div className="space-y-0.5 border-b border-line px-3 py-2">
                    <p className="truncate text-xs font-semibold text-ink">{userName}</p>
                    <p className="truncate font-mono text-2xs text-ink-2">{userEmail}</p>
                  </div>

                  <Link href="/settings" className={menuItem}>
                    <Settings className="size-3.5" aria-hidden />
                    <span>Settings &amp; API keys</span>
                  </Link>

                  <Link href="/settings/billing" className={menuItem}>
                    <Zap className="size-3.5 text-violet" aria-hidden />
                    <span>Billing &amp; plans</span>
                  </Link>

                  <button type="button" onClick={toggleTheme} className={menuItem}>
                    {theme === 'dark' ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
                    <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
                  </button>

                  <a href={marketingUrl} target="_blank" rel="noopener noreferrer" className={cn(menuItem, 'border-t border-line')}>
                    <ArrowUpRight className="size-3.5" aria-hidden />
                    <span>Marketing website</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={cn(menuItem, 'border-t border-line text-bad hover:bg-bad/10 hover:text-bad')}
                  >
                    <LogOut className="size-3.5" aria-hidden />
                    <span>{demoWorkspace ? 'Leave demo workspace' : 'Sign out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {isMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Primary"
            className="absolute inset-x-0 top-11 max-h-[calc(100dvh-2.75rem)] overflow-y-auto border-b border-line bg-inset px-3 pb-3 pt-1 shadow-2xl animate-fade-in lg:hidden"
          >
            {demoWorkspace && (
              <p className="mt-2 flex items-center gap-1.5 rounded border border-warn/40 bg-warn/10 px-2 py-1.5 font-mono text-2xs font-semibold text-warn sm:hidden">
                <FlaskConical className="size-3" aria-hidden />
                Demo workspace: sample data
              </p>
            )}
            {navGroups.map((group) => (
              <div key={group.label} className="pt-3">
                <p className="px-2 pb-1 font-mono text-2xs font-semibold uppercase tracking-wide text-ink-3">{group.label}</p>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-10 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors',
                        active ? 'bg-tint/[0.08] text-ink' : 'text-ink-2 hover:bg-tint/[0.04] hover:text-ink'
                      )}
                    >
                      <Icon className={cn('size-4', active && 'text-accent-ink')} aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        )}
      </header>

      {/* Search dialog (Cmd/Ctrl+K). It filters the Runs list; there is no AI behind it. */}
      <Modal
        open={isSearchOpen}
        onClose={closeSearch}
        title="Search runs"
        icon={<Search className="size-3.5 text-accent-ink" aria-hidden />}
        initialFocusRef={searchRef}
      >
        <form onSubmit={handleSearch} className="pt-3" role="search">
          <label htmlFor="global-search" className="sr-only">
            Search runs by title, agent, error or ID
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-inset px-3 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
            <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
            <input
              id="global-search"
              ref={searchRef}
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Title, agent, error, ID, or status:failed  model:claude  cost>0.02"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus-bare h-8 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              aria-label="Search"
              className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent-strong text-white transition-colors hover:bg-accent disabled:opacity-40"
            >
              <span aria-hidden>↵</span>
            </button>
          </div>
        </form>

        <div className="mt-3 border-t border-line pt-2">
          <p className="px-1 pb-1.5 font-mono text-2xs font-semibold uppercase tracking-wide text-ink-3">Quick filters</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {searchSuggestions.map((sug) => (
              <button
                key={sug.query}
                type="button"
                onClick={() => runSearch(sug.query)}
                className="flex items-center justify-between gap-2 rounded-md bg-tint/[0.04] px-2.5 py-2 text-left text-xs text-ink-2 transition-colors hover:bg-tint/[0.08] hover:text-ink"
              >
                <span className="truncate">{sug.label}</span>
                <code className="shrink-0 font-mono text-2xs text-ink-3">{sug.query}</code>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-1 font-mono text-2xs text-ink-3">
          <span><kbd className="rounded bg-tint/10 px-1 py-0.5 text-ink-2">Esc</kbd> to close</span>
          <span><kbd className="rounded bg-tint/10 px-1 py-0.5 text-ink-2">⌘K</kbd> / <kbd className="rounded bg-tint/10 px-1 py-0.5 text-ink-2">Ctrl K</kbd> anywhere</span>
        </div>
      </Modal>
    </>
  );
}
