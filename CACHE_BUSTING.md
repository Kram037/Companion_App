# Cache Busting - Soluzioni per lo sviluppo

## Problema
Il browser può cachare i file CSS e JavaScript, impedendo di vedere le modifiche più recenti.

## Soluzioni implementate

### 1. Meta tag anti-cache
Aggiunti meta tag nell'`<head>` per disabilitare la cache durante lo sviluppo:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 2. Versioning dei file
Aggiunto parametro `?v=1.0` agli script e CSS:
- `styles.css?v=1.0`
- `app.js?v=1.0`
- `supabase-config.js?v=1.0`

**Per aggiornare dopo modifiche:**
Cambia il numero di versione (es. `?v=1.1`) per forzare il reload.

### 3. Hard Refresh
Usa questi comandi per forzare il reload:
- **Windows/Linux**: `Ctrl + Shift + R` o `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

## Soluzioni manuali

### Chrome/Edge
1. Apri DevTools (F12)
2. Click destro sul pulsante di refresh
3. Seleziona "Svuota cache e ricarica forzatamente"

### Firefox
1. Apri DevTools (F12)
2. Vai su Network tab
3. Spunta "Disable cache"
4. Ricarica la pagina

### Durante lo sviluppo
1. Apri DevTools (F12)
2. Vai su Network tab
3. Spunta "Disable cache"
4. Lascia DevTools aperto mentre sviluppi

## Automazione (opzionale)

Puoi creare uno script che incrementa automaticamente la versione. Per ora, basta cambiare manualmente il numero di versione quando fai modifiche importanti.

## Per produzione

In produzione, usa un sistema di build che:
- Aggiunge hash ai nomi file (es. `app.a1b2c3.js`)
- Genera automaticamente versioni univoche
- Usa service workers per gestire la cache correttamente

