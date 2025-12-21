# Migrazione a ID VARCHAR(10)

## Overview

Il database è stato completamente ripulito e ricreato con le seguenti modifiche:

1. **ID alfanumerici di 10 caratteri** invece di UUID lunghi
2. **Campo `giocatori` array** nella tabella `campagne` per gestire i giocatori
3. **Trigger automatici** per sincronizzare l'array `giocatori` con `inviti_campagna`

## Tabelle Mantenute

- ✅ `utenti`
- ✅ `campagne`
- ✅ `richieste_amicizia`
- ✅ `inviti_campagna`

## Tabelle Rimosse

- ❌ `personaggi`
- ❌ `mostri`

## Modifiche Principali

### Struttura ID

Gli ID sono ora `VARCHAR(10)` alfanumerici generati dalla funzione `generate_unique_id()`.

Formato: stringa casuale di 10 caratteri (A-Z, a-z, 0-9)
Esempio: `aB3xY9mK2p`

### Campo `giocatori` in `campagne`

La tabella `campagne` ha un nuovo campo:
```sql
giocatori VARCHAR(10)[] DEFAULT '{}'
```

Questo array contiene gli ID degli utenti che hanno accettato l'invito alla campagna.

### Trigger di Sincronizzazione

Un trigger `sync_giocatori_on_invito_change` si attiva quando:
- Un invito viene accettato → aggiunge l'ID all'array `giocatori`
- Un invito viene rifiutato/eliminato → rimuove l'ID dall'array `giocatori`

Il campo `numero_giocatori` viene automaticamente aggiornato come `array_length(giocatori, 1)`.

## Come Eseguire la Migrazione

1. **ESEGUI LO SCRIPT IN SUPABASE SQL EDITOR**:
   - Apri Supabase Dashboard
   - Vai a SQL Editor
   - Copia e incolla il contenuto di `sql/clean-and-recreate-schema.sql`
   - **ATTENZIONE**: Questo cancellerà TUTTE le tabelle e i dati esistenti!
   - Esegui lo script

2. **VERIFICA**:
   - Controlla che tutte le tabelle siano state create
   - Verifica che i trigger siano attivi
   - Testa che la generazione ID funzioni

3. **TEST**:
   - Crea un nuovo utente (registrazione)
   - Crea una campagna
   - Invita un amico
   - Accetta l'invito
   - Verifica che `giocatori` array contenga l'ID dell'utente

## Compatibilità Codice JavaScript

Il codice JavaScript **NON richiede modifiche** perché:
- Gli ID vengono sempre trattati come stringhe
- Le query Supabase funzionano con qualsiasi tipo di ID
- Non ci sono validazioni UUID hardcoded nel codice

## Vantaggi del Nuovo Approccio

1. **ID più leggibili**: `aB3xY9mK2p` invece di `550e8400-e29b-41d4-a716-446655440000`
2. **Query più veloci**: l'array `giocatori` evita JOIN complessi
3. **Sincronizzazione automatica**: i trigger mantengono i dati allineati
4. **Database più pulito**: solo le tabelle necessarie

## Note Importanti

- ⚠️ **PERDI TUTTI I DATI ESISTENTI**: Lo script cancella tutto!
- 🔄 **Backup consigliato**: Fai un backup se hai dati importanti
- ✅ **Test in locale prima**: Prova in un ambiente di sviluppo prima della produzione

