# Tech Stack Architecture

## Runtime

- Legacy app: `index.html`, `js/`, `css/`, `images/`, `risorse/`.
- New typed layer: `src/`.
- Vite usa `index.html` root-based: un `index.vite.html` separato aggiungerebbe drift senza beneficio.
- Build principale: `npm run build`, che produce:
  - `dist/apps/companion-app` per runtime statico legacy;
  - `dist/vite/companion-app` per runtime Vite compatibile.

## Confini

- `src/api`: unico punto per Supabase nei nuovi moduli.
- `src/schemas`: validazione runtime Zod.
- `src/query`: TanStack Query, query keys e cache actions.
- `src/realtime`: eventi realtime convertiti in azioni cache/notifica.
- `src/store`: Zustand solo per UI state locale.
- `src/router`: route e bridge legacy.
- `src/features`: nuove pagine/componenti React.

## Regola legacy

Le pagine esistenti restano operative tramite `LegacyPageAdapter`. Le URL React chiamano ancora `navigateToPage` finche' la singola pagina non viene migrata a componenti React reali.

## Guardie

- `tools/check-data-boundary.mjs`: controlla i data bundle runtime.
- `tools/check-index-bootstrap.mjs`: impedisce il ritorno dei data bundle pesanti nel bootstrap iniziale.
- `tools/check-react-boundaries.mjs`: blocca `innerHTML` e Supabase diretto nei nuovi componenti React.

## Test

- `npm run check`: typecheck + guardie legacy/React.
- `npm run test`: Vitest su logica typed.
- `npm run e2e -- --list`: verifica discovery Playwright.
- `npm run e2e`: richiede browser installati con `npm run e2e:install`.
