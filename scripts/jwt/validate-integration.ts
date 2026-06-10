// Integracao do JWT com o authService real: login, refresh, me, update, delete
// Garante que o userId: number flui ponta-a-ponta sem perda de tipo.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { authService } from '../../src/services/authService';
import {
  verifyAccessToken,
  verifyRefreshToken,
  TokenExpiredError,
  JsonWebTokenError,
} from '../../src/utils/jwt';

const prisma = new PrismaClient();
const GREEN = '\x1b[32m✓\x1b[0m';
const RED = '\x1b[31m✗\x1b[0m';
let failed = 0;
const check = (label: string, ok: boolean, detail = '') => {
  if (ok) console.log(`${GREEN} ${label}${detail ? ' — ' + detail : ''}`);
  else { console.log(`${RED} ${label}${detail ? ' — ' + detail : ''}`); failed++; }
};
const section = (title: string) => console.log(`\n\x1b[1m--- ${title} ---\x1b[0m`);

(async () => {
  const TEST_EMAIL = `jwt-test-${Date.now()}@example.com`;
  const TEST_PASSWORD = 'TestPass123!';

  section('Setup: criar usuário de teste');
  let created: { id: number; email: string };
  try {
    const u = await authService.register({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'JWT Test' });
    const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    created = dbUser!;
    check('usuário criado', !!created);
    check('userId do banco é number', typeof created.id === 'number', `id=${created.id}`);
  } catch (e: any) {
    console.error('Falha no setup:', e.message);
    process.exit(1);
  }

  section('1. login retorna tokens + user');
  const login = await authService.login({ email: TEST_EMAIL, password: TEST_PASSWORD });
  check('login retorna accessToken', typeof login.accessToken === 'string' && login.accessToken.length > 0);
  check('login retorna refreshToken', typeof login.refreshToken === 'string' && login.refreshToken.length > 0);
  check('login.user.id é number', typeof login.user.id === 'number', `id=${login.user.id}`);
  check('login.user.id bate com o do banco', login.user.id === created.id);

  section('2. Tokens do login carregam userId: number');
  const decodedAccess = verifyAccessToken(login.accessToken);
  check('access.userId é number', typeof decodedAccess.userId === 'number');
  check('access.userId bate com login.user.id', decodedAccess.userId === login.user.id);
  check('access.email correto', decodedAccess.email === TEST_EMAIL);

  const decodedRefresh = verifyRefreshToken(login.refreshToken);
  check('refresh.userId é number', typeof decodedRefresh.userId === 'number');
  check('refresh.userId bate', decodedRefresh.userId === created.id);

  section('3. Fluxo refresh');
  const refreshed = await authService.refresh(login.refreshToken);
  check('refresh retorna novos accessToken/refreshToken', typeof refreshed.accessToken === 'string' && typeof refreshed.refreshToken === 'string');
  check('refresh.token == accessToken', refreshed.token === refreshed.accessToken);
  check('refresh.user.id === userId original', refreshed.user.id === created.id);

  // O refresh original agora deve falhar? Não, JWT não tem revocation list. Vamos só
  // verificar que o NOVO access token funciona.
  const newAccess = verifyAccessToken(refreshed.accessToken);
  check('novo access.userId é number', typeof newAccess.userId === 'number');
  check('novo access.userId bate com original', newAccess.userId === created.id);

  section('4. authService.me(userId) com number');
  const me = await authService.me(created.id);
  check('me retorna user', me !== null);
  check('me.id é number', typeof me!.id === 'number');
  check('me.id === userId', me!.id === created.id);

  section('5. authService.updateMe(userId, data) com number');
  const updated = await authService.updateMe(created.id, { name: 'JWT Test Updated' });
  check('update funcionou', updated.name === 'JWT Test Updated');
  check('updated.id === userId', updated.id === created.id);

  section('6. authService.refresh com refresh token INVÁLIDO');
  let badRefreshRejected = false;
  let badRefreshType = '';
  try {
    await authService.refresh('invalid.token.here');
  } catch (e: any) {
    badRefreshRejected = true;
    // authService traduz para AppError com code REFRESH_TOKEN_INVALID
    badRefreshType = e.code || 'no-code';
  }
  check('refresh inválido rejeitado', badRefreshRejected);
  check('erro mapeado para REFRESH_TOKEN_INVALID', badRefreshType === 'REFRESH_TOKEN_INVALID', `code=${badRefreshType}`);

  section('7. authService.refresh com access token (tipo errado)');
  let wrongTypeRejected = false;
  try {
    await authService.refresh(login.accessToken);
  } catch (e: any) {
    wrongTypeRejected = e.code === 'REFRESH_TOKEN_INVALID';
  }
  check('access token rejeitado no refresh', wrongTypeRejected);

  section('8. authService.deleteMe(userId) com number');
  await authService.deleteMe(created.id);
  const ghost = await prisma.user.findUnique({ where: { id: created.id } });
  check('usuário removido', ghost === null);

  section('9. me(userId) de usuário inexistente');
  let meNotFound = false;
  try { await authService.me(999999); } catch (e: any) { meNotFound = e.code === 'USER_NOT_FOUND'; }
  check('me(userId inválido) lança USER_NOT_FOUND', meNotFound);

  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log(`${GREEN} TODOS OS TESTES DE INTEGRACAO PASSARAM`);
  } else {
    console.log(`${RED} ${failed} TESTE(S) FALHARAM`);
  }
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error('ERRO FATAL:', e);
  await prisma.$disconnect();
  process.exit(1);
});
