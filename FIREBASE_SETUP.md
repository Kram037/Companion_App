# Setup Firebase Authentication

## Passi per configurare Firebase Auth

### 1. Crea un progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca su "Aggiungi progetto" o seleziona un progetto esistente
3. Segui la procedura guidata per creare il progetto

### 2. Abilita Authentication

1. Nel menu laterale, vai su **Authentication**
2. Clicca su **Get Started**
3. Vai alla tab **Sign-in method**
4. Abilita **Email/Password**:
   - Clicca su "Email/Password"
   - Attiva "Enable"
   - Salva

### 3. Aggiungi una Web App

1. Vai su **Project Settings** (icona ingranaggio in alto a sinistra)
2. Scorri fino a **Your apps**
3. Clicca sull'icona **Web** (`</>`)
4. Inserisci un nome per l'app (es. "Companion App")
5. **NON** selezionare "Also set up Firebase Hosting" (per ora)
6. Clicca su **Register app**

### 4. Copia le credenziali

Dopo aver registrato l'app, vedrai un oggetto di configurazione simile a questo:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 5. Configura il file firebase-config.js

1. Apri il file `firebase-config.js` nella root del progetto
2. Sostituisci i valori placeholder con le tue credenziali Firebase:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",  // <-- Inserisci qui
    authDomain: "your-project.firebaseapp.com",  // <-- Inserisci qui
    projectId: "your-project-id",  // <-- Inserisci qui
    storageBucket: "your-project.appspot.com",  // <-- Inserisci qui
    messagingSenderId: "123456789",  // <-- Inserisci qui
    appId: "1:123456789:web:abcdef"  // <-- Inserisci qui
};
```

### 6. Testa l'autenticazione

1. Apri `index.html` nel browser
2. Clicca sull'icona utente
3. Clicca su "Registrati" per creare un nuovo account
4. Oppure usa "Accedi" se hai già un account

## Funzionalità implementate

✅ Login con email/password  
✅ Registrazione nuovi utenti  
✅ Logout  
✅ Persistenza sessione (l'utente rimane loggato anche dopo il refresh)  
✅ Gestione errori con messaggi chiari  
✅ UI responsive per login/registrazione

## Note di sicurezza

⚠️ **IMPORTANTE**: Il file `firebase-config.js` contiene le tue credenziali API. 
- Non committare questo file su repository pubblici
- Aggiungi `firebase-config.js` al `.gitignore` se contiene credenziali reali
- Per progetti pubblici, usa Firebase App Check per proteggere le API keys

## Prossimi passi

Dopo aver configurato l'autenticazione, puoi:
- Integrare Firestore per salvare dati utente
- Aggiungere autenticazione social (Google, Facebook, ecc.)
- Implementare reset password
- Aggiungere verifica email

