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
| Sessioni e inviti | `get_tiri_iniziativa`, `get_inviti_ricevuti`, `invia_invito_campagna`, `accetta_invito_campagna`, `rifiuta_invito_campagna`, `rimuovi_giocatore_campagna`, `start_campaign_session`, `finish_campaign_session`, `request_initiative_rolls`, `request_generic_rolls`, `submit_initiative_roll`, `submit_generic_roll` | Sessione/campagna accessibile; mutazioni DM atomiche; il player completa soltanto una propria richiesta pending |
| Combattimento | `advance_combat_turn`, `finish_combat`, `get_combat_monsters_safe` | Turno atomico; statistiche mostri restituite solo al DM |
| Personaggi | `get_personaggi_utente`, `select_personaggio_campagna`, `get_personaggio_campagna`, `get_personaggi_in_campagna`, `update_campaign_character_conditions` | Associazione selezionabile solo dal proprietario; lettura riservata ai membri; il DM aggiorna solo stato/condizioni tramite RPC |
| Homebrew | `can_read_homebrew` | Proprietario, amico accettato, membro della campagna indicata o contenuto pubblico |

Tutte le funzioni hanno `SET search_path = public`, revocano `EXECUTE` a
`PUBLIC` e concedono l'esecuzione solo ad `authenticated`.

## Prima del deploy

- [ ] Eseguire `npm.cmd run check`, `npm.cmd run test` e `npm.cmd run build`.
- [ ] Provare prima su un progetto Supabase di staging con schema aggiornato.
- [ ] Salvare schema, policy e definizioni delle funzioni correnti.
- [ ] Verificare che l'eventuale `get_current_user_id()` esistente restituisca `character varying`; lo script interrompe il deploy prima delle modifiche se trova la vecchia firma UUID.
- [ ] Preparare tre account: DM, giocatore membro e utente esterno.
- [ ] Annotare una campagna, una sessione e un personaggio di test.

## Ordine SQL

- [ ] `backend/supabase/sql/add-tiro-naturale.sql`
- [ ] `backend/supabase/sql/deploy-all-functions.sql`
- [ ] `backend/supabase/sql/update-dm-campagna.sql`
- [ ] `backend/supabase/sql/add-get-amici-with-uid.sql`
- [ ] `backend/supabase/sql/add-personaggi-esperienza.sql`
- [ ] `backend/supabase/sql/harden-personaggi-campagna.sql`
- [ ] `backend/supabase/sql/add-mostri-combattimento.sql`
- [ ] `backend/supabase/sql/add-combat-timers.sql`
- [ ] `backend/supabase/sql/harden-homebrew-rls.sql`
- [ ] `backend/supabase/sql/atomic-campaign-runtime.sql`
- [ ] `backend/supabase/sql/enable-realtime.sql`

Eseguire ogni file in una transazione e interrompere il deploy al primo errore.
`relax-homebrew-rls.sql` e' solo un fallback owner-only e non sostituisce
`harden-homebrew-rls.sql`.

## Test negativi

- [ ] Un anonimo non puo' eseguire nessuna RPC `SECURITY DEFINER`.
- [ ] Un giocatore o un esterno non puo' cambiare il DM della campagna.
- [ ] Un chiamante non puo' inviare un invito usando l'ID di un altro DM.
- [ ] Un invito creato da un precedente DM non puo' essere accettato dopo il trasferimento.
- [ ] Il DML diretto su `inviti_campagna` e' negato anche agli utenti autenticati.
- [ ] Il trasferimento DM fallisce finche' la campagna ha una sessione attiva.
- [ ] Un esterno non puo' leggere personaggi o timer di un'altra campagna.
- [ ] Un utente non puo' associare alla campagna il personaggio di un altro utente.
- [ ] Il client non puo' inserire, aggiornare o eliminare direttamente `personaggi_campagna`.
- [ ] Il DM non puo' aggiornare nome, statistiche, inventario o altri campi della scheda altrui; la RPC accetta soltanto condizioni ed esaustione.
- [ ] Un giocatore non puo' creare timer globali o per mostri.
- [ ] Un giocatore non puo' leggere timer per mostri o statistiche private dei mostri.
- [ ] Nessun timer puo' essere creato o modificato dopo la chiusura della sessione.
- [ ] Un DM non puo' associare un mostro a una sessione di un'altra campagna.
- [ ] La lettura sicura dei mostri scarta righe con `campagna_id` diverso da quello della sessione.
- [ ] Un giocatore non puo' avviare/terminare sessioni, avanzare turni o richiedere tiri.
- [ ] Un giocatore non puo' aggiornare direttamente una richiesta tiro, completare quella di un altro player o completarla due volte.
- [ ] Una sessione non puo' avere due gruppi di richieste tiro generiche contemporanei.
- [ ] La rimozione di un giocatore elimina associazione, tiri e timer PG della sessione attiva.
- [ ] Un utente non puo' risolvere UID di persone che non sono amici accettati.
- [ ] Homebrew `private` e' visibile solo al proprietario.
- [ ] Homebrew `friends`, `campaign` e `public` rispettano il relativo scope.

## Test positivi

- [ ] Il DM puo' invitare, trasferire una campagna senza sessione attiva e gestire tutti i timer.
- [ ] Due richieste concorrenti di avvio creano una sola sessione aperta.
- [ ] Il player vede ordine mostri e timer globali/propri senza dati riservati.
- [ ] Il giocatore puo' leggere la campagna e gestire il timer del proprio PG.
- [ ] Il giocatore puo' selezionare un proprio personaggio e completare una propria richiesta pending tramite RPC.
- [ ] Le RPC personaggi restituiscono gli stessi dati previsti dalla UI.
- [ ] I contenuti homebrew propri e degli amici selezionati continuano a caricarsi.
- [ ] Realtime sessione e combattimento continua a ricevere gli aggiornamenti.

## Verifica database

Controllare che non esistano policy attive con `qual` o `with_check` uguale a
`true` e che `anon`/`PUBLIC` non abbiano `EXECUTE` sulle funzioni inventariate.
Verificare inoltre che il trigger legacy `sync_giocatori_on_invito_change` non
esista e che `authenticated` non abbia privilegi DML diretti su
`inviti_campagna` o `personaggi_campagna`.
In caso di errore, fare rollback della transazione; non allargare temporaneamente
le policy per sbloccare il client.

Gli script in `backend/supabase/sql/archive` sono storici: non rieseguirli dopo
l'hardening, perche' possono ripristinare definizioni o policy obsolete.
