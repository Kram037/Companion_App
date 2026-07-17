# Companion App

Companion App e una Progressive Web App per supportare campagne e sessioni di
Dungeons & Dragons. Riunisce gestione della campagna, personaggi, sessioni,
combattimenti, contenuti di riferimento e homebrew in un'unica interfaccia
utilizzabile da desktop e mobile.

Applicazione pubblicata: <https://kram037.github.io/Companion_App/>

## Obiettivo

L'app riduce il lavoro manuale del Dungeon Master e dei giocatori durante tutte
le fasi di una campagna:

- organizzazione di campagne, partecipanti e inviti;
- creazione e consultazione delle schede personaggio;
- gestione di sessioni, richieste di iniziativa e combattimenti in tempo reale;
- consultazione del Compendio di razze, classi, background, equipaggiamento,
  talenti, mostri, suppliche e incantesimi;
- creazione di contenuti homebrew nel Laboratorio;
- gestione di amici, preferiti, lingua, tema e layout desktop affiancato;
- installazione come PWA su telefono, tablet e desktop.

## Stato attuale dell'architettura

Il progetto e in migrazione incrementale da JavaScript legacy a
React/TypeScript. Non e un rewrite e i due livelli hanno responsabilita
diverse.

La UI approvata e ancora renderizzata dal runtime legacy:

- `index.html` contiene la shell e i contenitori delle pagine;
- `js/` gestisce rendering, interazioni e compatibilita del flusso corrente;
- `css/` definisce l'aspetto grafico attuale;
- `src/main.ts` inizializza Supabase e monta il bridge React;
- `src/app/AppRouter.tsx` e `LegacyNavigationSync.tsx` sincronizzano URL e
  navigazione legacy senza sostituire il DOM visibile;
- `src/api`, `src/schemas`, `src/query`, `src/store`, `src/realtime` e
  `src/features` costituiscono il livello typed e la base della migrazione.

I componenti presenti in `src/features` non sono automaticamente la fonte
della UI attiva. Prima di modificare un flusso bisogna verificare quale livello
ne possiede realmente rendering, stato e navigazione.

> **Vincolo UI:** l'aspetto corrente e la baseline obbligatoria. Leggere
> [`UI_BASELINE_CHECKPOINT.md`](UI_BASELINE_CHECKPOINT.md) prima di qualsiasi
> modifica grafica o migrazione di pagina.

## Funzionalita principali

| Area | Responsabilita |
| --- | --- |
| Campagne | Elenco campagne, dettagli, DM, partecipanti, inviti e preferiti |
| Personaggi | Creazione guidata, scheda, statistiche, risorse, inventario e incantesimi |
| Sessioni | Stato della sessione, timer, partecipanti e richieste di iniziativa |
| Combattimento | Ordine di iniziativa, turni, round, punti ferita e sincronizzazione realtime |
| Compendio | Consultazione e filtro dei dati D&D disponibili localmente |
| Laboratorio | Creazione e modifica di contenuti homebrew salvati su Supabase |
| Amici | Richieste, relazioni sociali e supporto agli inviti |
| PWA | Installazione, manifest, icone, cache offline e aggiornamenti |

## Struttura del repository

```text
Companion_App/
|-- index.html                  # Shell HTML e mount point React
|-- src/                        # Livello React/TypeScript
|   |-- api/                    # Accesso typed a Supabase
|   |-- app/                    # Bootstrap, router e bridge legacy
|   |-- components/             # Componenti React condivisi
|   |-- features/               # Modelli e pagine per dominio
|   |-- query/                  # TanStack Query, key e invalidazioni
|   |-- realtime/               # Normalizzazione eventi realtime
|   |-- router/                 # Route e mapping verso il runtime legacy
|   |-- schemas/                # Validazione runtime con Zod
|   |-- store/                  # Stato UI locale con Zustand
|   `-- types/                  # Tipi di dominio condivisi
|-- js/                         # Runtime JavaScript legacy attivo
|   |-- Core/                   # Stato, auth, navigazione, cache e realtime
|   |-- Campagna/               # Campagne e dettagli
|   |-- Personaggi/             # Wizard e scheda personaggio
|   |-- Sessioni/               # Sessioni e iniziativa
|   |-- Combattimento/          # Runtime del combattimento
|   |-- Compendio/              # Liste e dettagli del Compendio
|   |-- Laboratorio/            # Editor homebrew
|   `-- Social/                 # Amici e inviti
|-- css/                        # Stili legacy divisi per dominio
|-- backend/supabase/sql/       # Schema, migrazioni, RPC e policy RLS
|-- risorse/                    # Fonti D&D, generatori e manifest dei dataset
|-- images/                     # Icone e immagini statiche
|-- tests/e2e/                  # Test Playwright dei flussi utente
|-- tools/                      # Check architetturali e runner
|-- docs/                       # Guide tecniche e documenti di migrazione
|-- manifest.json               # Configurazione PWA
|-- sw.js                       # Service worker
|-- vite.config.ts              # Build e copia degli asset legacy
|-- project.json                # Target Nx
`-- TODO_TECH_STACK_MIGRATION_2.md
```

## Route applicative

| Route | Vista |
| --- | --- |
| `/campagne` | Elenco campagne |
| `/campagne/:campagnaId` | Dettaglio campagna |
| `/campagne/:campagnaId/sessione` | Sessione attiva |
| `/campagne/:campagnaId/sessione/:sessioneId/combattimento` | Combattimento |
| `/personaggi` | Elenco personaggi |
| `/personaggi/nuovo` | Creazione personaggio |
| `/personaggi/:personaggioId` | Scheda personaggio |
| `/compendio` | Compendio |
| `/laboratorio` | Laboratorio homebrew |
| `/amici` | Amici |

React Router mantiene gli URL profondi; il bridge traduce ogni route nello
stato richiesto da `navigateToPage` e dal renderer legacy.

## Requisiti e avvio locale

La CI usa Node.js 22. E consigliato usare la stessa versione in locale.

```bash
npm ci
npm run serve
```

L'app viene servita su <http://127.0.0.1:8000>.

La configurazione client di Supabase e letta da `js/Core/config.js`. La chiave
`anon` e pubblica per definizione: la protezione dei dati dipende dalle policy
Row Level Security. Non inserire mai nel client la service role key, segreti
OAuth o credenziali di test.

## Comandi disponibili

| Comando | Scopo |
| --- | --- |
| `npm run serve` | Avvia Vite sulla porta 8000 |
| `npm run check` | Typecheck, sintassi JS e verifica dei dataset runtime |
| `npm test` | Esegue i test unitari Vitest |
| `npm run e2e:install` | Installa Chromium per Playwright |
| `npm run e2e` | Crea la build, avvia il preview ed esegue gli E2E |
| `npm run build` | Genera `dist/apps/companion-app` |
| `npm run audit` | Controlla le vulnerabilita npm note |

`npm run e2e` usa la porta 8000: arrestare prima un eventuale server locale gia
attivo sulla stessa porta.

## Test

Prima di integrare una modifica eseguire almeno:

```bash
npm run check
npm test
npm run e2e
npm run build
```

I test pubblici non richiedono credenziali. I test Supabase autenticati vengono
abilitati solo quando sono presenti le variabili dedicate:

```text
E2E_DM_EMAIL
E2E_DM_PASSWORD
E2E_PLAYER_EMAIL
E2E_PLAYER_PASSWORD
E2E_CAMPAIGN_ID
E2E_SESSION_ID
E2E_CHARACTER_ID
E2E_EMPTY_CAMPAIGN_ID
E2E_MUTATION_TESTS=1
```

I test mutativi devono usare esclusivamente account e campagne fixture. Non
eseguirli su dati reali degli utenti.

## Dati del Compendio

Le fonti si trovano in `risorse/`; i bundle caricati dall'app si trovano in
`js/Personaggi/data` e `js/Compendio/data`. Il file
`risorse/runtime-data-manifest.json` collega ogni output alle sue fonti e al
relativo generatore.

Regole:

1. Non modificare manualmente un output dichiarato come `generated`.
2. Modificare la fonte, eseguire il generatore indicato nel manifest e
   verificare il diff prodotto.
3. Dichiarare ogni nuovo bundle nel manifest.
4. Eseguire `npm run check` per verificare file, fonti e generatori.
5. Caricare i dataset pesanti tramite `ensureRuntimeData`, non nel bootstrap
   iniziale.

## Supabase e realtime

Supabase fornisce autenticazione, database PostgreSQL, RPC e realtime. I nuovi
moduli devono accedere al client tramite `src/api/supabaseClient.ts`; la globale
`window.supabaseClient` esiste solo come compatibilita temporanea con il legacy.
La globale e `js/Core/supabase.js` potranno essere rimossi insieme solo quando
nessun file runtime in `js/` chiamera piu `getSupabaseClient` e tutte le pagine
attive useranno esclusivamente le API typed in `src/api`.

Per ogni modifica SQL:

1. applicare RLS a tutte le tabelle esposte;
2. verificare `auth.uid()` nelle policy e nelle funzioni `SECURITY DEFINER`;
3. limitare RPC e query al proprietario, DM o membro autorizzato;
4. evitare policy pubbliche `USING (true)` senza una decisione esplicita;
5. testare separatamente i ruoli DM, giocatore e utente esterno.

Gli eventi realtime devono produrre una sola azione osservabile: invalidazione
mirata, patch della cache o notifica UI. Evitare render completi che chiudono
modali, resettano input o fanno perdere lo stato locale.

## PWA e deploy

Vite genera la build in `dist/apps/companion-app`, copia gli asset legacy e
adatta la base URL al repository GitHub Pages. `manifest.json` e `sw.js`
gestiscono installazione e cache.

Il workflow `.github/workflows/deploy-pages.yml` esegue check, test, Playwright
e build prima del deploy. I push su `main`, `tech_migration` e
`tech_migration_2` pubblicano nello stesso ambiente Pages: l'ultimo workflow
completato diventa la versione online.

Quando si modificano manifest, service worker, script lazy o asset PWA bisogna
verificare sia una nuova installazione sia l'aggiornamento di un'installazione
esistente. Non considerare sufficiente il solo caricamento nel browser desktop.

## Best practice di sviluppo

1. **Preservare la UI.** Nessuna migrazione tecnica deve cambiare grafica,
   responsive behavior o flussi senza una richiesta esplicita.
2. **Un solo proprietario per flusso.** Una pagina non deve essere renderizzata
   contemporaneamente da React e legacy.
3. **Correggere la causa condivisa.** Navigazione, cache e stato vanno sistemati
   nel punto comune, non con patch duplicate nelle singole pagine.
4. **Mantenere piccoli i cambiamenti.** Evitare rewrite, astrazioni speculative
   e dipendenze non necessarie.
5. **Usare i confini typed.** Nei nuovi moduli usare `src/api`, tipi di dominio
   e schema Zod invece di chiamare Supabase o manipolare payload direttamente.
6. **Separare lo stato.** Dati server in TanStack Query; stato UI locale in
   Zustand; URL in React Router. Non duplicare la stessa fonte di verita.
7. **Trattare i globali come compatibilita.** Non aggiungere nuove API
   `window.*` senza una necessita di interoperabilita documentata.
8. **Proteggere ogni trust boundary.** Validare input e payload, fare escaping
   dell'HTML legacy e affidare l'autorizzazione al database, non alla UI.
9. **Preservare lo stato durante il realtime.** Accordion, modali, filtri e
   input attivi non devono essere ricreati inutilmente.
10. **Testare il flusso modificato.** Aggiungere il controllo piu piccolo che
    fallirebbe senza il fix e mantenere verdi check, unit test ed E2E.
11. **Non modificare gli artefatti.** `dist/`, `node_modules/`, log e risultati
    Playwright sono generati e non vanno committati.

## Migrazione tecnologica

La roadmap corrente e in
[`TODO_TECH_STACK_MIGRATION_2.md`](TODO_TECH_STACK_MIGRATION_2.md). Le priorita
sono sicurezza RLS, guardie automatiche, client Supabase unico, ownership della
navigazione, realtime disciplinato, migrazione graduale delle pagine e pulizia
dei globali legacy.

Una pagina puo essere considerata migrata solo quando:

- React ne possiede rendering, navigazione e stato senza doppioni legacy;
- le API passano dal livello typed;
- i payload esterni sono validati;
- deep link, refresh, back/forward e realtime sono coperti;
- desktop e mobile restano visivamente uguali alla baseline approvata.

## Documentazione utile

- [`UI_BASELINE_CHECKPOINT.md`](UI_BASELINE_CHECKPOINT.md): contratto grafico.
- [`TODO_TECH_STACK_MIGRATION_2.md`](TODO_TECH_STACK_MIGRATION_2.md): roadmap.
- [`docs/realtime-rules.md`](docs/realtime-rules.md): regole degli eventi realtime.
- [`docs/GOOGLE_OAUTH_SETUP.md`](docs/GOOGLE_OAUTH_SETUP.md): configurazione OAuth.
- [`backend/supabase/sql`](backend/supabase/sql): migrazioni e policy database.

Alcuni documenti in `docs/` descrivono fasi precedenti o l'architettura target:
in caso di conflitto, il codice corrente, questo README e la baseline UI sono la
fonte di verita.
