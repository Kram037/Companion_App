# Refactor Audit - 2026-06-27

## Stato

- Branch: `develop`
- Nx workspace presente, progetto root: `companion-app`
- Target verificati:
  - `NX_DAEMON=false npm.cmd run check`
  - `NX_DAEMON=false npm.cmd run build`
- Working tree non pulito prima dell'audit:
  - `D images/Compendio/spellbook.svg`
  - `?? risorse/Manuali/`
  - `?? risorse/mostri/Lista Mostri.pdf`

## Struttura attuale

- App statica root-based: `index.html`, `css/`, `js/`, `images/`, `risorse/`, `sql/`
- Nx e' usato come orchestratore, non come struttura `apps/`/`libs/`
- `index.html` carica 65 script JS statici
- Payload JS iniziale stimato: circa 5.2 MB
- File tracciati sotto `js`, `css`, `risorse`, `tools`, root app: 160

## Hotspot dimensioni

Top data bundle caricati o disponibili:

- `js/Compendio/data/mostri_data.js`: 1464.8 KB
- `js/Personaggi/data/spells_data.js`: 1169.9 KB
- `js/Personaggi/data/classes_data.js`: 791.8 KB
- `js/Personaggi/data/oggetti_magici_data.js`: 712.6 KB
- `js/Compendio/data/equipaggiamento_data.js`: 346.2 KB
- `js/Personaggi/data/races_data.js`: 212.4 KB

Top codice applicativo:

- `js/Laboratorio/laboratorio.js`: 229.4 KB
- `js/Compendio/compendio.js`: 185.2 KB
- `js/Combattimento/combat.js`: 137 KB
- `js/Campagna/campagne.js`: 93 KB

Criticita: i dati sono duplicati tra `risorse/**/*.json` e `js/**/data/*.js`. Serve un confine netto tra sorgenti dati e output runtime.

## Accoppiamento runtime

Conteggi indicativi:

- JS files: 66
- `window.` refs: 1245
- `AppState` refs: 417
- DOM refs (`getElementById`/`querySelector`): 1248

Criticita: lo stato e le API globali sono il principale vincolo al refactor. Spostare file prima di ridurre questi punti crea regressioni.

## Vulnerabilita npm

`npm audit --json`:

- Totale: 5
- Moderate: 3
- High: 2
- Runtime app: nessuna dipendenza prod diretta
- Causa: `nx@21.6.11` e transitive dev deps:
  - `minimatch`
  - `js-yaml`
  - `front-matter`
  - `@yarnpkg/parsers`
- Fix indicato da npm: upgrade major a `nx@23.0.1`

Valutazione: rischio runtime basso perche e' toolchain dev, ma va risolto prima di consolidare CI.

## Criticita principali

1. Payload iniziale troppo alto.
   - Molti dati vengono caricati a prescindere dalla pagina.
   - Priorita: lazy load per compendio/personaggi, partendo da mostri, incantesimi, classi, oggetti.

2. Moduli globali.
   - Troppi riferimenti a `window` e `AppState`.
   - Priorita: introdurre confini piccoli solo nei punti condivisi: navigation, state, data loaders.

3. Dati runtime generati senza pipeline unica.
   - JSON sorgenti e JS runtime convivono senza contratto unico.
   - Priorita: generatori Nx dedicati per dati, output in una sola cartella runtime.

4. Nx daemon instabile in run paralleli.
   - `npm run check` e `npm run build` in parallelo fanno cadere il daemon.
   - Workaround stabile: `NX_DAEMON=false`.
   - Priorita: mettere `NX_DAEMON=false` negli script o in CI.

5. Asset/manuali pesanti.
   - `risorse/Manuali/` e `Lista Mostri.pdf` non devono entrare in build/deploy.
   - `nx.json` e `build-static.mjs` li escludono gia.

6. File sorgente/scrape probabilmente morti.
   - `risorse/mostri/mostri.html`
   - `risorse/mostri/mostri_files/*`
   - PDF e script storici in `risorse/*`
   - Priorita: separare `sources/` da `generated/`, poi decidere cosa tenere.

7. Log/debug in produzione.
   - Molti `console.log` in `js/Core`, `js/Campagna`, `js/Sessioni`.
   - Priorita: rimuovere log rumorosi o instradarli dietro helper `appDebug`.

## Sequenza refactor consigliata

1. Stabilizzare toolchain.
   - Disabilitare Nx daemon negli script.
   - Upgrade controllato Nx 21 -> 23 o pin/fix transitive se possibile.
   - Aggiungere target `audit`.

2. Separare dati.
   - `risorse/` = sorgenti/manuali/generatori.
   - `js/*/data` o futuro `apps/companion-app/assets/data` = output runtime.
   - Nessun dato duplicato modificato a mano in due posti.

3. Lazy load dati grandi.
   - Mostri.
   - Incantesimi.
   - Classi/razze/oggetti.
   - Misura: ridurre script iniziali da 65 a un core minimo.

4. Tagliare globali condivisi.
   - Prima `Core/state`.
   - Poi `Core/navigation`.
   - Poi `Compendio` e `Laboratorio`.
   - Non toccare UI singole prima dei confini core.

5. Spostare in `apps/` e `libs/`.
   - Solo dopo lazy loading e data boundary.
   - Evita rotture massive di path statici.

## Prossimo step concreto

Applicare il minimo fix toolchain:

- mettere `NX_DAEMON=false` negli script npm;
- aggiungere script `audit`;
- valutare upgrade Nx 23 in branch separato;
- rieseguire `check`, `build`, `audit`.

## Step toolchain - completato

- Script Nx eseguiti tramite `tools/nx-run.mjs` con `NX_DAEMON=false`.
- Aggiunto script npm `audit`.
- Aggiornato Nx da `21.6.11` a `23.0.1`.
- Verifiche:
  - `npm.cmd run check`
  - `npm.cmd run build`
  - `npm.cmd run audit -- --audit-level=moderate`
- Esito audit: `found 0 vulnerabilities`.

## Step dati runtime - primo confine

- Aggiunto `risorse/runtime-data-manifest.json`.
- Ogni output runtime in `js/Personaggi/data` e `js/Compendio/data` deve essere dichiarato nel manifest.
- Aggiunto `tools/check-data-boundary.mjs`.
- Il target Nx `check` ora verifica:
  - sintassi JS;
  - presenza nel manifest di tutti i data bundle runtime;
  - esistenza di sorgenti e generatori dichiarati.

Questo non sposta ancora i file. Impedisce prima nuovi output dati non tracciati.

## Step dati runtime - loader

- Aggiunto `js/Core/data-loader.js`.
- Espone `window.ensureRuntimeData(key)` per caricare un bundle dati solo quando serve.
- Nessun dato e' stato ancora rimosso da `index.html`: il loader prepara il lazy load senza cambiare comportamento runtime.

## Step lazy load - statblock evocati

- Rimosso `js/Compendio/data/summon_statblocks_data.js` dal caricamento iniziale.
- Il compendio lo carica solo quando apre dettagli incantesimo o statblock evocati.
- Il service worker lo tratta come dato runtime tramite `DATA_URL_PREFIXES`.

## Step loader centrale - mostri

- Il bestiario usa `ensureRuntimeData('monsters')`.
- Rimosso il loader custom con creazione manuale dello script da `compendio.js`.

## Step lazy load - equipaggiamento compendio

- Rimosso `js/Compendio/data/equipaggiamento_data.js` dal caricamento iniziale.
- Le sezioni Avventura, Strumenti, Erbe, Metalli e Gemme lo caricano tramite `ensureRuntimeData('equipment')`.
- Armi, Oggetti Magici e Veleni restano sui dati gia presenti per evitare cambiamenti laterali.

## Step preload pagina - background

- Rimosso `js/Personaggi/data/backgrounds_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- La tab Background del compendio lo carica on demand.

## Step preload pagina - razze

- Rimosso `js/Personaggi/data/races_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- La tab Razze del compendio lo carica on demand.

## Step preload pagina - talenti

- Rimosso `js/Personaggi/data/feats_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- La tab Talenti del compendio lo carica on demand.

## Step preload pagina - stili combattimento

- Rimosso `js/Personaggi/data/fighting_styles_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- La vista Stili nel compendio lo carica on demand.

## Step preload pagina - suppliche

- Rimosso `js/Personaggi/data/invocations_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- La tab Suppliche del compendio lo carica on demand.

## Step preload pagina - incantesimi sottoclassi

- Rimosso `js/Personaggi/data/subclass_spells_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- I dettagli classe del compendio lo caricano on demand.

## Step preload pagina - oggetti e veleni

- Rimossi `oggetti_magici_data.js` e `veleni_data.js` dal caricamento iniziale.
- La scheda personaggio li pre-carica per inventario/catalogo.
- Le sezioni Oggetti Magici e Veleni del compendio li caricano on demand.

## Step preload pagina - classi

- Rimosso `js/Personaggi/data/classes_data.js` dal caricamento iniziale.
- La pagina creazione/scheda personaggio lo pre-carica tramite navigation.
- La tab Classi del compendio lo carica on demand.

## Step preload pagina - incantesimi

- Rimosso `js/Personaggi/data/spells_data.js` dal caricamento iniziale.
- Scheda, creazione personaggio e laboratorio lo pre-caricano tramite navigation.
- La tab Incantesimi e i dettagli del compendio lo caricano on demand.

## Step check bootstrap

- Aggiunto `tools/check-index-bootstrap.mjs`.
- Il target `check` fallisce se `index.html` carica direttamente `js/Personaggi/data` o `js/Compendio/data`.
