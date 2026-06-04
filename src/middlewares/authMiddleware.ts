import { Request, Response, NextFunction } from 'express';
import {
  verifyAccessToken,
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
  JwtPayload,
} from '../utils/jwt';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      userId?: string;
    }
  }
}

const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.trim().match(BEARER_PATTERN);
  if (!match) return null;
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new AppError('Authentication required', 401, 'AUTH_MISSING'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.userId = payload.userId;
    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    if (error instanceof NotBeforeError) {
      return next(new AppError('Token not yet valid', 401, 'TOKEN_INACTIVE'));
    }
    if (error instanceof JsonWebTokenError) {
      return next(new AppError('Invalid token', 401, 'TOKEN_INVALID'));
    }
    return next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.userId = payload.userId;
  } catch {
    // optional auth: ignore invalid tokens
  }

  return next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_MISSING'));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    return next();
  };
}

export const auth = { authenticate, optionalAuth, requireRole };
export default auth;
