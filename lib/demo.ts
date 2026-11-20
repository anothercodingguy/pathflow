/**
 * Demo-data helpers.
 *
 * PathFlow ships with built-in sample traces (lib/mockData.ts, also seeded
 * into the database with `isDemo: true`). The API returns them to the demo
 * workspace and, as a fallback, to accounts that have no data yet. That is a
 * legitimate feature, but the UI must say so: sample data should never look
 * like the signed-in user's own telemetry. These helpers let a page tell
 * which of the records it received are sample records.
 */
import { MOCK_RUNS, MOCK_AGENTS, MOCK_SESSIONS } from './mockData';

const DEMO_RUN_IDS = new Set<string>(MOCK_RUNS.map((r) => r.id));
const DEMO_AGENT_IDS = new Set<string>(MOCK_AGENTS.map((a) => a.id));
// Sessions are grouped by `sessionId`; a run without one is given
// "session_" + the first 8 characters of its id by app/api/v1/sessions.
const DEMO_SESSION_IDS = new Set<string>([
  ...(MOCK_SESSIONS as Array<{ sessionId: string }>).map((s) => s.sessionId),
  ...MOCK_RUNS.map((r) => r.sessionId || `session_${r.id.substring(0, 8)}`),
]);

export function isDemoRunId(id: string | undefined | null): boolean {
  return !!id && DEMO_RUN_IDS.has(id);
}

export function isDemoRun(run: { id: string; isDemo?: boolean }): boolean {
  return run.isDemo === true || DEMO_RUN_IDS.has(run.id);
}

export function isDemoAgentId(id: string | undefined | null): boolean {
  return !!id && DEMO_AGENT_IDS.has(id);
}

export function isDemoSessionId(id: string | undefined | null): boolean {
  return !!id && DEMO_SESSION_IDS.has(id);
}

/** 'all' = everything shown is sample data, 'some' = a mix, 'none' = all real. */
export type DemoScope = 'all' | 'some' | 'none';

export function demoScope<T>(items: T[], isDemo: (item: T) => boolean): DemoScope {
  if (items.length === 0) return 'none';
  // In the demo workspace nobody is signed in, so everything shown is sample data.
  if (isDemoWorkspace()) return 'all';
  const n = items.filter(isDemo).length;
  if (n === 0) return 'none';
  return n === items.length ? 'all' : 'some';
}

/** The login page's "demo workspace" button sets this cookie value. */
export const DEMO_SESSION_COOKIE_VALUE = 'pf_demo_guest_session';

export function isDemoWorkspace(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c === `pathflow_session=${DEMO_SESSION_COOKIE_VALUE}`);
}

/** Base path prefix for client-side fetches (the app is served under /app). */
export function apiBase(): string {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
}
