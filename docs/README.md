# Documentazione

Indice dei documenti tecnici e operativi della Companion App.

## UI

- [`ui/UI_BASELINE_CHECKPOINT.md`](ui/UI_BASELINE_CHECKPOINT.md): baseline grafica da preservare durante ogni migrazione.

## Migrazione React

- [`migration/REACT_PAGE_MIGRATION_GUIDE.md`](migration/REACT_PAGE_MIGRATION_GUIDE.md): procedura corretta per migrare una pagina senza cambiare design o routing.
- [`migration/TODO_TECH_STACK_MIGRATION_2.md`](migration/TODO_TECH_STACK_MIGRATION_2.md): roadmap attiva della remediation `tech_migration_2`.
- [`migration/TODO_TECH_STACK_MIGRATION.md`](migration/TODO_TECH_STACK_MIGRATION.md): roadmap storica della prima migrazione.
- [`migration/tech-migration-qa.md`](migration/tech-migration-qa.md): checklist QA dei flussi critici.
- [`migration/legacy-function-map.md`](migration/legacy-function-map.md): inventario verificato di ownership, bridge, dati e destinazione React.

## Architettura

- [`architecture/tech-stack-architecture.md`](architecture/tech-stack-architecture.md): confini runtime, guardie e test.
- [`architecture/realtime-rules.md`](architecture/realtime-rules.md): regole per eventi realtime e deduplica.

## Supabase

- [`supabase/SUPABASE_AUTH_DEPLOY_CHECKPOINT.md`](supabase/SUPABASE_AUTH_DEPLOY_CHECKPOINT.md): diagnosi e procedura di ripristino del login quando Pages pubblica sorgenti non compilati.
- [`supabase/GOOGLE_OAUTH_SETUP.md`](supabase/GOOGLE_OAUTH_SETUP.md): configurazione login Google.
- [`supabase/SUPABASE_MIGRATION.md`](supabase/SUPABASE_MIGRATION.md): guida storica di migrazione a Supabase.
- [`supabase/MIGRATION_TO_VARCHAR_IDS.md`](supabase/MIGRATION_TO_VARCHAR_IDS.md): note sulla migrazione degli ID.
- [`../backend/supabase/sql/atomic-campaign-runtime.sql`](../backend/supabase/sql/atomic-campaign-runtime.sql): prerequisito database da applicare prima del frontend React di sessione e combattimento.
- [`../backend/supabase/sql/harden-personaggi-campagna.sql`](../backend/supabase/sql/harden-personaggi-campagna.sql): ownership strutturale e RPC sicure per l'associazione personaggio-campagna.
- [`../backend/supabase/RLS_DEPLOY_CHECKLIST.md`](../backend/supabase/RLS_DEPLOY_CHECKLIST.md): ordine e verifica operativa di tutti gli script SQL.

## PWA

- [`pwa/CACHE_BUSTING.md`](pwa/CACHE_BUSTING.md): note storiche su cache busting e sviluppo.

## Backlog

- [`backlog/TODO.md`](backlog/TODO.md): fix puntuali ancora aperti.
- [`backlog/RULES.md`](backlog/RULES.md): regole operative e note storiche residue.

## Audit

- [`audits/refactor-audit.md`](audits/refactor-audit.md): audit tecnico storico del refactor.
