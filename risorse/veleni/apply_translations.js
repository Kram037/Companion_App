#!/usr/bin/env node
/**
 * Applica traduzioni IT al JSON canonico dei veleni e
 * rilancia il build del dataset JS.
 *
 * - Idempotente.
 * - Sorgenti traduzioni:
 *     translations.js       => nomi
 *     translations_desc.js  => descrizioni
 *
 * Uso:
 *   node "risorse/veleni/apply_translations.js"
 */

const fs = require('fs');
const path = require('path');

const SRC_JSON = path.join(__dirname, 'veleni.json');
const TRANSLATIONS_NAMES = require('./translations.js');
let TRANSLATIONS_DESC = {};
try { TRANSLATIONS_DESC = require('./translations_desc.js'); } catch (_) {}

const TRANSLATIONS = {};
for (const id of new Set([...Object.keys(TRANSLATIONS_NAMES), ...Object.keys(TRANSLATIONS_DESC)])) {
    TRANSLATIONS[id] = { ...TRANSLATIONS_NAMES[id], ...TRANSLATIONS_DESC[id] };
}

function main() {
    const json = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));
    const items = json.items || [];

    let nameCount = 0, descCount = 0;
    for (const it of items) {
        const t = TRANSLATIONS[it.id];
        if (!t) continue;
        if (t.nome_it) {
            if (it.nome_it !== t.nome_it) it.nome_it = t.nome_it;
            nameCount++;
        }
        if (t.descrizione_it) {
            if (it.descrizione_it !== t.descrizione_it) it.descrizione_it = t.descrizione_it;
            descCount++;
        }
    }

    json.meta = json.meta || {};
    json.meta.count = items.length;
    fs.writeFileSync(SRC_JSON, JSON.stringify(json, null, 2) + '\n', 'utf8');

    console.log(`[apply_translations]`);
    console.log(`  voci totali:        ${items.length}`);
    console.log(`  nomi IT presenti:   ${nameCount}/${items.length}`);
    console.log(`  desc IT presenti:   ${descCount}/${items.length}`);

    const { execSync } = require('child_process');
    execSync(`node "${path.join(__dirname, 'build_veleni_data.js')}"`, { stdio: 'inherit' });
}

main();
