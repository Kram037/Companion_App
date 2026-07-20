# Guida alla Configurazione di Google OAuth con Supabase

## 📋 Panoramica

Questa guida ti aiuterà a configurare l'autenticazione Google nella tua app Companion usando Supabase. Il codice è già pronto, devi solo configurare le credenziali.

---

## 🔧 Step 1: Creare un Progetto OAuth in Google Cloud Console

1. **Vai a Google Cloud Console**
   - Apri: https://console.cloud.google.com/
   - Accedi con il tuo account Google

2. **Crea o seleziona un progetto**
   - Se non hai un progetto, clicca su "Select a project" → "New Project"
   - Dai un nome al progetto (es: "Companion App OAuth")
   - Clicca "Create"

3. **Abilita Google+ API**
   - Nel menu laterale, vai su "APIs & Services" → "Library"
   - Cerca "Google+ API" o "Google Identity Services API"
   - Clicca "Enable" se non è già abilitata

---

## 🔑 Step 2: Configurare le Credenziali OAuth 2.0

1. **Vai alla sezione Credentials**
   - Menu laterale → "APIs & Services" → "Credentials"

2. **Crea OAuth Client ID**
   - Clicca "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Se è la prima volta, configurare l'OAuth consent screen:
     - **User Type**: Scegli "External" (o "Internal" se hai Google Workspace)
     - **App name**: "Companion App" (o il nome che preferisci)
     - **User support email**: La tua email
     - **Developer contact information**: La tua email
     - Clicca "Save and Continue"
     - **Scopes**: Lascia i default (puoi aggiungerli dopo se necessario)
     - Clicca "Save and Continue"
     - **Test users** (solo per produzione): Aggiungi gli utenti di test se necessario
     - Clicca "Back to Dashboard"

3. **Crea il Client ID**
   - **Application type**: Scegli "Web application"
   - **Name**: "Companion App Web Client" (o un nome descrittivo)
   - **Authorized JavaScript origins**: Aggiungi:
     ```
     https://tezlofuwlydbjitiymkk.supabase.co
     http://localhost:5500
     http://127.0.0.1:5500
     ```
     (Sostituisci con il tuo dominio se l'app è pubblicata)
   
   - **Authorized redirect URIs**: Aggiungi:
     ```
     https://tezlofuwlydbjitiymkk.supabase.co/auth/v1/callback
     ```
     (Questo è l'URL standard di Supabase per i callback OAuth)

4. **Ottieni le credenziali**
   - Clicca "Create"
   - Ti verranno mostrati:
     - **Client ID** (es: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
     - **Client Secret** (es: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)
   - ⚠️ **IMPORTANTE**: Salva queste credenziali in un posto sicuro! Il Client Secret verrà mostrato solo una volta.

---

## 🔐 Step 3: Configurare Supabase

1. **Vai al Dashboard di Supabase**
   - Apri: https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Vai alla sezione Authentication**
   - Menu laterale → "Authentication" → "Providers"

3. **Abilita Google Provider**
   - Trova "Google" nella lista dei provider
   - Clicca per espandere le opzioni
   - Attiva il toggle "Enable Google provider"

4. **Inserisci le credenziali**
   - **Client ID (for OAuth)**: Incolla il Client ID ottenuto da Google Cloud Console
   - **Client Secret (for OAuth)**: Incolla il Client Secret ottenuto da Google Cloud Console
   - **Redirect URL**: Verifica che sia corretto:
     ```
     https://tezlofuwlydbjitiymkk.supabase.co/auth/v1/callback
     ```
     (Supabase lo mostra già, non modificarlo)

5. **Salva le modifiche**
   - Clicca "Save"
   - ⚠️ Attendi qualche secondo per la propagazione delle modifiche

---

## ✅ Step 4: Verificare la Configurazione

1. **Testa il login**
   - Apri la tua app nel browser
   - Clicca su "Accedi con Google"
   - Dovresti essere reindirizzato alla pagina di login di Google
   - Dopo l'autorizzazione, verrai reindirizzato di nuovo all'app

2. **Verifica l'utente nel database**
   - Nel Dashboard Supabase → "Authentication" → "Users"
   - Dovresti vedere il nuovo utente creato con Google OAuth

---

## 🐛 Risoluzione Problemi Comuni

### Errore: "redirect_uri_mismatch"
**Causa**: L'URI di redirect in Google Cloud Console non corrisponde a quello di Supabase.

**Soluzione**:
- Verifica che in Google Cloud Console → Credentials → OAuth 2.0 Client IDs → Authorized redirect URIs sia presente esattamente:
  ```
  https://tezlofuwlydbjitiymkk.supabase.co/auth/v1/callback
  ```
- Assicurati che non ci siano spazi extra o caratteri mancanti
- Salva le modifiche e attendi 1-2 minuti per la propagazione

### Errore: "invalid_client"
**Causa**: Client ID o Client Secret errati in Supabase.

**Soluzione**:
- Verifica di aver copiato correttamente il Client ID e Client Secret da Google Cloud Console
- Assicurati di non aver incluso spazi o caratteri extra
- Controlla che il Client ID finisca con `.apps.googleusercontent.com`

### L'utente non viene creato nel database
**Causa**: Potrebbe essere un problema con le funzioni di trigger o RLS policies.

**Soluzione**:
- Verifica che esista una funzione trigger che crea automaticamente un record nella tabella `utenti` quando viene creato un nuovo utente in `auth.users`
- Controlla le RLS policies sulla tabella `utenti`

### Il login funziona ma l'app non riconosce l'utente
**Causa**: Potrebbe essere un problema con il callback o la gestione dello stato di autenticazione.

**Soluzione**:
- Apri la console del browser (F12) e controlla eventuali errori
- Verifica che la funzione `onAuthStateChange` in `app.js` sia configurata correttamente
- Controlla che `redirectTo` in `signInWithOAuth` sia impostato correttamente:
  ```javascript
  redirectTo: window.location.origin
  ```

---

## 🔒 Note di Sicurezza

1. **Non committare mai il Client Secret**
   - Il Client Secret è sensibile e non deve essere incluso nel codice sorgente
   - Supabase lo memorizza in modo sicuro nel dashboard

2. **Limita gli Authorized JavaScript Origins**
   - In produzione, rimuovi `localhost` dagli authorized origins
   - Aggiungi solo il dominio reale della tua app

3. **Usa HTTPS in produzione**
   - Google OAuth richiede HTTPS per gli authorized redirect URIs (tranne per localhost)

4. **Monitora l'uso**
   - Google Cloud Console ti permette di monitorare l'uso delle API
   - Imposta limiti di quota se necessario

---

## 📚 Risorse Aggiuntive

- [Documentazione Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentazione Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## ✅ Checklist Finale

- [ ] Progetto creato in Google Cloud Console
- [ ] Google+ API abilitata
- [ ] OAuth Consent Screen configurato
- [ ] OAuth 2.0 Client ID creato
- [ ] Authorized redirect URI aggiunto: `https://tezlofuwlydbjitiymkk.supabase.co/auth/v1/callback`
- [ ] Google provider abilitato in Supabase
- [ ] Client ID inserito in Supabase
- [ ] Client Secret inserito in Supabase
- [ ] Login testato con successo
- [ ] Utente creato correttamente nel database

---

**Ultimo aggiornamento**: Gennaio 2025

