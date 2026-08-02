# Audit fondazioni React, TypeScript, Vite e Nx

Data: 2026-08-02
Branch: `react_migration`
Scheda Trello: 05

## Prerequisiti verificati

- Scheda 01: `react_migration@02b2cf5` resta la baseline visiva e
  comportamentale; viewport, browser e budget sono definiti in
  `docs/ui/UI_BASELINE_CHECKPOINT.md`.
- Scheda 02: `docs/migration/legacy-function-map.md` concorda con
  `src/main.ts` e `src/app/AppRouter.tsx` sull'ownership corrente.
- Scheda 03: fixture E2E, baseline visuali e gate zero-skip sono separati dalla
  produzione e documentati nel workflow Pages.
- Scheda 04: RLS, RPC e migrazioni sono state certificate sul progetto E2E;
  questo audit non presume ne' modifica lo stato della produzione.

## Esito gap-only

| Area | Evidenza | Esito |
| --- | --- | --- |
| Bootstrap React | `src/main.ts` monta una sola root tramite `mountReactBridge`; `src/app/ReactBridge.tsx` contiene l'unico `createRoot` | Conforme |
| Client Supabase | `src/api/supabaseClient.ts` contiene l'unico `createClient`; `window.supabaseClient` resta solo compatibilita' legacy | Conforme |
| TypeScript | `tsconfig.json` usa `strict: true`, `noEmit`, JSX React e alias coerenti con Vite | Conforme |
| Provider | `ReactBridge` monta `AppProviders` e `AppRouter`; TanStack Query e React Router hanno un solo owner | Conforme |
| Stato UI | Gli store Zustand correnti sono piccoli e limitati a filtri e scheda personaggio | Conforme |
| Vite | Un solo `index.html`; output canonico `dist/apps/companion-app`; asset legacy e manifest service worker sono gestiti da `vite.config.ts` | Conforme |
| Nx | `project.json` espone `serve`, `build`, `check`, `test` ed `e2e`; i duplicati `vite-serve`/`vite-build` sono stati rimossi | Corretto in `8802a81` |
| Guardie | Il target `check` include typecheck typed/legacy e guardie dati, bootstrap, React, navigazione, API, Supabase e simboli legacy | Conforme |
| Ambienti | README distingue locale, staging/E2E e produzione e vieta test mutativi sulla configurazione di produzione | Corretto in `8802a81` |

Non sono stati introdotti nuovi provider, bootstrap, client o globali legacy.
Le astrazioni correnti coprono i requisiti della scheda; eventuali nuove
fondazioni richiedono un gap misurato.

## Verifica

Sul worktree finale:

- `npm run check`: verde; include typecheck, 84 file JavaScript, 13 output
  runtime, bootstrap, 48 boundary React, 165 boundary di navigazione, 70 file
  typed/API, 48 file SQL e 1.459 simboli legacy;
- `npm test`: 26 file e 70 test passati;
- `npm run build`: verde; gli asset compressi restano entro il budget della
  scheda 01 (`CSS 51,33 kB`, `entry 55,42 kB`, `app 109,01 kB`);
- `npm run e2e`: 54 test pubblici/visuali passati e 5 test staging autenticati
  esclusi per assenza delle credenziali locali. Il requisito zero-skip resta
  imposto in CI dal gate della scheda 03;
- `git diff --check`: verde.

Le sole segnalazioni di build sono quelle note della shell ibrida: script
legacy non modulari e futuro cambio del config loader Vite. Non sono stati
introdotti nuovi warning applicativi o regressioni visuali.
