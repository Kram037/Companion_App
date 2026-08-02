# Audit accesso dati typed

Data: 2026-08-02
Branch: `react_migration`
Scheda Trello: 06

## Prerequisiti e documentazione corrente

L'audit conserva i vincoli delle schede 01-04: nessun cambiamento UI, ownership
incrementale, fixture separata dalla produzione e autorizzazione demandata a
RLS/RPC. La documentazione Supabase corrente conferma inoltre che:

- le query possono e devono specificare le colonne richieste;
- i tipi TypeScript generati dallo schema sono utili soltanto se prodotti da
  una sorgente riproducibile e aggiornata;
- `abortSignal` va applicato alle richieste che hanno una reale esigenza di
  cancellazione;
- i grant della Data API e le policy RLS sono livelli distinti. Il gate della
  scheda 04 li verifica separatamente sul progetto E2E.

Riferimenti:

- <https://supabase.com/docs/reference/javascript/select>
- <https://supabase.com/docs/reference/javascript/typescript-support>
- <https://supabase.com/docs/reference/javascript/using-modifiers-abortsignal>
- <https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically>

## Mappa dei domini

| Dominio | Modulo API | Tabelle / RPC principali | Contratto in uscita |
| --- | --- | --- | --- |
| Auth e utenti | `usersApi.ts` | `utenti`, `get_amici`, Auth client | SDK Supabase + `userProfileSchema` + contratto amici |
| Campagne e inviti | `campaignsApi.ts` | `campagne`, `utenti`, RPC DM/giocatori/inviti | schema campagne, player, personaggi e inviti |
| Sessioni e tiri | `sessionsApi.ts` | `sessioni`, richieste tiro, RPC atomiche | schema sessione e risultati tiro |
| Combattimento | `combatApi.ts`, `combatToolsApi.ts` | mostri, timer e RPC atomiche/sicure | schema snapshot, mostri, timer e input mutation |
| Personaggi | `charactersApi.ts` | `personaggi`, `personaggi_campagna`, `campagne` | schema personaggio e righe di associazione |
| Amici | `friendsApi.ts` | `richieste_amicizia`, RPC amici | schemi dedicati per i tre payload RPC |
| Homebrew | `homebrewApi.ts` | dieci tabelle homebrew consentite | `HomebrewTable` chiuso + `homebrewItemSchema` |
| Dataset runtime | `runtimeDataApi.ts` | HTTP statico | schema Zod fornito dal chiamante |

Auth write, editor Personaggi/Homebrew e le altre mutazioni ancora legacy non
vengono duplicate in anticipo: saranno aggiunte al layer typed dalle slice
11-16 quando cambiera' l'owner runtime.

## Gap corretti

- Aggiunto `src/api/databaseContract.ts` come catalogo unico dei nomi di
  tabelle e RPC usati dal layer typed; i mapping restano vicini al dominio.
- Validati con Zod i payload eterogenei delle RPC amici/DM e le righe di
  associazione Personaggi-Campagne prima che entrino nella UI.
- Normalizzati gli errori tecnici in `DataAccessError`, mantenendo messaggio e
  codice originali ma aggiungendo categoria e indicazione `retryable`.
- Reso obbligatorio il contratto Zod per i JSON caricati da
  `runtimeDataApi.ts`; questo e' anche l'unico fetch generico che accetta un
  `AbortSignal`, perche' puo' trasferire dataset statici pesanti.
- Estesa `check-api-boundaries.mjs`: blocca import Supabase fuori dal singleton,
  accessi al client fuori da `src/api`, `select()`/`select('*')` e nuovi nomi
  DB letterali fuori dal catalogo.
- Aggiunti test di contratto per payload sociali, errori normalizzati e JSON
  runtime, oltre a test delle mutazioni rischiose su preferiti, inviti, amici,
  resistenze e cancellazione homebrew.

## Decisioni esplicite

- Non e' stato creato a mano un `database.types.ts`: uno snapshot non generato
  dal progetto certificato diventerebbe immediatamente una seconda fonte di
  verita'. La pipeline riproducibile dei generated appartiene alla scheda 20;
  nel frattempo ogni API espone tipi di dominio e valida i confini remoti che
  possono rilevare drift reale.
- Non e' stato aggiunto `abortSignal` indiscriminatamente a tutte le query
  Supabase: le query attuali sono legate a route/query key stabili e ricerca e
  filtri sono locali. La cancellazione e' presente sul fetch di dataset, dove
  evita realmente lavoro e trasferimento inutili.
- I messaggi SQL applicativi delle RPC vengono preservati: sostituirli con un
  errore generico perderebbe informazioni utili e cambierebbe il comportamento
  percepito. La normalizzazione aggiunge metadati senza nascondere il messaggio.

## Verifica

- `npm run check`: verde, inclusa la nuova guardia API sui 70 file typed;
- `npm test`: 26 file e 70 test passati, compresi i nuovi contratti dati e le
  mutazioni sensibili;
- `npm run build`: verde e dentro i budget della baseline;
- `npm run e2e`: 54 test pubblici/visuali passati, 5 staging autenticati
  esclusi in locale; il workflow della scheda 03 li rende obbligatori e
  zero-skip in CI;
- `git diff --check`: verde.

L'audit non ha eseguito migrazioni, scritture o test mutativi sulla produzione.
