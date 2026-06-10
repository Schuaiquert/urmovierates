import { timingSafeEqual } from 'crypto';
import { API_KEY } from './config';

/**
 * Constant-time comparison of the candidate header value against the configured API_KEY.
 * Returns false for any structural mismatch (non-string, length mismatch, wrong content)
 * without leaking timing information beyond the length check.
 */
export function isValidApiKey(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    return false;
  }
  if (candidate.length !== API_KEY.length) {
    return false;
  }

  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(API_KEY, 'utf8');

  if (a.length !== b.length) {
    return false;
  }

  // timingSafeEqual requires equal-length buffers; we already enforced that above.
  return timingSafeEqual(a, b);
}
