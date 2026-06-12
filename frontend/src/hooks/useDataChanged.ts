'use client';

import { useEffect } from 'react';

/**
 * Kinds of mutations that can invalidate cached server data. The detail
 * argument is freeform so callers can attach whatever they need (e.g. the
 * affected `movieId` for an edit/delete).
 */
export type DataChangeKind =
  | 'movie:created'
  | 'movie:updated'
  | 'movie:deleted'
  | 'review:created'
  | 'review:updated'
  | 'review:deleted'
  | 'favorite:added'
  | 'favorite:removed'
  | 'favorite:toggled';

export interface DataChangedEvent {
  kind: DataChangeKind;
  /** Affected movieId when known (e.g. for movie:updated, movie:deleted, any review or favorite event). */
  movieId?: number | string;
}

const EVENT_NAME = 'app:data-changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Broadcast a data-change event. Safe to call from anywhere (hooks, event
 * handlers, axios interceptors). No-ops on the server.
 */
export function emitDataChanged(detail: DataChangedEvent): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent<DataChangedEvent>(EVENT_NAME, { detail }));
}

/**
 * Subscribe to data-change events. Pass an optional `filter` to react to
 * only the kinds you care about — handlers run only for matching events.
 *
 * The hook re-binds the listener when `filter` changes, so callers should
 * pass a stable reference (use `useCallback` or a module-level constant).
 */
export function useDataChanged(
  handler: (detail: DataChangedEvent) => void,
  filter?: DataChangeKind | DataChangeKind[],
): void {
  useEffect(() => {
    if (!isBrowser()) return;
    const wanted: ReadonlySet<string> | null = filter
      ? new Set(Array.isArray(filter) ? filter : [filter])
      : null;

    const listener = (e: Event) => {
      const ce = e as CustomEvent<DataChangedEvent>;
      const detail = ce.detail;
      if (!detail) return;
      if (wanted && !wanted.has(detail.kind)) return;
      handler(detail);
    };

    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
  }, [handler, filter]);
}
