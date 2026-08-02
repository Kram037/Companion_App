# Tech Stack Architecture

## Runtime

- Legacy app: `index.html`, `js/`, `css/`, `images/`, `risorse/`.
- New typed layer: `src/`.
- Vite usa `index.html` root-based: un `index.vite.html` separato aggiungerebbe drift senza beneficio.
- Runtime locale: `npm run serve`, servito da Vite sulla porta `8000`.
- Build e deploy usano lo stesso output: `dist/apps/companion-app`.
- Vite usa base `/` in locale e il prefisso del repository durante il deploy GitHub Pages, cosi' anche le route profonde caricano gli asset corretti.
- Il markup e gli asset legacy restano inclusi da Vite finche' la relativa pagina o dialog non viene migrata.
- React viene attivato per route incrementali; il resto resta servito dal runtime legacy tramite bridge.
- React possiede gia' lista/dettaglio campagna, sessione, combattimento e amici.

## Confini

- `src/api`: unico punto per Supabase nei nuovi moduli; `databaseContract.ts`
  cataloga tabelle/RPC e `DataAccessError` normalizza gli errori tecnici.
- `src/schemas`: validazione runtime Zod.
- `src/query`: TanStack Query, query keys gerarchiche e cache server.
- `src/realtime`: deduplica eventi e invalidazioni mirate.
- `src/store`: Zustand solo dove esiste stato UI locale realmente condiviso.
- `src/router`: route e bridge legacy.
- `src/features`: nuove pagine/componenti React.

## Contratto database Campagna

Le route React di dettaglio, sessione e combattimento passano da
`campaignsApi.ts`, `sessionsApi.ts` e `combatApi.ts`. Le mutation atomiche,
l'associazione sicura dei personaggi e la lettura dei mostri dipendono da
[`../../backend/supabase/sql/deploy-all-functions.sql`](../../backend/supabase/sql/deploy-all-functions.sql),
[`../../backend/supabase/sql/harden-personaggi-campagna.sql`](../../backend/supabase/sql/harden-personaggi-campagna.sql)
e
[`../../backend/supabase/sql/atomic-campaign-runtime.sql`](../../backend/supabase/sql/atomic-campaign-runtime.sql).
Gli script vanno applicati nell'ordine della checklist RLS prima del deploy del
frontend corrispondente.

I preflight interrompono il deploy su associazioni personaggio-proprietario
incoerenti o sessioni aperte duplicate; non scelgono automaticamente quale dato
conservare. Un file SQL presente nel branch non equivale a una migrazione
applicata in staging o produzione.

## Regola legacy

Una pagina migrata deve avere un solo owner React tramite `ReactPage`. Una pagina
non migrata resta legacy e viene attivata da `navigateToPage` tramite
`LegacyNavigationSync`. I globali rimasti sono API di compatibilita'
intenzionali, non nuovi punti di rendering.

Nel dominio Campagna restano compat legacy per dialog condivise, notifiche,
broadcast, apertura scheda e prompt di tiro lato giocatore. Rendering e
mutazioni avviate dalle pagine DM di sessione/combattimento appartengono invece
al livello React/typed.

## Guardie

- `tools/check-data-boundary.mjs`: controlla i data bundle runtime.
- `tools/check-index-bootstrap.mjs`: impedisce il ritorno dei data bundle pesanti nel bootstrap iniziale.
- `tools/check-react-boundaries.mjs`: blocca `innerHTML` e Supabase diretto nei nuovi componenti React.
- `tools/check-api-boundaries.mjs`: blocca accessi Supabase fuori da `src/api`,
  colonne implicite e nomi DB dispersi fuori dal catalogo typed.
- `tools/check-legacy-symbols.mjs`: blocca funzioni e API globali legacy senza chiamanti.

## Test

- `npm run check`: typecheck + guardie legacy/React.
- `npm run test`: Vitest su logica typed.
- `npm run e2e -- --list`: verifica discovery Playwright sulla build production.
- `npm run e2e`: genera la build, avvia il preview e chiude il server al termine; richiede browser installati con `npm run e2e:install`.
- `npm run e2e -- --grep=@visual`: confronta le baseline Windows di pagine, modali, dice roller e split view.
- GitHub Pages esegue check, unit test, suite pubblica/autenticata su Ubuntu e baseline visuali su Windows prima del deploy.

### Fixture E2E autenticata

La configurazione canonica della fixture e dei secret è nella sezione
[Test del README](../../README.md#test).
