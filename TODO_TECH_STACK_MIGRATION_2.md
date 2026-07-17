# TODO - Tech migration 2 remediation

Obiettivo: correggere le falle emerse dopo la prima migrazione React/TypeScript, senza aprire un secondo rewrite. Ogni step deve chiudere un rischio reale e lasciare `npm.cmd run check` e `npm.cmd run test` verdi.

Stato 2026-07-15: branch `tech_migration_2` creato da `tech_migration`.

## Priorita 0 - Sicurezza Supabase/RLS

- [x] Verificare tutte le funzioni `SECURITY DEFINER` in `backend/supabase/sql`.
- [x] Bloccare `update_dm_campagna` al solo DM corrente o a una policy amministrativa esplicita.
- [x] Vincolare `invia_invito_campagna` all'identita risolta da `auth.uid()`.
- [x] Vincolare le RPC dei personaggi a proprietario, DM o membro autorizzato della campagna.
- [x] Sostituire policy `USING (true) WITH CHECK (true)` su `combat_timers` con scope per campagna/sessione.
- [x] Rivedere le policy homebrew pubbliche: distinguere privato, amici, campagna e pubblico.
- [x] Aggiungere una checklist SQL manuale per ogni migrazione RLS prima del deploy.
- [ ] Applicare e validare gli script RLS in staging e produzione seguendo `backend/supabase/RLS_DEPLOY_CHECKLIST.md`.

## Priorita 1 - Guardie nel check standard

- [x] Inserire `tools/check-index-bootstrap.mjs` nel target `check`.
- [x] Inserire `tools/check-react-boundaries.mjs` nel target `check`.
- [x] Tenere `tools/check-legacy-symbols.mjs` report-only nel check standard; la modalita manuale resta bloccante.
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
- [x] Verificare che realtime non chiuda modal, tendine o input attivi.
- [ ] Coprire DM/player in due browser con Playwright quando la fixture Supabase e' pronta.

## Priorita 5 - Pagine React ancora dipendenti dal legacy

- [ ] Ridurre `CombatPage` a componenti React che chiamano API typed, non funzioni globali.
- [ ] Ridurre `CharacterSheetPage` a modello React/Zustand, lasciando legacy solo come fallback.
- [ ] Spostare modali e action handler piu usati fuori da `window.*`.
- [ ] Tenere una allowlist corta dei globali legacy ancora necessari.

## Priorita 6 - PWA, service worker e icone

- [x] Creare icone home screen quadrate con sfondo trasparente.
- [x] Rimuovere `maskable` dal manifest per evitare sfondo launcher imposto.
- [ ] Correggere `sw.js` aggiungendo il placeholder `BUILD_ASSET_URLS` o cambiando l'iniezione Vite.
- [ ] Verificare che gli asset hashati Vite vengano precacheati.
- [ ] Testare install/update PWA dopo build.

## Priorita 7 - TypeScript, Zod e API

- [ ] Portare `strict` a `true` per i nuovi moduli `src/`.
- [ ] Ridurre `.passthrough()` negli schema Zod dove il dominio e' stabile.
- [ ] Sostituire `select('*')` con colonne esplicite nelle API typed.
- [ ] Aggiungere fallback solo dove esiste una migrazione DB non ancora garantita.
- [ ] Estendere `checkJs` a piccoli gruppi legacy solo quando il rumore e' gestibile.

## Priorita 8 - Pulizia legacy

- [ ] Risolvere o cancellare i simboli segnalati da `check-legacy-symbols`.
- [ ] Rimuovere script legacy non piu caricati da `index.html`.
- [ ] Tenere `LegacyFragment` solo per contenuti che non meritano ancora una conversione React.
- [ ] Bloccare nuovi `innerHTML` fuori dai file legacy esplicitamente permessi.

## Criterio di uscita

- [ ] `npm.cmd run check` include tutte le guardie architetturali.
- [ ] `npm.cmd run test` verde.
- [ ] Build Vite verde.
- [ ] Nessuna policy/RPC Supabase critica senza controllo `auth.uid()`.
- [ ] PWA installabile con icona trasparente e service worker coerente con gli asset buildati.
