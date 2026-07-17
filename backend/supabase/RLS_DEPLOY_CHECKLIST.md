# Supabase RLS deploy checklist

Questa checklist e' obbligatoria per ogni modifica a policy RLS o funzione
`SECURITY DEFINER`. Gli script nel repository non risultano applicati al
database finche' i controlli seguenti non sono completati in staging e poi in
produzione.

## Inventario verificato

| Area | Funzioni | Vincolo |
| --- | --- | --- |
| Identita e amici | `get_current_user_id`, `get_richieste_in_entrata`, `get_richieste_in_uscita`, `get_amici`, `search_user_by_name_and_cid`, `get_uids_by_user_ids` | Identita derivata da `auth.uid()`; UID esposti solo a se stessi o amici accettati |
| Campagne | `get_dm_campagna`, `get_dms_campagne`, `check_dm_campagna`, `get_giocatori_campagna`, `update_dm_campagna` | Accesso del membro; cambio DM consentito solo al DM corrente |
| Sessioni e inviti | `get_tiri_iniziativa`, `get_inviti_ricevuti`, `invia_invito_campagna`, `accetta_invito_campagna`, `rifiuta_invito_campagna`, `rimuovi_giocatore_campagna` | Sessione/campagna accessibile; mittente e destinatario legati al chiamante |
| Personaggi | `get_personaggi_utente`, `get_personaggio_campagna`, `get_personaggi_in_campagna` | Proprietario oppure DM/membro della campagna |
| Homebrew | `can_read_homebrew` | Proprietario, amico accettato, membro della campagna indicata o contenuto pubblico |

Tutte le funzioni hanno `SET search_path = public`, revocano `EXECUTE` a
`PUBLIC` e concedono l'esecuzione solo ad `authenticated`.

## Prima del deploy

- [ ] Eseguire `npm.cmd run check`, `npm.cmd run test` e `npm.cmd run build`.
- [ ] Provare prima su un progetto Supabase di staging con schema aggiornato.
- [ ] Salvare schema, policy e definizioni delle funzioni correnti.
- [ ] Preparare tre account: DM, giocatore membro e utente esterno.
- [ ] Annotare una campagna, una sessione e un personaggio di test.

## Ordine SQL

- [ ] `backend/supabase/sql/deploy-all-functions.sql`
- [ ] `backend/supabase/sql/update-dm-campagna.sql`
- [ ] `backend/supabase/sql/add-get-amici-with-uid.sql`
- [ ] `backend/supabase/sql/add-personaggi-esperienza.sql`
- [ ] `backend/supabase/sql/add-combat-timers.sql`
- [ ] `backend/supabase/sql/harden-homebrew-rls.sql`

Eseguire ogni file in una transazione e interrompere il deploy al primo errore.
`relax-homebrew-rls.sql` e' solo un fallback owner-only e non sostituisce
`harden-homebrew-rls.sql`.

## Test negativi

- [ ] Un anonimo non puo' eseguire nessuna RPC `SECURITY DEFINER`.
- [ ] Un giocatore o un esterno non puo' cambiare il DM della campagna.
- [ ] Un chiamante non puo' inviare un invito usando l'ID di un altro DM.
- [ ] Un esterno non puo' leggere personaggi o timer di un'altra campagna.
- [ ] Un giocatore non puo' creare timer globali o per mostri.
- [ ] Un utente non puo' risolvere UID di persone che non sono amici accettati.
- [ ] Homebrew `private` e' visibile solo al proprietario.
- [ ] Homebrew `friends`, `campaign` e `public` rispettano il relativo scope.

## Test positivi

- [ ] Il DM puo' invitare, trasferire la campagna e gestire tutti i timer.
- [ ] Il giocatore puo' leggere la campagna e gestire il timer del proprio PG.
- [ ] Le RPC personaggi restituiscono gli stessi dati previsti dalla UI.
- [ ] I contenuti homebrew propri e degli amici selezionati continuano a caricarsi.
- [ ] Realtime sessione e combattimento continua a ricevere gli aggiornamenti.

## Verifica database

Controllare che non esistano policy attive con `qual` o `with_check` uguale a
`true` e che `anon`/`PUBLIC` non abbiano `EXECUTE` sulle funzioni inventariate.
In caso di errore, fare rollback della transazione; non allargare temporaneamente
le policy per sbloccare il client.
