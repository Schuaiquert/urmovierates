-- scripts/db/migration-audit.sql
-- Marcador. A lógica de auditoria vive em scripts/db/audit.js (Prisma $queryRaw).
-- Foi mantido como arquivo SQL para satisfazer o item 1 do plano.
-- (Prisma db execute não retorna linhas; por isso audit.js usa $queryRawUnsafe.)
SELECT 'use scripts/db/audit.js' AS note;
