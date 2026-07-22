# Checkpoint: ripristino autenticazione Supabase

Data: 22 luglio 2026  
Branch sorgente: `react_migration`

## Risultato

Il login mostrava il messaggio:

> Autenticazione Google non disponibile. Controlla la configurazione Supabase.

La configurazione Supabase era valida. Il problema reale era il deploy GitHub
Pages: venivano pubblicati i sorgenti grezzi tramite Jekyll invece dell'output
compilato da Vite. Di conseguenza il modulo che crea il client Supabase non
veniva mai eseguito.

## Flusso coinvolto

Il percorso corretto di inizializzazione e questo:

1. `index.html` carica `js/Core/config.js`.
2. Il bundle generato da `src/main.ts` esegue `initializeSupabaseClient()`.
3. `src/api/supabaseClient.ts` crea il singleton e lo espone come
   `window.supabaseClient`.
4. `js/Core/supabase.js` rende il singleton disponibile al codice legacy.
5. `handleGoogleLogin()` usa il client per chiamare
   `supabase.auth.signInWithOAuth()`.

Il messaggio di errore compare prima della richiesta OAuth: significa che
`getSupabaseClient()` e rimasto `null`. Non indica, da solo, un problema del
provider Google nel pannello Supabase.

## Diagnosi eseguita

### 1. Tracciato il punto di errore

E stato verificato `handleGoogleLogin()` in `js/Core/auth.js`. Il messaggio
veniva mostrato esclusivamente quando il client era ancora assente dopo
`waitForSupabase()`.

### 2. Verificate configurazione e protezioni runtime

Sul branch erano gia presenti:

- URL e anon key in `js/Core/config.js`;
- attesa esplicita della disponibilita del client prima del login;
- callback `onAuthStateChange` rinviato fuori dal lock interno di Supabase;
- avvio della shell non bloccato da un refresh lento della sessione.

Queste correzioni rendono l'avvio robusto, ma non possono creare il client se
il bundle Vite non viene caricato.

### 3. Controllati gli asset realmente pubblicati

La pagina live caricava correttamente gli script legacy aggiornati, ma il suo
entrypoint era ancora:

```html
<script type="module" src="/src/main.ts"></script>
```

Su GitHub Pages quel percorso puntava a
`https://kram037.github.io/src/main.ts` e restituiva `404`. Inoltre i sorgenti
TypeScript con import npm devono comunque essere compilati da Vite prima del
deploy.

### 4. Identificata la pipeline errata

L'esecuzione Pages associata a `react_migration` usava il build Jekyll
automatico. Il workflow Vite in `.github/workflows/deploy-pages.yml` non
partiva per quel branch, perche il trigger includeva solo `main`,
`tech_migration` e `tech_migration_2`.

## Correzioni applicate

### Deploy Vite anche da `react_migration`

`react_migration` e stato aggiunto ai branch del trigger `push` del workflow.
Il workflow esistente:

1. installa le dipendenze;
2. esegue check, unit test ed E2E;
3. costruisce `dist/apps/companion-app` con il base path del repository;
4. carica l'artefatto Pages;
5. attende il deploy Jekyll concorrente;
6. pubblica per ultimo l'artefatto Vite.

### Corretto il test che bloccava il deploy

Il primo workflow Vite e arrivato fino agli E2E, ma un test della split view
usava `.react-page-shell .campagne-list`. Dopo la migrazione della lista
campagne quel selettore trovava sia la lista React sia il fixture aggiunto dal
test.

Al fixture e stato assegnato l'id `testWideCampagneList` e il test ora misura
solo quell'elemento. Non e stato modificato alcun comportamento o stile
dell'applicazione.

## Verifiche finali

- Build Vite locale completata.
- E2E Supabase e test mirato della split view completati.
- Workflow GitHub Pages completato con successo.
- L'HTML live non contiene piu `/src/main.ts`.
- L'entrypoint live e `/Companion_App/assets/index-*.js` e risponde `200` con
  MIME type JavaScript.
- Il bundle contiene l'inizializzazione di `supabaseClient` e l'evento
  `companion:supabase-ready`.
- Il service worker pubblicato usa un nome cache derivato dalla build.

## Checklist in caso di ricomparsa

1. Aprire l'HTML pubblicato, non solo quello locale.
2. Verificare che il modulo principale punti a
   `/Companion_App/assets/index-*.js`.
3. Controllare che il bundle risponda `200` e non che venga servito
   `/src/main.ts`.
4. Verificare che il branch corrente attivi `deploy-pages.yml`.
5. Controllare quale workflow Pages ha pubblicato per ultimo: Jekyll o Vite.
6. Eseguire `npm.cmd run build` e `npm.cmd run e2e` prima del push.
7. Dopo il deploy, chiudere e riaprire la PWA per attivare il nuovo service
   worker.

Non aumentare ulteriormente i timeout di `waitForSupabase()` finche non e
stato confermato che il bundle Vite viene eseguito: un timeout non corregge un
entrypoint assente.

## Commit del checkpoint

- `d51c55a` - correzione deadlock durante l'avvio auth;
- `d28cd91` - attesa esplicita del client nel login Google;
- `2931853` - deploy Vite abilitato per `react_migration`;
- `a5d53f8` - selettore E2E della split view reso univoco.
