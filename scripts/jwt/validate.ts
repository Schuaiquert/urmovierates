// Validacao completa do JWT apos migracao para userId: number
import 'dotenv/config';
import * as jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  TokenExpiredError,
  JsonWebTokenError,
} from '../../src/utils/jwt';

const ACCESS_SECRET = process.env.JWT_SECRET!;
const ISSUER = process.env.JWT_ISSUER || 'urmovierates';
const AUDIENCE = process.env.JWT_AUDIENCE || 'urmovierates-api';
if (!ACCESS_SECRET) throw new Error('JWT_SECRET não definido');

const GREEN = '\x1b[32m✓\x1b[0m';
const RED = '\x1b[31m✗\x1b[0m';
let failed = 0;
const check = (label: string, ok: boolean, detail = '') => {
  if (ok) console.log(`${GREEN} ${label}${detail ? ' — ' + detail : ''}`);
  else { console.log(`${RED} ${label}${detail ? ' — ' + detail : ''}`); failed++; }
};
const section = (title: string) => console.log(`\n\x1b[1m--- ${title} ---\x1b[0m`);

const signRaw = (payload: object, opts: jwt.SignOptions) =>
  jwt.sign(payload, ACCESS_SECRET, { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, ...opts });

(async () => {
  section('1. Geração de tokens');
  const payload = { userId: 42, email: 'pedro@urmovierates.com', role: 'USER' as const };
  const access = generateAccessToken(payload);
  const refresh = generateRefreshToken(payload);
  const pair = generateTokenPair(payload);
  check('generateAccessToken retorna string não-vazia', typeof access === 'string' && access.length > 0);
  check('generateRefreshToken retorna string não-vazia', typeof refresh === 'string' && refresh.length > 0);
  check('generateTokenPair retorna {accessToken, refreshToken}', typeof pair.accessToken === 'string' && typeof pair.refreshToken === 'string');
  check('access ≠ refresh', access !== refresh);

  section('2. verifyAccessToken (token válido)');
  const decodedAccess = verifyAccessToken(access);
  check('userId é number (não string) — era string pré-migração', typeof decodedAccess.userId === 'number', `tipo=${typeof decodedAccess.userId}, valor=${decodedAccess.userId}`);
  check('userId preserva valor exato (42)', decodedAccess.userId === 42);
  check('email preservado', decodedAccess.email === payload.email);
  check('role preservado', decodedAccess.role === 'USER');
  check('type === "access"', decodedAccess.type === 'access');
  check('iat presente', typeof decodedAccess.iat === 'number');
  check('exp presente e futuro', typeof decodedAccess.exp === 'number' && decodedAccess.exp > Math.floor(Date.now()/1000));
  check('iss correto', decodedAccess.iss === ISSUER);
  check('aud correto', decodedAccess.aud === AUDIENCE);

  section('3. verifyRefreshToken (token válido)');
  const decodedRefresh = verifyRefreshToken(refresh);
  check('userId é number no refresh', typeof decodedRefresh.userId === 'number', `valor=${decodedRefresh.userId}`);
  check('type === "refresh"', decodedRefresh.type === 'refresh');

  section('4. Tipos de token não se cruzam');
  let wrongTypeRejected = false;
  try { verifyAccessToken(refresh); } catch (e) { wrongTypeRejected = e instanceof JsonWebTokenError; }
  check('verifyAccessToken rejeita refresh token', wrongTypeRejected);
  let wrongTypeRejected2 = false;
  try { verifyRefreshToken(access); } catch (e) { wrongTypeRejected2 = e instanceof JsonWebTokenError; }
  check('verifyRefreshToken rejeita access token', wrongTypeRejected2);

  section('5. Tokens inválidos são rejeitados');
  let invalidRejected = false;
  try { verifyAccessToken('not-a-real-jwt'); } catch (e) { invalidRejected = e instanceof JsonWebTokenError; }
  check('rejeita string que não é JWT', invalidRejected);
  let garbageRejected = false;
  try { verifyAccessToken('a.b.c'); } catch (e) { garbageRejected = e instanceof JsonWebTokenError; }
  check('rejeita JWT malformado (3 partes mas inválido)', garbageRejected);
  const emptyRejected = (() => { try { verifyAccessToken(''); return false; } catch (e) { return e instanceof JsonWebTokenError; } })();
  check('rejeita string vazia', emptyRejected);

  section('6. Adulteração de assinatura é rejeitada');
  const tampered = access.slice(0, -3) + 'XYZ';
  let tamperedRejected = false;
  try { verifyAccessToken(tampered); } catch (e) { tamperedRejected = e instanceof JsonWebTokenError; }
  check('assinatura adulterada rejeitada', tamperedRejected);

  section('7. decodeToken (sem verificar)');
  const decoded = decodeToken(access);
  check('decodeToken retorna objeto', decoded !== null);
  check('userId no decoded é number', typeof decoded?.userId === 'number', `valor=${decoded?.userId}`);
  const nullDecoded = decodeToken('lixo');
  check('decodeToken("lixo") retorna null', nullDecoded === null);

  section('8. Token expirado');
  const expired = signRaw(
    { userId: 99, email: 'old@x.com', role: 'USER', type: 'access' },
    { expiresIn: '-1s' }
  );
  let expiredRejected = false;
  let expiredType = '';
  try { verifyAccessToken(expired); } catch (e) {
    expiredRejected = true;
    expiredType = e instanceof TokenExpiredError ? 'TokenExpiredError' : (e instanceof JsonWebTokenError ? 'JsonWebTokenError' : 'outro');
  }
  check('token expirado é rejeitado', expiredRejected);
  check('tipo do erro é TokenExpiredError (catches específicos funcionam)', expiredType === 'TokenExpiredError', `tipo=${expiredType}`);

  section('9. Issuer / Audience inválidos');
  const wrongIss = jwt.sign(
    { userId: 1, email: 'x@x.com', role: 'USER', type: 'access' },
    ACCESS_SECRET,
    { algorithm: 'HS256', issuer: 'wrong-issuer', audience: AUDIENCE, expiresIn: '15m' }
  );
  let issRejected = false;
  try { verifyAccessToken(wrongIss); } catch (e) { issRejected = e instanceof JsonWebTokenError; }
  check('token com issuer errado é rejeitado', issRejected);

  const wrongAud = jwt.sign(
    { userId: 1, email: 'x@x.com', role: 'USER', type: 'access' },
    ACCESS_SECRET,
    { algorithm: 'HS256', issuer: ISSUER, audience: 'wrong-audience', expiresIn: '15m' }
  );
  let audRejected = false;
  try { verifyAccessToken(wrongAud); } catch (e) { audRejected = e instanceof JsonWebTokenError; }
  check('token com audience errado é rejeitado', audRejected);

  section('10. Token com role ADMIN');
  const admin = generateAccessToken({ userId: 1, email: 'adm@x.com', role: 'ADMIN' });
  const decodedAdmin = verifyAccessToken(admin);
  check('role ADMIN preservado', decodedAdmin.role === 'ADMIN');
  check('userId 1 preservado como number', decodedAdmin.userId === 1);

  section('11. Proteção contra alg=none (assinatura obrigatória)');
  const noneAlg = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' +
    Buffer.from(JSON.stringify({ userId: 999, email: 'h@x.com', role: 'ADMIN', type: 'access', iss: ISSUER, aud: AUDIENCE, exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url') + '.';
  let noneRejected = false;
  try { verifyAccessToken(noneAlg); } catch (e) { noneRejected = e instanceof JsonWebTokenError; }
  check('token forjado com alg=none é rejeitado', noneRejected);

  section('12. JTI único por token (jwtid)');
  const t1 = generateAccessToken(payload);
  const t2 = generateAccessToken(payload);
  const d1 = decodeToken(t1);
  const d2 = decodeToken(t2);
  check('jti presente', typeof d1?.jti === 'string' && d1.jti.length > 0);
  check('jti difere entre tokens (replay protection)', d1?.jti !== d2?.jti, `t1.jti=${d1?.jti?.slice(0,8)} t2.jti=${d2?.jti?.slice(0,8)}`);

  section('13. Fluxo end-to-end (generate → verify → payload intacto)');
  const e2e = generateTokenPair({ userId: 7, email: 'e2e@x.com', role: 'USER' });
  const a = verifyAccessToken(e2e.accessToken);
  const r = verifyRefreshToken(e2e.refreshToken);
  check('access.userId 7', a.userId === 7);
  check('refresh.userId 7', r.userId === 7);
  check('mesmo email nos dois', a.email === r.email);

  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log(`${GREEN} TODOS OS TESTES PASSARAM`);
    process.exit(0);
  } else {
    console.log(`${RED} ${failed} TESTE(S) FALHARAM`);
    process.exit(1);
  }
})().catch(e => { console.error('ERRO FATAL:', e); process.exit(1); });
