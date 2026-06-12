/**
 * check_reviews_schema.ts
 * ----------------------------------------
 * Verifica o schema atual da tabela `reviews` no banco. Útil após
 * aplicar migrations para confirmar que as colunas/índices esperados
 * foram criados.
 *
 * Como rodar:
 *   cd /home/projects/pedro/urmovierates
 *   npx tsx scripts/check_reviews_schema.ts
 *
 * Saída esperada: lista de colunas da tabela `reviews` (incluindo
 * `isDeleted`, `deletedAt`, `deletionReason`, `deletedById`) + índice
 * `reviews_isDeleted_deletedById_idx`.
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const cols: any[] = await p.$queryRawUnsafe(
    "SELECT column_name, data_type, is_nullable, column_default " +
      "FROM information_schema.columns " +
      "WHERE table_name='reviews' " +
      "ORDER BY ordinal_position;"
  );
  console.log('=== reviews columns ===');
  for (const c of cols) {
    console.log(
      `  ${c.column_name.padEnd(20)} ${c.data_type.padEnd(28)} ` +
        `nullable=${c.is_nullable} default=${c.column_default ?? 'null'}`
    );
  }

  const idx: any[] = await p.$queryRawUnsafe(
    "SELECT indexname FROM pg_indexes " +
      "WHERE tablename='reviews' AND indexname LIKE '%isDeleted%';"
  );
  console.log('=== isDeleted-related indexes ===');
  if (idx.length === 0) {
    console.log('  (nenhum)');
  } else {
    for (const i of idx) console.log(`  ${i.indexname}`);
  }
}

main().finally(() => p.$disconnect());
