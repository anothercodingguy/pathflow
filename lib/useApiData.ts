'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiBase } from './demo';

/**
 * Fetch JSON from one of this app's API routes and track the three states a
 * screen has to render honestly:
 *
 *   loading  the request is in flight (show a loading state)
 *   error    the request failed (show an error state with Retry; never fall
 *            back to sample data)
 *   data     the request worked (may still be an empty list: show an empty state)
 *
 * `path` is relative to the app, e.g. '/api/v1/agents'. Change `path` (for
 * example by adding a query string) and it refetches. `pick` pulls the part
 * you need out of the JSON body.
 */
export function useApiData<T>(path: string, pick: (json: any) => T) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest `pick` without making it a dependency (callers pass inline functions).
  const pickRef = useRef(pick);
  pickRef.current = pick;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}${path}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? 'You are not signed in (HTTP 401).'
            : `The server answered with HTTP ${res.status}.`
        );
      }
      const json = await res.json();
      setData(pickRef.current(json));
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'The request failed.');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
