# Setup Firebase

## 1. Setup Firebase Authentication

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
5. Abilita **Google**:
   - Clicca su "Google"
   - Attiva "Enable"
   - Seleziona un email di supporto (puoi usare la tua email)
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

### 5. Abilita Firestore Database

1. Nel menu laterale, vai su **Firestore Database**
2. Clicca su **Crea database**
3. Scegli **Modalità test** (per sviluppo) o **Modalità produzione** (per produzione)
4. Seleziona una regione (es. `europe-west`)
5. Clicca su **Abilita**

### 6. Configura le regole di sicurezza Firestore

1. Vai su **Firestore Database** > **Regole**
2. Sostituisci le regole con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Campagne collection
    match /Campagne/{campagnaId} {
      // Allow read if user is authenticated and owns the document
      // Note: For queries, Firestore checks each document individually
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      // Allow create if user is authenticated and sets userId to their uid
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      // Allow update/delete if user is authenticated and owns the document
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**⚠️ IMPORTANTE - REGOLE DA USARE:**

Le regole sopra potrebbero non funzionare con le query `where` su alcuni browser/desktop. 

**USA QUESTE REGOLE (copiale esattamente come sono):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Campagne/{campagnaId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**OPPURE copia il contenuto del file `FIRESTORE_RULES.txt` nella root del progetto.**

Queste regole permettono agli utenti autenticati di leggere/scrivere tutte le campagne. L'app filtra automaticamente lato client mostrando solo quelle dell'utente corrente (campo `userId`).

**PASSI PER CONFIGURARE:**
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto `companionapp-37`
3. Vai su **Firestore Database** > **Regole**
4. **CANCELLA** tutte le regole esistenti
5. **INCOLLA** le regole sopra (o dal file FIRESTORE_RULES.txt)
6. Clicca su **Pubblica**
7. Attendi qualche secondo per la propagazione
8. Ricarica la pagina dell'app

**IMPORTANTE:** Se stai ancora in modalità test, le regole potrebbero essere:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**Per produzione, usa le regole sopra che limitano l'accesso ai documenti dell'utente.**

3. Clicca su **Pubblica**

**Nota:** Le regole sopra permettono agli utenti autenticati di leggere e scrivere solo i documenti dove il campo `userId` corrisponde al loro `uid`. Per la collezione `Utenti`, ogni utente può leggere e scrivere solo il proprio documento (identificato dal suo `uid`).

### 6.1. Struttura Collezione Utenti

La collezione `Utenti` viene creata automaticamente quando un utente si registra o accede per la prima volta. Ogni documento ha la seguente struttura:

- **Document ID**: `uid` dell'utente (da Firebase Auth)
- **Campi**:
  - `cid` (int): ID riconoscitivo univoco a 4 cifre (1000-9999), generato automaticamente
  - `nome_utente` (string): Nome dell'utente (da displayName o email)
  - `email` (string): Email dell'utente
  - `campagne` (int): Numero di campagne in cui l'utente gioca (aggiornato automaticamente)
  - `personaggi` (array): Array di personaggi dell'utente (vuoto di default)
  - `mostri` (array): Array di nemici/mostri dell'utente (vuoto di default)
  - `tema_scuro` (boolean): Preferenza tema scuro (sincronizzato con le impostazioni)

**Nota:** Il documento utente viene inizializzato automaticamente al primo login/registrazione. Il campo `campagne` viene aggiornato automaticamente quando vengono create o eliminate campagne.

### 7. Configura il file firebase-config.js

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
✅ Login con Google  
✅ Logout  
✅ Persistenza sessione (l'utente rimane loggato anche dopo il refresh)  
✅ Gestione errori con messaggi chiari  
✅ UI responsive per login/registrazione

## Note di sicurezza

⚠️ **IMPORTANTE**: Il file `firebase-config.js` contiene le tue credenziali API. 
- Non committare questo file su repository pubblici
- Aggiungi `firebase-config.js` al `.gitignore` se contiene credenziali reali
- Per progetti pubblici, usa Firebase App Check per proteggere le API keys

## Collezioni Firestore

### Campagne
- **Nome collezione**: `Campagne`
- **Document ID**: `nome_campagna` (string)
- **Campi**: `nome_campagna`, `nome_dm`, `numero_giocatori`, `numero_sessioni`, `data_creazione`, `tempo_di_gioco`, `note`, `userId`, `icona`

### Utenti
- **Nome collezione**: `Utenti`
- **Document ID**: `uid` dell'utente (da Firebase Auth)
- **Campi**: `cid`, `nome_utente`, `email`, `campagne`, `personaggi`, `mostri`, `tema_scuro`
- **Creazione**: Automatica al primo login/registrazione
- **Aggiornamento**: Automatico per `campagne` e `tema_scuro`

## Prossimi passi

Dopo aver configurato l'autenticazione, puoi:
- Gestire personaggi e mostri nella collezione Utenti
- Aggiungere autenticazione social (Google, Facebook, ecc.)
- Implementare reset password
- Aggiungere verifica email

