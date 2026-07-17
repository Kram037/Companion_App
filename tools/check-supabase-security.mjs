import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const sqlDir = join(process.cwd(), 'backend', 'supabase', 'sql');
const files = readdirSync(sqlDir).filter((name) => name.endsWith('.sql'));
const errors = [];

for (const file of files) {
  const sql = readFileSync(join(sqlDir, file), 'utf8');
  if (/USING\s*\(\s*true\s*\)|WITH\s+CHECK\s*\(\s*true\s*\)/i.test(sql)) {
    errors.push(`${file}: policy RLS permissiva`);
  }

  const definers = sql.match(/SECURITY\s+DEFINER/gi)?.length ?? 0;
  if (!definers) continue;

  const searchPaths = sql.match(/SET\s+search_path\s*=\s*public/gi)?.length ?? 0;
  const publicRevokes = sql.match(/REVOKE\s+EXECUTE\s+ON\s+FUNCTION[\s\S]*?FROM\s+PUBLIC\s*;/gi)?.length ?? 0;
  if (searchPaths < definers) errors.push(`${file}: SECURITY DEFINER senza search_path fisso`);
  if (publicRevokes < definers) errors.push(`${file}: SECURITY DEFINER eseguibile da PUBLIC`);
}

const requiredGuards = [
  ['update-dm-campagna.sql', 'v_current_user_id IS DISTINCT FROM v_vecchio_dm_id'],
  ['deploy-all-functions.sql', 'v_current_user_id IS DISTINCT FROM p_inviante_id'],
  ['add-personaggi-esperienza.sql', 'v_current_user_id IS DISTINCT FROM p_user_id'],
  ['add-combat-timers.sql', 'CREATE POLICY combat_timers_insert'],
  ['harden-homebrew-rls.sql', "'private', 'friends', 'campaign', 'public'"],
];

for (const [file, guard] of requiredGuards) {
  if (!readFileSync(join(sqlDir, file), 'utf8').includes(guard)) {
    errors.push(`${file}: guardia richiesta assente`);
  }
}

if (errors.length) {
  console.error(`Supabase security check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Supabase security checks passed (${files.length} SQL files).`);
