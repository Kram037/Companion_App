# Guida alla Migrazione da Firebase a Supabase

Questa guida ti aiuterà a completare la migrazione da Firebase a Supabase per la Companion App.

## 📋 Prerequisiti

1. Account Supabase (gratuito): https://supabase.com/
2. Progetto Supabase creato

## 🔧 Setup Iniziale

### 1. Crea un Progetto Supabase

1. Vai su https://supabase.com/
2. Clicca su "New Project"
3. Compila i dettagli del progetto
4. Attendi che il progetto sia pronto (circa 2 minuti)

### 2. Configura le Credenziali

1. Nel tuo progetto Supabase, vai su **Settings** > **API**
2. Copia:
   - **Project URL** (es: `https://xxxxx.supabase.co`)
   - **anon public key** (chiave pubblica anonima)

3. Apri `supabase-config.js` e sostituisci:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // Incolla il Project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Incolla l'anon key
   ```

### 3. Crea il Database Schema

1. Nel tuo progetto Supabase, vai su **SQL Editor**
2. Apri il file `supabase-schema.sql`
3. Copia tutto il contenuto e incollalo nell'SQL Editor
4. Clicca su **Run** per eseguire lo script

Questo creerà:
- Tabella `utenti` (con CID univoco)
- Tabella `campagne` (con relazioni)
- Tabelle `personaggi` e `mostri` (per future implementazioni)
- Indici per performance
- Funzioni SQL (generate_unique_cid, update_updated_at_column)
- Row Level Security (RLS) policies

### 4. Configura Google OAuth (Opzionale)

Per abilitare il login con Google:

1. Vai su **Authentication** > **Providers** nel dashboard Supabase
2. Abilita **Google**
3. Configura:
   - **Client ID** (da Google Cloud Console)
   - **Client Secret** (da Google Cloud Console)
4. Aggiungi l'URL di redirect: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

**Nota**: Per ottenere Client ID e Secret:
- Vai su https://console.cloud.google.com/
- Crea un progetto o seleziona uno esistente
- Vai su **APIs & Services** > **Credentials**
- Crea **OAuth 2.0 Client ID**
- Aggiungi authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

## 🔄 Differenze Principali tra Firebase e Supabase

### Autenticazione

**Firebase:**
```javascript
firebase.auth().signInWithEmailAndPassword(email, password)
```

**Supabase:**
```javascript
supabase.auth.signInWithPassword({ email, password })
```

### Database

**Firebase (Firestore - NoSQL):**
```javascript
firestore.collection('Campagne').doc(id).get()
```

**Supabase (PostgreSQL - Relazionale):**
```javascript
supabase.from('campagne').select('*').eq('id', id).single()
```

### Real-time

**Firebase:**
```javascript
collection.onSnapshot(callback)
```

**Supabase:**
```javascript
supabase.channel('campagne-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'campagne' }, callback)
  .subscribe()
```

## 📊 Struttura Database

### Tabella `utenti`
- `id` (UUID, Primary Key)
- `uid` (TEXT, Unique) - UUID di Supabase Auth
- `cid` (INTEGER, Unique) - Codice identificativo 4 cifre
- `nome_utente` (TEXT)
- `email` (TEXT, Unique)
- `tema_scuro` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Tabella `campagne`
- `id` (UUID, Primary Key)
- `nome_campagna` (TEXT)
- `user_id` (UUID, Foreign Key → utenti.id)
- `icona_type` (TEXT) - 'predefined' o 'image'
- `icona_name` (TEXT) - nome icona predefinita
- `icona_data` (TEXT) - data URL per immagini
- `nome_dm`, `numero_giocatori`, `numero_sessioni`, `tempo_di_gioco`
- `note` (TEXT[]) - array di note
- `data_creazione`, `updated_at` (TIMESTAMP)

## 🔒 Sicurezza (Row Level Security)

Le RLS policies sono già configurate nello schema SQL:
- Gli utenti possono vedere/modificare solo i propri dati
- Le campagne sono accessibili solo al proprietario
- Tutte le operazioni richiedono autenticazione

## 🚀 Deploy

1. Assicurati che tutti i file siano aggiornati:
   - ✅ `index.html` (usa Supabase SDK)
   - ✅ `supabase-config.js` (con credenziali corrette)
   - ✅ `app.js` (migrato a Supabase)
   - ✅ Database schema creato

2. Testa l'applicazione:
   - Registrazione nuovo utente
   - Login
   - Creazione campagna
   - Modifica/Eliminazione campagna
   - Cambio tema

## ⚠️ Note Importanti

1. **Migrazione Dati**: Se hai dati esistenti in Firebase, dovrai crearli manualmente in Supabase o scrivere uno script di migrazione.

2. **Google OAuth**: Richiede configurazione aggiuntiva rispetto a Firebase.

3. **Real-time**: Supabase usa canali WebSocket invece di listener Firestore. La logica è leggermente diversa ma più efficiente.

4. **Query**: Supabase usa SQL, quindi le query sono più potenti e flessibili rispetto a Firestore.

## 🐛 Troubleshooting

### Errore: "Supabase non disponibile"
- Verifica che lo script Supabase SDK sia caricato prima di `supabase-config.js`
- Controlla la console del browser per errori

### Errore: "Permission denied"
- Verifica che le RLS policies siano attive
- Controlla che l'utente sia autenticato correttamente

### Errore: "Function generate_unique_cid does not exist"
- Assicurati di aver eseguito tutto lo script SQL incluso in `supabase-schema.sql`

## 📚 Risorse

- [Documentazione Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

