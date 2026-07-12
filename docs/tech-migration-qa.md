# Tech Migration QA Baseline

Questa checklist protegge i flussi legacy mentre React, Query, Router e store vengono introdotti in modo progressivo.

## Branch

- `develop`: integrazione stabile.
- `tech_migration`: integrazione stack React/TypeScript.
- Feature branch: una fase tecnica piccola quando serve isolare rischio.

## Flussi critici

### Login e ripristino sessione

- Aprire app da sessione pulita.
- Fare login.
- Ricaricare pagina.
- Verificare utente, toolbar/sidebar, pagina corrente e sessione corrente.

### Lista campagne

- Aprire `Campagne`.
- Cercare una campagna.
- Applicare filtri.
- Attivare/disattivare preferito.
- Ricaricare e verificare che lista e filtri non rompano il render.

### Dettaglio campagna

- Aprire una campagna da lista.
- Invitare o gestire giocatori.
- Tornare alla lista.
- Riaprire la stessa campagna.

### Sessione attiva

- Entrare in una sessione.
- Aprire sessione in due browser.
- Modificare stato sessione da un browser.
- Verificare aggiornamento realtime nell'altro senza chiudere modal o tendine aperte.

### Combattimento

- Avviare combattimento.
- Aggiungere mostri.
- Modificare PF/condizioni.
- Cambiare turno/round.
- Verificare realtime con due browser.

### Scheda personaggio

- Aprire una scheda.
- Cambiare tab interna.
- Aprire inventario/incantesimi/privilegi.
- Modificare PF, PE e risorse.
- Verificare che refetch/realtime non chiudano input o dialog aperte.

### Laboratorio

- Aprire hub Laboratorio.
- Entrare in una sezione homebrew.
- Cercare, filtrare, creare, importare.
- Tornare all'hub.

### Compendio

- Aprire hub Compendio.
- Entrare in una sezione.
- Usare ricerca, filtri, dettagli e link statblock/incantesimo.
- Verificare scroll e ritorno alla lista.

## Regressioni UX note

- Aprire una tendina mentre arriva un update realtime: la tendina resta aperta.
- Modificare un campo mentre arriva un refetch: il campo non viene resettato.
- Aprire un modal mentre arriva un refetch: il modal resta aperto.
- Usare sessione/combattimento con due browser: un update non causa doppio render o ritorno alla home.
- Aggiornare PWA dopo deploy: service worker carica la versione nuova senza loop di reload durante uso attivo.
