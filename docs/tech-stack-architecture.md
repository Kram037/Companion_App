# Tech Stack Architecture

## Runtime

- Legacy app: `index.html`, `js/`, `css/`, `images/`, `risorse/`.
- New typed layer: `src/`.
- Vite usa `index.html` root-based: un `index.vite.html` separato aggiungerebbe drift senza beneficio.
- Runtime locale: `npm run serve`, servito da Vite sulla porta `8000`.
- Build e deploy usano lo stesso output: `dist/apps/companion-app`.
- Vite usa base `/` in locale e il prefisso del repository durante il deploy GitHub Pages, cosi' anche le route profonde caricano gli asset corretti.
- Il markup e gli asset legacy restano inclusi da Vite finche' la relativa pagina non viene migrata.
- Le route React sono caricate con `React.lazy`: il bootstrap iniziale non include il codice delle pagine non visitate.

## Confini

- `src/api`: unico punto per Supabase nei nuovi moduli.
- `src/schemas`: validazione runtime Zod.
- `src/query`: TanStack Query, query keys e cache actions.
- `src/realtime`: eventi realtime convertiti in azioni cache/notifica.
- `src/store`: Zustand solo per UI state locale.
- `src/router`: route e bridge legacy.
- `src/features`: nuove pagine/componenti React.

## Regola legacy

Tutte le route sono renderizzate da React. `navigateToPage` mantiene sincronizzati i dialog e gli editor ancora condivisi con il runtime storico; il form del wizard personaggio viene montato nel contenitore React senza duplicarne lo stato. I globali rimasti sono API di compatibilita' intenzionali, non renderer di pagina.

## Guardie

- `tools/check-data-boundary.mjs`: controlla i data bundle runtime.
- `tools/check-index-bootstrap.mjs`: impedisce il ritorno dei data bundle pesanti nel bootstrap iniziale.
- `tools/check-react-boundaries.mjs`: blocca `innerHTML` e Supabase diretto nei nuovi componenti React.
- `tools/check-legacy-symbols.mjs`: blocca funzioni e API globali legacy senza chiamanti.

## Test

- `npm run check`: typecheck + guardie legacy/React.
- `npm run test`: Vitest su logica typed.
- `npm run e2e -- --list`: verifica discovery Playwright sulla build production.
- `npm run e2e`: genera la build, avvia il preview e chiude il server al termine; richiede browser installati con `npm run e2e:install`.
- GitHub Pages esegue check, unit test e Playwright prima del deploy.

### Fixture E2E autenticata

I test pubblici non richiedono credenziali. `tests/e2e/authenticated.spec.ts` abilita i flussi Supabase quando sono presenti:

- `E2E_DM_EMAIL`, `E2E_DM_PASSWORD`;
- `E2E_PLAYER_EMAIL`, `E2E_PLAYER_PASSWORD`;
- `E2E_CAMPAIGN_ID`, `E2E_SESSION_ID`, `E2E_CHARACTER_ID`;
- `E2E_EMPTY_CAMPAIGN_ID`, riferita a una seconda campagna del DM senza sessioni attive.

La campagna principale deve contenere entrambi gli account, un personaggio del player e una sessione attiva. Il test realtime crea richieste di iniziativa e avanza il turno; il test sessione usa la campagna vuota e termina la sessione che crea. Entrambi vanno eseguiti solo su fixture dedicate impostando `E2E_MUTATION_TESTS=1`. Gli stessi nomi sono gia' collegati ai GitHub Actions secrets; in loro assenza i test autenticati vengono saltati.
