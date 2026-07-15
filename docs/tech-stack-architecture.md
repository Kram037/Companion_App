# Tech Stack Architecture

## Runtime

- Legacy app: `index.html`, `js/`, `css/`, `images/`, `risorse/`.
- New typed layer: `src/`.
- Vite usa `index.html` root-based: un `index.vite.html` separato aggiungerebbe drift senza beneficio.
- Runtime locale: `npm run serve`, servito da Vite sulla porta `8000`.
- Build e deploy usano lo stesso output: `dist/apps/companion-app`.
- Il markup e gli asset legacy restano inclusi da Vite finche' la relativa pagina non viene migrata.

## Confini

- `src/api`: unico punto per Supabase nei nuovi moduli.
- `src/schemas`: validazione runtime Zod.
- `src/query`: TanStack Query, query keys e cache actions.
- `src/realtime`: eventi realtime convertiti in azioni cache/notifica.
- `src/store`: Zustand solo per UI state locale.
- `src/router`: route e bridge legacy.
- `src/features`: nuove pagine/componenti React.

## Regola legacy

Le pagine principali sono renderizzate da React. `LegacyPageAdapter` resta solo per il wizard di creazione personaggio; `navigateToPage` mantiene sincronizzati i dialog e gli editor non ancora migrati.

## Guardie

- `tools/check-data-boundary.mjs`: controlla i data bundle runtime.
- `tools/check-index-bootstrap.mjs`: impedisce il ritorno dei data bundle pesanti nel bootstrap iniziale.
- `tools/check-react-boundaries.mjs`: blocca `innerHTML` e Supabase diretto nei nuovi componenti React.

## Test

- `npm run check`: typecheck + guardie legacy/React.
- `npm run test`: Vitest su logica typed.
- `npm run e2e -- --list`: verifica discovery Playwright sulla build production.
- `npm run e2e`: genera la build, avvia il preview e chiude il server al termine; richiede browser installati con `npm run e2e:install`.
- GitHub Pages esegue check, unit test e Playwright prima del deploy.
