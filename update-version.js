// Script semplice per aggiornare la versione nei file HTML
// Uso: node update-version.js

const fs = require('fs');
const path = require('path');

const htmlFile = path.join(__dirname, 'index.html');

try {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Genera un timestamp come versione
    const version = Date.now();
    
    // Sostituisce tutte le versioni nei file
    content = content.replace(/v=\d+\.\d+/g, `v=${version}`);
    content = content.replace(/v=\d+/g, `v=${version}`);
    
    fs.writeFileSync(htmlFile, content, 'utf8');
    console.log(`✅ Versione aggiornata a: ${version}`);
    console.log('📝 Ricarica la pagina nel browser per vedere le modifiche');
} catch (error) {
    console.error('❌ Errore:', error.message);
}

