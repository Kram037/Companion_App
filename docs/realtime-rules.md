# Realtime Rules

## Canali

- Postgres changes: dati persistenti che devono invalidare o patchare cache.
- Broadcast: eventi transitori, notifiche e comandi UI non persistenti.
- Presence: solo quando servira' mostrare utenti online o presenza in sessione.

## Azioni ammesse

Ogni evento realtime deve diventare una sola azione:

- `invalidate`: invalida una query mirata.
- `patch`: aggiorna cache con `setQueryData`.
- `notify`: passa un messaggio a un handler UI iniettato.
- `none`: ignora evento duplicato o originato dallo stesso client.

## Deduplica

Gli eventi sono deduplicati con chiave `table:action:id` e finestra breve. Se una mutation produce sia `postgres_changes` sia `broadcast`, il secondo evento con la stessa chiave viene ignorato.
