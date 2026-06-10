import jwt, {
  SignOptions,
  VerifyOptions,
  Algorithm,
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
  JwtPayload as BaseJwtPayload,
} from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export { JsonWebTokenError, TokenExpiredError, NotBeforeError };

const ACCESS_TOKEN_TYPE = 'access';
const REFRESH_TOKEN_TYPE = 'refresh';

const ALGORITHM: Algorithm = 'HS256';

function requireSecret(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value || value.length < 32) {
    throw new Error(
      `Environment variable ${name} must be set with at least 32 characters`
    );
  }
  return value;
}

const ACCESS_SECRET = requireSecret('JWT_SECRET');
const REFRESH_SECRET = requireSecret(
  'JWT_REFRESH_SECRET',
  process.env.JWT_SECRET
);
const JWT_ISSUER = process.env.JWT_ISSUER || 'urmovierates';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'urmovierates-api';
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JwtPayload extends BaseJwtPayload {
  userId: number;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface AccessTokenPayload {
  userId: number;
  email: string;
  role: string;
}

const baseSignOptions: SignOptions = {
  algorithm: ALGORITHM,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  jwtid: uuidv4(),
};

const baseVerifyOptions: VerifyOptions = {
  algorithms: [ALGORITHM],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    { ...payload, type: ACCESS_TOKEN_TYPE },
    ACCESS_SECRET,
    { ...baseSignOptions, expiresIn: ACCESS_EXPIRES_IN as SignOptions['expiresIn'] }
  );
}

export function generateRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    { ...payload, type: REFRESH_TOKEN_TYPE },
    REFRESH_SECRET,
    { ...baseSignOptions, expiresIn: REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }
  );
}

export function generateTokenPair(payload: AccessTokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

function verifyWithSecret(
  token: string,
  secret: string,
  expectedType: 'access' | 'refresh'
): JwtPayload {
  const decoded = jwt.verify(token, secret, baseVerifyOptions) as JwtPayload;
  if (!decoded || !decoded.type) {
    throw new JsonWebTokenError('Malformed token');
  }
  if (decoded.type !== expectedType) {
    throw new JsonWebTokenError(`Invalid token type, expected ${expectedType}`);
  }
  return decoded;
}

export function verifyAccessToken(token: string): JwtPayload {
  return verifyWithSecret(token, ACCESS_SECRET, 'access');
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verifyWithSecret(token, REFRESH_SECRET, 'refresh');
}

export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') return null;
  return decoded as JwtPayload;
}
