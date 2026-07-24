# Tech Migration QA Baseline

Questa checklist protegge i flussi legacy mentre React, Query, Router e store vengono introdotti in modo progressivo.

## Branch

- `develop`: integrazione stabile.
- `react_migration`: branch corrente per la migrazione del dominio Campagna.
- `tech_migration` e `tech_migration_2`: fasi storiche della migrazione stack.
- Feature branch: una fase tecnica piccola quando serve isolare rischio.

## Prerequisito database

Prima di validare o distribuire dettaglio campagna, sessione e combattimento:

- applicare nell'ordine della
  [`../../backend/supabase/RLS_DEPLOY_CHECKLIST.md`](../../backend/supabase/RLS_DEPLOY_CHECKLIST.md)
  `deploy-all-functions.sql`, `harden-personaggi-campagna.sql` e
  `atomic-campaign-runtime.sql` con i relativi prerequisiti;
- se un preflight segnala associazioni personaggio-proprietario incoerenti o
  sessioni aperte duplicate, risolverle manualmente e rieseguire lo script;
- verificare con account fixture separati i permessi di DM, giocatore e utente
  esterno.

Questa e' una checklist da eseguire: la presenza dei casi nel documento non
certifica che build, E2E o migrazione database siano gia passati.

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
- Avviare la stessa campagna da due tab e verificare che resti una sola sessione aperta.
- Aprire sessione in due browser.
- Come DM, richiedere iniziativa e un tiro generico; verificare label, tipo e target lato player.
- Completare un tiro con totale `0` e uno negativo (d20 piu' modificatore) e verificare che siano accettati.
- Provare a richiedere un secondo tiro generico prima di chiudere il primo gruppo e verificare che sia rifiutato.
- Verificare che il player possa completare una propria richiesta pending una sola volta e non possa aggiornare direttamente la tabella.
- Rimuovere un player durante la sessione e verificare che associazione e tiri scompaiano dal combattimento.
- Verificare che un giocatore non possa avviare o terminare la sessione.
- Come DM, modificare condizioni/esaustione di un PG e verificare che non sia possibile cambiare altri campi della sua scheda.
- Terminare la sessione e verificare la pulizia dei dati di combattimento.
- Verificare che dopo la chiusura non sia possibile creare o modificare timer.
- Verificare aggiornamento realtime nell'altro senza chiudere modal o tendine aperte.

### Combattimento

- Avviare combattimento.
- Aggiungere mostri.
- Modificare PF/condizioni.
- Cambiare turno/round.
- Tentare un avanzamento concorrente da due tab e verificare un solo cambio turno.
- Verificare che il player veda ordine/nome e timer globali/propri, ma non statistiche o timer dei mostri.
- Terminare il combattimento, usare indietro o un deep link alla vecchia route e verificare il ritorno alla sessione.
- Verificare realtime con due browser.

### Trasferimento campagna

- Con una sessione attiva, tentare il cambio DM e verificare che venga rifiutato.
- Dopo la chiusura della sessione, trasferire la campagna e verificare inviti,
  ruoli e cache in entrambi i browser.
- Verificare che gli inviti pending del precedente DM non siano visibili o
  accettabili.

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
- Rimuovere un player o fare logout con dettaglio/combattimento aperto: i dati precedenti non restano visibili dalla cache.
- Aggiornare PWA dopo deploy: service worker carica la versione nuova senza loop di reload durante uso attivo.
