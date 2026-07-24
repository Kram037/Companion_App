# TODO - Tech migration 2 remediation

Obiettivo: correggere le falle emerse dopo la prima migrazione React/TypeScript, senza aprire un secondo rewrite. Ogni step deve chiudere un rischio reale e lasciare `npm.cmd run check` e `npm.cmd run test` verdi.

Stato 2026-07-24: dominio Campagna migrato su branch `react_migration`;
deploy SQL e fixture E2E autenticata restano operazioni esterne.

Gate di deploy: applicare gli script nell'ordine della
[`../../backend/supabase/RLS_DEPLOY_CHECKLIST.md`](../../backend/supabase/RLS_DEPLOY_CHECKLIST.md),
inclusi `harden-personaggi-campagna.sql` e `atomic-campaign-runtime.sql`, prima
del frontend migrato. Le caselle completate qui descrivono il codice presente
nel repository, non provano che la migrazione sia gia attiva su staging o
produzione.

## Priorita 0 - Sicurezza Supabase/RLS

- [x] Verificare tutte le funzioni `SECURITY DEFINER` in `backend/supabase/sql`.
- [x] Bloccare `update_dm_campagna` al solo DM corrente o a una policy amministrativa esplicita.
- [x] Vincolare `invia_invito_campagna` all'identita risolta da `auth.uid()`.
- [x] Vincolare le RPC dei personaggi a proprietario, DM o membro autorizzato della campagna.
- [x] Sostituire policy `USING (true) WITH CHECK (true)` su `combat_timers` con scope per campagna/sessione.
- [x] Rivedere le policy homebrew pubbliche: distinguere privato, amici, campagna e pubblico.
- [x] Aggiungere una checklist SQL manuale per ogni migrazione RLS prima del deploy.
- [x] Implementare nel repository avvio/fine sessione, richieste tiro e avanzamento turno atomici.
- [x] Implementare nel repository la lettura mostri e timer con visibilita limitata per i player.
- [x] Rendere strutturale l'ownership di `personaggi_campagna` e vietarne il DML diretto dal client.
- [x] Sostituire la policy UPDATE completa del DM con una RPC limitata a condizioni ed esaustione.
- [x] Spostare il submit dei tiri player su RPC autenticate e pending-only.
- [x] Eliminare le RPC inviti obsolete e rendere non accettabili gli inviti del precedente DM.
- [x] Revocare il DML diretto sugli inviti e rimuovere il trigger legacy che riscriveva i giocatori.
- [x] Bloccare il trasferimento DM mentre esiste una sessione attiva.
- [x] Pulire associazione, tiri e timer PG attivi quando il DM rimuove un giocatore.
- [x] Impedire timer su sessioni concluse e gruppi di tiri generici sovrapposti.
- [ ] Applicare `atomic-campaign-runtime.sql` e validare i ruoli con fixture autenticate.
- [ ] Applicare e validare gli script RLS in staging e produzione seguendo `backend/supabase/RLS_DEPLOY_CHECKLIST.md`.

## Priorita 1 - Guardie nel check standard

- [x] Inserire `tools/check-index-bootstrap.mjs` nel target `check`.
- [x] Inserire `tools/check-react-boundaries.mjs` nel target `check`.
- [x] Rendere `tools/check-legacy-symbols.mjs` bloccante nel check standard dopo aver azzerato il report.
- [x] Far fallire la build se Supabase torna caricato da CDN.
- [x] Far fallire la build se realtime legacy chiama render/load diretti.
- [x] Far fallire la build se nuove pagine React aggiungono dipendenze da `window.*` non autorizzate.

## Priorita 2 - Supabase client unico

- [x] Rimuovere il bootstrap Supabase da CDN in `index.html`.
- [x] Usare solo `src/api/supabaseClient.ts` come entry client.
- [x] Mantenere `window.supabaseClient` solo come compat layer temporaneo.
- [x] Documentare quando il compat layer potra essere cancellato.

## Priorita 3 - Navigazione e stato

- [x] Scegliere React Router come fonte primaria di URL e pagina corrente.
- [x] Ridurre `js/Core/navigation.js` a bridge legacy senza scritture dirette sulla history.
- [x] Eliminare `sessionStorage currentPage/currentCampagnaId/currentSessioneId/currentPersonaggioId` dai flussi di navigazione.
- [x] Spostare `AppState.current*` dietro helper compatibili e tracciabili.
- [x] Aggiungere test smoke per deep link, refresh e back/forward browser.

## Priorita 4 - Realtime disciplinato

- [x] Sostituire in `js/Core/realtime.js` i render/load diretti con invalidazioni React Query e un bridge legacy isolato.
- [x] Centralizzare deduplica eventi in `src/realtime/realtimeClient.ts`.
- [x] Trattare i broadcast pubblici come hint e verificare il database prima di notifiche o navigazioni.
- [x] Invalidare anche la cache combattimento quando cambiano membership o autorizzazioni.
- [x] Azzerare le query al cambio autenticazione e non mostrare cache stale dopo errori RLS.
- [x] Verificare che realtime non chiuda modal, tendine o input attivi.
- [ ] Coprire DM/player in due browser con Playwright quando la fixture Supabase e' pronta.

## Priorita 5 - Pagine React ancora dipendenti dal legacy

- [x] Estrarre in moduli TypeScript i calcoli puri condivisi da scheda e combattimento.
- [x] Isolare i globali di combattimento in un adapter typed fuori dai componenti React.
- [x] Attivare l'ownership incrementale e migrare `/amici` a React/API typed; il solo modale di aggiunta resta compat legacy.
- [x] Ridurre `CombatPage` a componenti React che chiamano API typed, non funzioni globali.
  - [x] Spostare cambio turno e fine combattimento su API typed.
  - [x] Spostare modali mostro, dadi/calcolatrice e timer fuori da `window.*`.
- [ ] Ridurre `CharacterSheetPage` a modello React/Zustand, lasciando legacy solo come fallback.
- [ ] Spostare modali e action handler piu usati fuori da `window.*`.
- [ ] Tenere una allowlist corta dei globali legacy ancora necessari.

## Priorita 6 - PWA, service worker e icone

- [x] Creare icone home screen quadrate con sfondo trasparente.
- [x] Rimuovere `maskable` dal manifest per evitare sfondo launcher imposto.
- [x] Correggere `sw.js` aggiungendo il placeholder `BUILD_ASSET_URLS` e validarne l'iniezione Vite.
- [x] Verificare che gli asset hashati Vite vengano precacheati.
- [x] Testare install/update PWA dopo build.

## Priorita 7 - TypeScript, Zod e API

- [x] Portare `strict` a `true` per tutti i moduli TypeScript in `src/`.
- [x] Ridurre `.passthrough()` negli schema Zod dove il dominio e' stabile; restano aperti solo personaggi, classi incorporate e homebrew eterogenei.
- [x] Sostituire `select('*')` con colonne esplicite nelle API typed e bloccarne la reintroduzione nel check standard.
- [x] Aggiungere fallback solo dove esiste una migrazione DB non ancora garantita.
- [x] Estendere `checkJs` a piccoli gruppi legacy solo quando il rumore e' gestibile; il primo gruppo Core e' esplicitato in `tsconfig.legacy-check.json`.

## Priorita 8 - Pulizia legacy

- [x] Primo batch: rimuovere polling sessioni duplicato e helper privati senza chiamanti (report da 39 a 29 simboli).
- [x] Secondo batch: rimuovere alias storici e flussi UI gia' sostituiti (report da 29 a 3 simboli).
- [x] Terzo batch: rimuovere la selezione inline e i renderer scheda combattimento sostituiti dalle full sheet correnti (report da 3 a 0 simboli).
- [x] Risolvere o cancellare i simboli segnalati da `check-legacy-symbols`.
- [x] Verificare e bloccare script legacy non raggiungibili da `index.html` o dai loader lazy; l'audit non ha trovato file orfani.
- [x] Tenere `LegacyFragment` solo per i contenuti HTML residui del Compendio e bloccarne nuovi usi.
- [x] Bloccare nuovi `innerHTML` fuori dai file legacy esplicitamente permessi.
- [x] Rimuovere renderer legacy di dettaglio, sessione e combattimento dopo il passaggio di ownership.
- [x] Eliminare store Zustand e cache helper mai usati.

## Criterio di uscita

- [x] `npm.cmd run check` include tutte le guardie architetturali.
- [x] `npm.cmd run test` verde.
- [x] Build Vite verde.
- [x] Nessuna policy/RPC Supabase critica senza controllo `auth.uid()`.
- [x] PWA installabile con icona trasparente e service worker coerente con gli asset buildati.
