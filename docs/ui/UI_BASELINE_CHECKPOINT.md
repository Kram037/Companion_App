# UI Baseline Checkpoint

Data: 2026-07-30

Baseline di codice: branch `react_migration`, commit `02b2cf5`.

Questo commit e' il riferimento visivo e comportamentale approvato. La scheda
roadmap 03 produrra' gli screenshot Playwright a partire da questo stato; non
puo' ridefinirne il design.

## Regola di non regressione

La migrazione puo' sostituire soltanto l'implementazione. Deve conservare:

- struttura DOM, classi CSS e attributi usati dai flussi esistenti;
- layout, dimensioni, spaziature, tipografia, colori, icone e ordine;
- header, toolbar, sidebar, split view, modali e responsive;
- focus, tastiera, scroll, loading, errori, stati vuoti e permessi;
- deep link, back/forward, refresh, PWA e comportamento realtime.

Un cambiamento intenzionale dell'aspetto richiede una richiesta separata ed
esplicita. Non e' ammesso come effetto collaterale della migrazione React.

## Viewport di riferimento

| Scenario | Viewport |
| --- | --- |
| Mobile | `390x844` |
| Tablet / breakpoint intermedio | `768x1024` |
| Desktop | `1440x900` |
| Desktop basso | `1440x520` |
| Desktop largo / split view | `1920x1000` |

Il gate automatizzato corrente usa Chromium (`Desktop Chrome` in Playwright).
WebKit e Firefox non sono dichiarati supportati dal gate finche' non vengono
aggiunti esplicitamente alla CI. La viewport mobile non implica un secondo
motore browser.

## Matrice minima degli stati

Ogni slice deve verificare, quando applicabile:

- anonimo, utente esterno, player e DM;
- normale, loading, vuoto, errore e dato non trovato;
- modale aperta, focus iniziale/di ritorno, Escape e overlay;
- navigazione diretta, refresh, back/forward e scroll conservato;
- update realtime mentre sono aperti input, tendine o dialog;
- mobile, desktop e split view.

## Budget iniziale

Build Vite del commit baseline:

| Output | Raw | Gzip |
| --- | ---: | ---: |
| CSS iniziale | 309.50 kB | 51.33 kB |
| Entry JS | 207.37 kB | 53.66 kB |
| App React | 377.41 kB | 108.63 kB |
| Router | 51.63 kB | 18.09 kB |
| Realtime | 27.04 kB | 8.17 kB |

Regole:

- nessun dataset D&D pesante nel bootstrap iniziale;
- nessun doppio fetch o listener duplicato introdotto da una slice;
- ogni aumento oltre il 10% dell'output interessato richiede misura,
  motivazione e approvazione;
- memoizzazione e virtualizzazione si aggiungono solo dopo una misura.

## Definition of Done di una slice

- markup e classi coincidono con il renderer approvato;
- esiste un solo owner visibile, React oppure legacy;
- test mirati, E2E e confronto visivo della slice sono verdi;
- gli E2E obbligatori di rilascio non sono saltati;
- `npm run check`, `npm test` e `npm run build` sono verdi;
- eventuali differenze intenzionali sono richieste e documentate separatamente.
