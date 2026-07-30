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
  ['deploy-all-functions.sql', 'DROP FUNCTION IF EXISTS update_invito_campagna_stato(VARCHAR(10), TEXT) CASCADE'],
  ['deploy-all-functions.sql', "AND r.stato = 'pending'"],
  ['deploy-all-functions.sql', 'CREATE OR REPLACE FUNCTION submit_initiative_roll'],
  ['deploy-all-functions.sql', 'CREATE OR REPLACE FUNCTION submit_generic_roll'],
  ['deploy-all-functions.sql', 'c.id_dm = i.inviante_id'],
  ['deploy-all-functions.sql', 'DELETE FROM personaggi_campagna'],
  ['deploy-all-functions.sql', 'DELETE FROM combat_timers t'],
  ['deploy-all-functions.sql', 'REVOKE INSERT, UPDATE, DELETE ON TABLE inviti_campagna'],
  ['deploy-all-functions.sql', 'DROP POLICY IF EXISTS "Utenti possono aggiornare proprie richieste iniziativa"'],
  ['deploy-all-functions.sql', 'DROP POLICY IF EXISTS "Utenti possono aggiornare proprie richieste tiro generico"'],
  ['create-richieste-tiro-tables.sql', 'DROP POLICY IF EXISTS "Utenti possono aggiornare proprie richieste iniziativa"'],
  ['create-richieste-tiro-tables.sql', 'DROP POLICY IF EXISTS "Utenti possono aggiornare proprie richieste tiro generico"'],
  ['create-richieste-tiro-tables.sql', 'tiro_naturale INTEGER'],
  ['create-personaggi.sql', 'CONSTRAINT personaggi_campagna_character_owner_fkey'],
  ['create-personaggi.sql', 'CREATE OR REPLACE FUNCTION select_personaggio_campagna'],
  ['create-personaggi.sql', 'REVOKE INSERT, UPDATE, DELETE ON TABLE personaggi_campagna'],
  ['add-personaggi-esperienza.sql', 'v_current_user_id IS DISTINCT FROM v_id_dm'],
  ['add-personaggi-esperienza.sql', 'NOT COALESCE(v_current_user_id = ANY(v_giocatori), FALSE)'],
  ['add-combat-timers.sql', 'CREATE POLICY combat_timers_insert'],
  ['add-mostri-combattimento.sql', 's.campagna_id = mostri_combattimento.campagna_id'],
  ['atomic-campaign-runtime.sql', 's.campagna_id = mostri_combattimento.campagna_id'],
  ['atomic-campaign-runtime.sql', 'LEAST(v_turn, p_order_length - 1)'],
  ['atomic-campaign-runtime.sql', 'FOR UPDATE OF s, c'],
  ['atomic-campaign-runtime.sql', "Chiudi la richiesta tiro corrente prima di crearne un''altra"],
  ['atomic-campaign-runtime.sql', 'm.campagna_id = v_campagna_id'],
  ['enable-realtime.sql', 'pg_publication_tables'],
  ['harden-personaggi-campagna.sql', 'CREATE OR REPLACE FUNCTION select_personaggio_campagna'],
  ['harden-personaggi-campagna.sql', 'CREATE OR REPLACE FUNCTION update_campaign_character_conditions'],
  ['harden-personaggi-campagna.sql', 'FOREIGN KEY (personaggio_id, user_id)'],
  ['harden-personaggi-campagna.sql', 'REVOKE INSERT, UPDATE, DELETE ON TABLE personaggi_campagna'],
  ['harden-personaggi-campagna.sql', 'p.user_id = pc.user_id'],
  ['harden-personaggi-campagna.sql', 'personaggi_campagna.user_id = c.id_dm'],
  ['harden-personaggi-campagna.sql', 'NOT COALESCE(v_current_user_id = ANY(v_giocatori), FALSE)'],
  ['harden-personaggi-campagna.sql', 'DROP POLICY IF EXISTS "DM può aggiornare condizioni personaggi in campagna"'],
  ['harden-personaggi-campagna.sql', 'JSONB_OBJECT_KEYS(p_conditions)'],
  ['harden-personaggi-campagna.sql', 'FOR UPDATE;'],
  ['update-dm-campagna.sql', 'DROP TRIGGER IF EXISTS sync_giocatori_on_invito_change'],
  ['update-dm-campagna.sql', 'Termina la sessione attiva prima di trasferire la campagna'],
  ['harden-homebrew-rls.sql', "'private', 'friends', 'campaign', 'public'"],
  ['revoke-anon-security-definer.sql', 'REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon'],
  ['revoke-anon-security-definer.sql', "'REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon'"],
];

for (const [file, guard] of requiredGuards) {
  if (!readFileSync(join(sqlDir, file), 'utf8').includes(guard)) {
    errors.push(`${file}: guardia richiesta assente`);
  }
}

const campaignFunctions = readFileSync(join(sqlDir, 'deploy-all-functions.sql'), 'utf8');
if (!campaignFunctions.includes('\nBEGIN;') || !campaignFunctions.trimEnd().endsWith('COMMIT;')) {
  errors.push('deploy-all-functions.sql: deploy non racchiuso in transazione');
}
if (!campaignFunctions.includes("v_return_type <> 'character varying'::REGTYPE")) {
  errors.push('deploy-all-functions.sql: preflight tipo get_current_user_id assente');
}
if (/DROP\s+FUNCTION\s+IF\s+EXISTS\s+get_current_user_id\(\)\s+CASCADE/i.test(campaignFunctions)) {
  errors.push('deploy-all-functions.sql: get_current_user_id non deve eliminare le RPC dipendenti');
}
if (campaignFunctions.includes('SELECT id INTO v_current_user_id FROM utenti')) {
  errors.push('deploy-all-functions.sql: id utente ambiguo nelle RPC con output id');
}
const playerRemoval = campaignFunctions
  .split('CREATE OR REPLACE FUNCTION rimuovi_giocatore_campagna', 2)[1]
  ?.split('DROP POLICY IF EXISTS', 1)[0] ?? '';
if (/r\.stato\s*=\s*'pending'/.test(playerRemoval)) {
  errors.push('deploy-all-functions.sql: la rimozione giocatore deve pulire tutti i tiri della sessione attiva');
}

const timerPolicies = readFileSync(join(sqlDir, 'add-combat-timers.sql'), 'utf8');
if ((timerPolicies.match(/s\.data_fine\s+IS\s+NULL/gi)?.length ?? 0) < 5) {
  errors.push('add-combat-timers.sql: tutte le policy devono richiedere una sessione attiva');
}

const atomicRuntime = readFileSync(join(sqlDir, 'atomic-campaign-runtime.sql'), 'utf8');
if ((atomicRuntime.match(/FOR\s+UPDATE\s+OF\s+s,\s*c/gi)?.length ?? 0) < 5) {
  errors.push('atomic-campaign-runtime.sql: le mutation devono serializzare sessione e campagna');
}
const initiativeRequest = atomicRuntime
  .split('CREATE OR REPLACE FUNCTION request_initiative_rolls', 2)[1]
  ?.split('CREATE OR REPLACE FUNCTION request_generic_rolls', 1)[0] ?? '';
if (!initiativeRequest.includes('UNNEST(v_campaign_players)')) {
  errors.push('atomic-campaign-runtime.sql: iniziativa non usa la membership letta dal database');
}

const hardenedCharacters = readFileSync(join(sqlDir, 'harden-personaggi-campagna.sql'), 'utf8');
const characterBaseline = readFileSync(join(sqlDir, 'create-personaggi.sql'), 'utf8');
if (/CREATE\s+POLICY\s+"DM può aggiornare condizioni personaggi in campagna"/i.test(
  `${characterBaseline}\n${hardenedCharacters}`,
)) {
  errors.push('personaggi: la policy DM non deve consentire UPDATE completi della scheda');
}

const characterPicker = readFileSync(
  join(process.cwd(), 'js', 'Personaggi', 'personaggi-campagna-picker.js'),
  'utf8',
);
if (!characterPicker.includes(".rpc('select_personaggio_campagna'")) {
  errors.push('personaggi-campagna-picker.js: RPC selezione personaggio assente');
}
if (/\.from\(['"]personaggi_campagna['"]\)[\s\S]{0,300}\.upsert\(/.test(characterPicker)) {
  errors.push('personaggi-campagna-picker.js: upsert diretto associazione vietato');
}

const legacySessions = readFileSync(join(process.cwd(), 'js', 'Sessioni', 'sessions.js'), 'utf8');
if (!legacySessions.includes(".rpc('update_campaign_character_conditions'")) {
  errors.push('sessions.js: aggiornamento condizioni DM non passa dalla RPC limitata');
}

if (errors.length) {
  console.error(`Supabase security check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Supabase security checks passed (${files.length} SQL files).`);
