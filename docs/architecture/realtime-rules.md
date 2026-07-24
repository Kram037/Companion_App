# Realtime Rules

## Canali

- Postgres changes: richieste tiro per-player, incluse quelle ricevute mentre
  una pagina diversa e' aperta.
- Broadcast `app-events`: una mutation dell'app pubblica un riferimento al dato
  persistito; i client invalidano la query e rileggono il database.
- Presence: solo quando servira' mostrare utenti online o presenza in sessione.

Il broadcast pubblico e' un hint non attendibile. `campagnaId`, `sessioneId`,
tipo di tiro e stato ricevuti non autorizzano mai una navigazione o una modal:
prima di produrre effetti UI il client verifica la riga tramite una query
Supabase soggetta a RLS.

Le scritture esterne che non pubblicano `app-events` non aggiornano subito i
client gia' aperti: questo limite va rimosso con trigger/webhook o subscription
Postgres mirate solo quando esistera' un writer esterno reale.

## Invalidazione

Ogni evento viene elaborato una volta e invalida il minimo insieme di prefissi
gerarchici necessario:

- `['campaigns']` per liste/inviti;
- `['campaigns', 'detail', campagnaId]` per dettaglio, giocatori e sessione;
- `['combat', sessioneId]` per ordine, richieste, mostri e timer.

Un evento sessione invalida sia il dettaglio campagna sia il combattimento
della sessione, per evitare cache orfane dopo la chiusura. Gli eventi che
possono cambiare membership o autorizzazioni (`campagne`, `inviti_campagna` e
`personaggi_campagna`) invalidano anche il prefisso `['combat']`: il costo del
refetch e' preferibile a lasciare visibili dati ottenuti con permessi ormai
scaduti. Gli aggiornamenti `personaggi` invalidano inoltre i prefissi
`['characters']`, `['campaigns']` e `['combat']`, perche' nome, PF e condizioni
appaiono in tutte e tre le aree; `id` legacy viene normalizzato come
`personaggioId`.

## Deduplica

Gli eventi sono deduplicati con `eventId`; per sorgenti che non lo forniscono si
usa come fallback l'ID piu' specifico disponibile. Due aggiornamenti distinti
della stessa riga non vengono quindi confusi.
