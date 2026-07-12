# TODO - Migrazione stack React/TypeScript

Obiettivo: preparare Companion App alla migrazione progressiva verso React senza bloccare lo sviluppo attuale e senza reintrodurre i problemi di realtime, refetch, buffering e stato UI gia' emersi nella codebase vanilla.

## Principi guida

- Migrazione incrementale: una pagina o dominio alla volta, evitando un rewrite totale.
- Prima dati e stato, poi UI: React deve ricevere uno strato dati stabile, non inglobare direttamente il debito attuale.
- Realtime come invalidazione mirata, non come render diretto.
- Server state separato da UI state.
- Ogni step deve mantenere `npm run check` e `npm run build` verdi.
- Ogni migrazione deve avere test minimi contro regressioni UX.

---

## Fase 0 - Baseline e protezione regressioni

- [ ] Documentare i flussi critici attuali:
  - [ ] login / ripristino sessione;
  - [ ] lista campagne;
  - [ ] dettaglio campagna;
  - [ ] sessione attiva;
  - [ ] combattimento;
  - [ ] scheda personaggio;
  - [ ] laboratorio;
  - [ ] compendio.
- [ ] Aggiungere casi QA manuali per i bug UX noti:
  - [ ] aprire una tendina mentre arriva un realtime update;
  - [ ] modificare un campo e verificare che non venga resettato;
  - [ ] aprire un modal e verificare che un refetch non lo chiuda;
  - [ ] usare sessione/combattimento con due browser aperti;
  - [ ] verificare PWA/service worker dopo update.
- [ ] Mantenere i fix anti-doppio-render e realtime guard finche' React Query non li sostituisce.
- [ ] Definire convenzione branch:
  - [ ] `develop` per integrazione;
  - [ ] feature branch per ogni fase tecnica;
  - [ ] PR piccole e verificabili.

Criterio di uscita: flussi critici documentati e verificabili prima di introdurre dipendenze nuove.

---

## Fase 1 - TypeScript graduale

- [x] Aggiungere TypeScript senza convertire subito tutto:
  - [x] installare `typescript`;
  - [x] creare `tsconfig.json` permissivo;
  - [x] abilitare `allowJs` e `checkJs` gradualmente;
  - [x] escludere temporaneamente file legacy troppo rumorosi.
- [x] Creare cartella `src/` per il nuovo codice typed.
- [x] Definire tipi dominio principali:
  - [x] `UserProfile`;
  - [x] `Campagna`;
  - [x] `Personaggio`;
  - [x] `Sessione`;
  - [x] `RichiestaTiro`;
  - [x] `MostroCombattimento`;
  - [x] `HomebrewItem`;
  - [x] `RuntimeDataBundle`.
- [x] Introdurre tipi per `AppState` attuale senza modificarne ancora il comportamento.
- [x] Aggiungere script di check TypeScript al target Nx `check`.

Criterio di uscita: il repo compila/checka con TypeScript presente e i nuovi moduli possono essere scritti in `.ts`/`.tsx`.

---

## Fase 2 - Vite come runtime moderno

- [x] Aggiungere Vite in modalita' compatibile.
- [x] Creare entry dedicata:
  - [x] `src/main.ts` o `src/main.tsx`;
  - [ ] bootstrap progressivo che convive con gli script legacy.
- [ ] Valutare due modalita' temporanee:
  - [x] mantenere `index.html` root-based;
  - [ ] oppure creare `index.vite.html` per sperimentazione.
- [x] Configurare alias:
  - [x] `@core`;
  - [x] `@features`;
  - [x] `@api`;
  - [x] `@app-types` (al posto di `@types`, riservato da TypeScript);
  - [x] `@components`.
- [ ] Portare il build Nx a chiamare Vite quando la compatibilita' e' pronta.
- [ ] Garantire compatibilita' service worker/PWA:
  - [ ] asset versionati;
  - [ ] cache dei runtime data bundle;
  - [ ] nessun reload automatico durante uso attivo.

Criterio di uscita: Vite serve/builda l'app senza rompere i flussi legacy.

---

## Fase 3 - Service layer Supabase

- [x] Creare `src/api/supabaseClient.ts`.
- [ ] Rimuovere accessi Supabase diretti dai nuovi componenti.
- [ ] Creare API per dominio:
  - [x] `campaignsApi.ts`;
  - [x] `charactersApi.ts`;
  - [x] `sessionsApi.ts`;
  - [x] `combatApi.ts`;
  - [x] `homebrewApi.ts`;
  - [x] `usersApi.ts`;
  - [x] `runtimeDataApi.ts`.
- [x] Ogni funzione API deve:
  - [x] ricevere input espliciti;
  - [x] restituire dati normalizzati;
  - [x] non toccare DOM;
  - [x] non chiamare render;
  - [x] non modificare `AppState` direttamente.
- [ ] Mappare progressivamente le vecchie funzioni:
  - [ ] `loadCampagne`;
  - [ ] `loadCampagnaDetails`;
  - [ ] `renderSessioneContent`;
  - [ ] `renderCombattimentoContent`;
  - [ ] `renderSchedaPersonaggio`.

Criterio di uscita: i nuovi moduli dati non dipendono da DOM, `window` o render function.

---

## Fase 4 - Zod per validazione dati

- [x] Installare `zod`.
- [x] Creare `src/schemas/`.
- [x] Definire schema per:
  - [x] utente;
  - [x] campagna;
  - [x] personaggio;
  - [x] sessione;
  - [x] richiesta tiro iniziativa;
  - [x] richiesta tiro generico;
  - [x] mostro combattimento;
  - [x] oggetti homebrew;
  - [x] incantesimi homebrew;
  - [x] runtime data bundle.
- [x] Usare `safeParse` nel service layer per dati provenienti da Supabase.
- [x] Gestire fallback espliciti per colonne opzionali o migrazioni DB non ancora applicate.
- [ ] Derivare tipi TypeScript dagli schema quando utile.

Criterio di uscita: i dati critici sono validati prima di entrare nello stato React/Query.

---

## Fase 5 - TanStack Query per server state

- [x] Installare `@tanstack/react-query`.
- [x] Creare `queryClient` centralizzato.
- [x] Definire query keys stabili:
  - [x] `['currentUser']`;
  - [x] `['campaigns', userId]`;
  - [x] `['campaign', campagnaId]`;
  - [x] `['session', campagnaId]`;
  - [x] `['combat', sessioneId]`;
  - [x] `['character', personaggioId]`;
  - [x] `['homebrew', userId]`;
  - [x] `['runtimeData', bundleKey]`.
- [ ] Convertire fetching a query/mutation, iniziando da:
  - [ ] lista campagne;
  - [ ] dettaglio campagna;
  - [ ] sessione;
  - [ ] combattimento.
- [ ] Sostituire refresh diretti con invalidazioni:
  - [ ] `queryClient.invalidateQueries(...)`;
  - [ ] `queryClient.setQueryData(...)` per update ottimistici;
  - [ ] `queryClient.cancelQueries(...)` prima di mutation sensibili.
- [x] Configurare stale/cache time per dominio:
  - [x] campagne: medio;
  - [x] scheda personaggio: breve ma con optimistic update;
  - [x] combattimento: breve/realtime-driven;
  - [x] compendio/static data: lungo.
- [ ] Rimuovere progressivamente `_appRefreshRunning`, `_appRefreshQueued` e refresh globali quando non piu' necessari.

Criterio di uscita: nessun realtime update deve chiamare direttamente `renderXXX`; deve invalidare query mirate.

---

## Fase 6 - Realtime disciplinato

- [x] Creare `src/realtime/realtimeClient.ts`.
- [x] Separare canali:
  - [x] auth/session lifecycle;
  - [x] campagne;
  - [x] sessioni;
  - [x] combattimento;
  - [x] richieste tiro;
  - [x] notifiche transitorie.
- [ ] Stabilire regole:
  - [ ] Postgres changes per dati persistenti;
  - [ ] Broadcast per eventi transitori;
  - [ ] Presence solo se servira' vedere utenti online/in sessione.
- [x] Ogni evento realtime deve produrre una delle seguenti azioni:
  - [x] invalidate query mirata;
  - [x] patch cache con `setQueryData`;
  - [ ] mostra notifica/modal;
  - [x] nessuna azione se evento originato dallo stesso client.
- [x] Inserire deduplica eventi:
  - [x] `sourceClientId`;
  - [x] timestamp evento;
  - [x] chiave evento `table:action:id`;
  - [x] finestra anti-duplicato di pochi secondi.
- [ ] Evitare doppio evento `postgres_changes + broadcast` per la stessa azione, oppure deduplicarlo esplicitamente.

Criterio di uscita: realtime non puo' piu' causare reset di UI locale o render concorrenti.

---

## Fase 7 - Zustand per UI state

- [ ] Installare `zustand`.
- [ ] Creare store piccoli e separati:
  - [ ] `useNavigationStore`;
  - [ ] `useModalStore`;
  - [ ] `useCharacterSheetUiStore`;
  - [ ] `useCombatUiStore`;
  - [ ] `useFiltersStore`.
- [ ] Spostare nello store solo stato UI locale:
  - [ ] pagina/tab corrente;
  - [ ] sezioni aperte/chiuse;
  - [ ] filtri locali;
  - [ ] modali aperti;
  - [ ] selezioni temporanee;
  - [ ] stato wizard.
- [ ] Non mettere in Zustand dati Supabase che appartengono a TanStack Query.
- [ ] Aggiungere persistenza selettiva dove serve:
  - [ ] tab correnti;
  - [ ] filtri campagne;
  - [ ] preferenze UI;
  - [ ] stato navigazione sessione.

Criterio di uscita: `AppState` legacy puo' iniziare a essere svuotato e sostituito da store mirati.

---

## Fase 8 - React Router

- [ ] Installare `react-router`.
- [ ] Definire route progressive:
  - [ ] `/campagne`;
  - [ ] `/campagne/:campagnaId`;
  - [ ] `/campagne/:campagnaId/sessione`;
  - [ ] `/campagne/:campagnaId/sessione/:sessioneId/combattimento`;
  - [ ] `/personaggi`;
  - [ ] `/personaggi/:personaggioId`;
  - [ ] `/compendio`;
  - [ ] `/laboratorio`;
  - [ ] `/amici`.
- [ ] Creare bridge temporaneo tra `navigateToPage` legacy e router React.
- [ ] Sostituire gradualmente `sessionStorage currentPage/currentCampagnaId/currentSessioneId` con URL params.
- [ ] Gestire deep link e refresh pagina.
- [ ] Mantenere compatibilita' PWA notification click.

Criterio di uscita: le pagine React usano URL reali, non stato globale manuale.

---

## Fase 9 - React component migration

Ordine consigliato:

- [ ] `CampagneListPage`:
  - [ ] lista campagne;
  - [ ] filtri;
  - [ ] preferiti;
  - [ ] inviti.
- [ ] `CampagnaDetailsPage`:
  - [ ] header;
  - [ ] azioni sessione;
  - [ ] gestione giocatori;
  - [ ] scelta personaggio.
- [ ] `SessionPage`:
  - [ ] timer;
  - [ ] personaggi in sessione;
  - [ ] richiesta tiri;
  - [ ] stato sessione.
- [ ] `CombatPage`:
  - [ ] ordine iniziativa;
  - [ ] toolbar DM/player;
  - [ ] mostri;
  - [ ] condizioni;
  - [ ] turni/round.
- [ ] `CharacterSheetPage`:
  - [ ] pagina statistiche;
  - [ ] inventario;
  - [ ] incantesimi;
  - [ ] privilegi;
  - [ ] risorse;
  - [ ] micro scheda.
- [ ] `CompendiumPage`:
  - [ ] hub;
  - [ ] tabs;
  - [ ] ricerca;
  - [ ] lazy data bundle.
- [ ] `LaboratoryPage`:
  - [ ] homebrew list;
  - [ ] editor;
  - [ ] settings condivisione.

Criterio di uscita: ogni pagina migrata non deve piu' usare `innerHTML` per render principale.

---

## Fase 10 - Vitest

- [ ] Installare `vitest`.
- [ ] Aggiungere target Nx `test`.
- [ ] Testare funzioni pure:
  - [ ] calcoli modificatori D&D;
  - [ ] bonus competenza;
  - [ ] Factotum;
  - [ ] PF max/temporanei;
  - [ ] ordinamento iniziativa;
  - [ ] normalizzazione URL immagini;
  - [ ] filtri campagne;
  - [ ] mapper Supabase -> dominio;
  - [ ] schema Zod.
- [ ] Aggiungere test per query key builder e invalidazioni realtime.

Criterio di uscita: calcolatori e mapping dati hanno copertura minima prima di migrare componenti complessi.

---

## Fase 11 - Playwright E2E

- [ ] Installare `@playwright/test`.
- [ ] Creare ambiente test:
  - [ ] account test DM;
  - [ ] account test player;
  - [ ] campagna test;
  - [ ] personaggio test;
  - [ ] sessione test.
- [ ] Test E2E prioritari:
  - [ ] login e navigazione base;
  - [ ] lista campagne visibile;
  - [ ] apertura dettaglio campagna;
  - [ ] inizio sessione;
  - [ ] richiesta tiro iniziativa;
  - [ ] risposta player;
  - [ ] aggiornamento DM in realtime;
  - [ ] apertura tendina durante refetch senza chiusura;
  - [ ] modal aperto durante realtime senza reset;
  - [ ] combattimento round/turno;
  - [ ] PWA/service worker smoke test.
- [ ] Integrare test E2E in CI solo dopo stabilizzazione ambiente.

Criterio di uscita: i bug UX storici sono coperti da test browser reali.

---

## Fase 12 - Pulizia legacy post-migrazione

- [ ] Rimuovere gradualmente globali `window.*` sostituiti.
- [ ] Ridurre `AppState` fino a eliminarlo o mantenerlo come compatibility layer minimo.
- [ ] Rimuovere render manuali `innerHTML` dalle pagine migrate.
- [ ] Rimuovere guardie temporanee se non piu' necessarie.
- [ ] Eliminare script legacy non importati da Vite.
- [ ] Consolidare service worker con output build Vite.
- [ ] Aggiornare documentazione architetturale.

Criterio di uscita: React, query, router e store governano l'app; il legacy resta solo dove non ancora migrato.

---

## Milestone suggerite

### Milestone A - Fondamenta

- [ ] TypeScript presente.
- [ ] Vite presente.
- [ ] Service layer Supabase presente.
- [ ] Zod presente per dati critici.
- [ ] Build/check verdi.

### Milestone B - Dati e realtime

- [ ] TanStack Query configurato.
- [ ] Query keys definite.
- [ ] Realtime convertito a invalidazioni mirate per campagne/sessioni/combattimento.
- [ ] Zustand configurato per UI state.

### Milestone C - Prime pagine React

- [ ] Campagne in React.
- [ ] Dettaglio campagna in React.
- [ ] Sessione in React.

### Milestone D - Area critica realtime

- [ ] Combattimento in React.
- [ ] Test Playwright per realtime DM/player.
- [ ] Nessun render diretto da eventi realtime.

### Milestone E - Migrazione completa

- [ ] Scheda personaggio in React.
- [ ] Compendio in React.
- [ ] Laboratorio in React.
- [ ] Legacy cleanup.

---

## Note architetturali da rispettare

- TanStack Query = dati remoti e cache server.
- Zustand = stato UI locale.
- React Router = navigazione e URL.
- Zod = validazione runtime e tipi derivati.
- Supabase layer = unico punto autorizzato a parlare con DB/Auth/Realtime.
- Vitest = logica pura, mapping, calcoli.
- Playwright = flussi reali e regressioni UX.
- Nessun componente React dovrebbe chiamare direttamente `supabase.from(...)`.
- Nessun evento realtime dovrebbe chiamare direttamente un render.
- Nessun refetch dovrebbe chiudere modali, tendine o input attivi.
