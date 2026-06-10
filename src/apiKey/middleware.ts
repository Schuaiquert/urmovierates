import { Request, Response, NextFunction } from 'express';
import { API_KEY_HEADER } from './config';
import { isValidApiKey } from './secureCompare';
import { AppError } from '../middlewares/errorHandler';

const HEADER_NAME_LC = API_KEY_HEADER.toLowerCase();

/**
 * Express middleware that requires a valid `X-API-Key` header.
 *
 * - 401 Unauthorized when the header is missing or not a non-empty string.
 * - 403 Forbidden when the header is present but does not match the configured key.
 *
 * Responses follow the project standard: { error: string, code: string }.
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  // Express normalizes header names to lowercase. Use bracket access to be safe
  // regardless of casing in the spec.
  const raw = req.headers[HEADER_NAME_LC];

  if (raw === undefined || raw === null) {
    return next(new AppError('X-API-Key header is required', 401, 'API_KEY_MISSING'));
  }

  // Reject non-string, arrays, etc. (e.g. duplicated headers end up as string[]).
  if (typeof raw !== 'string' || raw.length === 0) {
    return next(new AppError('X-API-Key header is invalid', 401, 'API_KEY_INVALID'));
  }

  if (!isValidApiKey(raw)) {
    return next(new AppError('Invalid X-API-Key', 403, 'API_KEY_FORBIDDEN'));
  }

  return next();
}

export default apiKeyAuth;
