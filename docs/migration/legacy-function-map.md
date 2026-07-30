# Runtime Ownership and Legacy Map

Inventario verificato sul branch `react_migration` il 2026-07-30. Questa e' la
fonte di verita' per decidere chi possiede una pagina durante la migrazione.
La presenza di un componente React non equivale alla sua ownership runtime:
fa fede `src/app/AppRouter.tsx` insieme all'allowlist in `src/main.ts`.

## Bootstrap corrente

| Confine | Implementazione |
| --- | --- |
| Documento e shell | `index.html` contiene header, toolbar, pagine legacy, modali e `#react-root` |
| Bootstrap typed | `src/main.ts` crea il client Supabase, registra i bridge e monta React |
| Router | `src/app/AppRouter.tsx` + `src/router/*` |
| Bridge | `LegacyNavigationSync`, `window.CompanionRouterBridge`, `AppState` e `navigateToPage` |
| Provider React | TanStack Query e invalidazione realtime in `src/app/AppProviders.tsx` |
| Bootstrap legacy | script `js/Core/*`, Social, Campagna, Personaggi e Sessioni caricati da `index.html` |
| Script lazy | `js/Compendio/compendio.js` e `js/Laboratorio/laboratorio.js` tramite `ensureRuntimeScript` |
| Dataset lazy | bundle registrati in `js/Core/data-loader.js` |
| Build | Vite produce i chunk React e copia `js`, `css`, `images`, `risorse`, manifest e service worker |

## Ownership delle pagine

| Area | Owner runtime corrente | React presente | Dipendenze principali | Destinazione roadmap |
| --- | --- | --- | --- | --- |
| Shell, header, toolbar, sidebar e split view | Legacy | Solo `ReactPage` e bridge | `index.html`, `js/Core/init.js`, `navigation.js`, `bookmarks.js`, CSS Core | 10, 12, 17 |
| Campagne | React | Montato | `CampaignsRoutePage`, `campaignsApi`, `campaignQueries`; dialog legacy in `js/Campagna/campagne.js` | 16 |
| Dettaglio campagna | React | Montato | `CampaignDetailsPage`, `campaignDetailQueries`, dialog/inviti legacy | 16 |
| Sessione | React | Montato | `SessionPage`, `sessionsApi`, prompt tiro legacy | 08, 16 |
| Combattimento | React | Montato | `CombatPage`, `CombatTools`, `combatApi`, `combatToolsApi` | 08, 16 |
| Amici | React | Montato | `FriendsPage`, `friendsApi`; modale aggiunta legacy | 12, 16 |
| Personaggi lista | Legacy | `CharactersPage` non montato | `js/Personaggi/personaggi-lista.js`, `personaggi.js`, `charactersApi` | 13 |
| Creazione/modifica personaggio | Legacy | `CharacterCreationPage` non montato | wizard e form in `js/Personaggi/*`, modali in `index.html` | 13 |
| Scheda personaggio | Legacy | `CharacterSheetPage` non montato e ancora dipendente da callback globali | renderer/editor/inventario/incantesimi/privilegi in `js/Personaggi/*` | 13 |
| Compendio | Legacy | `CompendiumPage` non montato; usa ancora `LegacyFragment` e adapter legacy | `js/Compendio/compendio.js`, dataset lazy, bookmark | 12, 14 |
| Laboratorio | Legacy | `LaboratoryPage` non montato; usa adapter legacy | `js/Laboratorio/laboratorio.js`, tabelle homebrew | 12, 15 |
| Auth e profilo | Legacy | Solo query utente corrente | `js/Core/auth.js`, `users.js`, modali di `index.html`, `usersApi` | 04, 11 |
| Tema e lingua/localizzazione | Legacy | Nessun owner React | `theme.js`, `lang.js`, `content-localization.js`, `localStorage` | 12 |
| Dice roller e notifiche UI | Legacy | Nessun owner React | `dice-roller.js`, `utils.js`, `init.js` | 12 |
| PWA, install/update e push | Legacy/platform | Nessun owner React richiesto per `sw.js` | `init.js`, `realtime.js`, `sw.js`, `manifest.json` | 19 |
| Realtime | Ibrido | Client typed attivo | `src/realtime/realtimeClient.ts` deduplica/invalida; `js/Core/realtime.js` conserva broadcast, prompt e push | 08, 17 |

## Dati e contratti per dominio

| Dominio | Tabelle principali | RPC principali | Layer typed corrente |
| --- | --- | --- | --- |
| Utente/Auth | `utenti`, `razze`, `background`, `push_subscriptions` | `generate_unique_cid`, `get_uids_by_user_ids` | `usersApi`, `currentUserQuery` |
| Campagne/inviti | `campagne`, `utenti`, `inviti_campagna`, `personaggi_campagna` | `get_dm_campagna`, `get_dms_campagne`, `get_giocatori_campagna`, `get_inviti_ricevuti`, `invia_invito_campagna`, `accetta_invito_campagna`, `rifiuta_invito_campagna`, `rimuovi_giocatore_campagna`, `update_dm_campagna` | `campaignsApi` |
| Sessione/tiri | `sessioni`, `richieste_tiro_iniziativa`, `richieste_tiro_generico`, `personaggi` | `start_campaign_session`, `finish_campaign_session`, `request_initiative_rolls`, `request_generic_rolls`, `submit_initiative_roll`, `submit_generic_roll`, `update_campaign_character_conditions` | `sessionsApi` |
| Combattimento | `mostri_combattimento`, `combat_timers`, `personaggi` | `get_combat_monsters_safe`, `advance_combat_turn`, `finish_combat`, `get_tiri_iniziativa`, `get_personaggi_in_campagna` | `combatApi`, `combatToolsApi` |
| Amici | `richieste_amicizia`, `utenti` | `search_user_by_name_and_cid`, `get_amici`, `get_richieste_in_entrata`, `get_richieste_in_uscita` | `friendsApi` |
| Personaggi | `personaggi`, `personaggi_campagna`, `campagne` | `get_personaggi_utente`, `select_personaggio_campagna`, `get_personaggio_campagna`, `get_personaggi_in_campagna` | `charactersApi` incompleto rispetto alle mutazioni legacy |
| Homebrew | `homebrew_background`, `homebrew_classi`, `homebrew_combattimenti`, `homebrew_incantesimi`, `homebrew_nemici`, `homebrew_oggetti`, `homebrew_razze`, `homebrew_stili`, `homebrew_suppliche`, `homebrew_talenti`, `utenti.homebrew_settings` | `get_amici`, `get_uids_by_user_ids` | `homebrewApi` copre lettura/eliminazione; editor legacy conserva gran parte delle mutazioni |
| Compendio | Nessuna tabella per i dataset statici | Nessuna | `runtimeDataApi`, `compendiumQueries`, adapter legacy |

Gli script SQL richiesti dal frontend protetto devono essere applicati
seguendo `backend/supabase/RLS_DEPLOY_CHECKLIST.md`. La loro presenza nel
repository non certifica staging o produzione.

## CSS e markup da preservare

| Area | CSS owner |
| --- | --- |
| Shell, amici, modali, bookmark, tema | `css/Core/base.css`, `components.css`, `modals.css`, `bookmarks.css`, `fantasy.css` |
| Dice roller | `css/Core/dice-roller.css` |
| Campagne | `css/Campagna/campagne.css` |
| Sessione | `css/Sessioni/sessions.css` |
| Combattimento | `css/Combattimento/combat.css` |
| Personaggi | `css/Personaggi/personaggi.css` |
| Compendio | `css/Compendio/compendio.css` |
| Laboratorio | `css/Laboratorio/laboratorio.css` |

React deve riusare classi, gerarchia e attributi esistenti. La rimozione di CSS
e' ammessa solo nella scheda 17, dopo confronto visuale.

## Stato persistito ed eventi globali

- `localStorage`: tema, lingua, bookmark/split view, notifiche e configurazione
  push; la sessione Supabase usa inoltre le proprie chiavi.
- `sessionStorage.activeSessionCampagnaId`: compatibilita' della sessione
  attiva, ancora letta dalla shell e scritta dalle pagine React Campagna.
- `companion:data-changed`: bridge da realtime legacy a TanStack Query.
- `appLangChanged` e `homebrew:*-loaded`: aggiornamento dei dataset legacy.
- canale Supabase `app-events` e canali player per richieste tiro: ancora
  orchestrati in parte da `js/Core/realtime.js` e `js/Sessioni/initiative.js`.
- `window.*`: `AppState`, navigazione, modali, bookmark, editor personaggio,
  adapter Compendio/Laboratorio e servizi UI restano API di compatibilita'.

## Dataset runtime e generated

`risorse/runtime-data-manifest.json` e' la fonte autorevole. Registra output,
globale, sorgente e generatore per:

- background, classi, talenti, invocazioni, razze, incantesimi, sottoclassi,
  oggetti magici e veleni;
- equipaggiamento, mostri e statblock di evocazione;
- `fighting_styles_data.js`, esplicitamente `manual-runtime`.

Gli output in `js/Personaggi/data` e `js/Compendio/data` non si modificano
direttamente. La scheda 20 deve mantenere manifest e generatori allineati.

## Correzioni documentali registrate

- La precedente versione di questa mappa descriveva Scheda personaggio,
  Compendio e Laboratorio come renderer sostituiti. I componenti React esistono,
  ma `AppRouter` non li monta: l'owner corrente e' ancora legacy.
- `docs/migration/TODO_TECH_STACK_MIGRATION.md` resta uno storico; la roadmap
  operativa corrente e' Trello insieme a questa mappa e alla checklist
  `TODO_TECH_STACK_MIGRATION_2.md`.

## Regola di aggiornamento

Quando una slice cambia owner:

1. aggiornare `AppRouter` e l'allowlist `reactOwnedPages`;
2. aggiornare questa tabella nello stesso commit;
3. rimuovere il renderer legacy soltanto dopo il gate della slice;
4. verificare `npm run check`, test mirati, E2E e baseline visuale.
