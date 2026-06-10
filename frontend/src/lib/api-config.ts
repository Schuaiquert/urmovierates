// frontend/src/lib/api-config.ts
/**
 * Centralized client-side configuration for the API layer.
 *
 * - NEXT_PUBLIC_* env vars are inlined at build time by Next.js. They are PUBLIC
 *   (visible in the browser bundle), so never put a real backend secret here.
 *   The X-API-Key is a shared secret deliberately designed to be public to the
 *   client — the backend gates it via timing-safe comparison and rate-limits
 *   abuse separately.
 *
 * - Adding new client-visible env vars? Declare them here with a sensible
 *   fallback and export a typed accessor. Don't read `process.env` ad-hoc in
 *   services or hooks.
 */

const RAW_API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

if (!RAW_API_KEY && typeof window !== 'undefined') {
  // Loud, runtime warning so a missing var is impossible to ship silently.
  // eslint-disable-next-line no-console
  console.warn(
    '[api-config] NEXT_PUBLIC_API_KEY is empty. Protected requests will return 401 API_KEY_MISSING. ' +
      'Add it to frontend/.env.local (see frontend/.env.example).',
  );
}

export const API_KEY_HEADER = 'X-API-Key';

/**
 * The shared secret sent in the X-API-Key header. Empty string means the env
 * var was not set — the interceptor will still attach the header (axios will
 * drop empty headers), but the backend will reject the request.
 */
export const API_KEY: string = RAW_API_KEY;
