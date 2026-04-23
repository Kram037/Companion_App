#!/usr/bin/env node
/**
 * Applica traduzioni IT al JSON canonico degli oggetti magici e
 * rilancia il build del dataset JS.
 *
 * - Idempotente: ri-applica le stesse traduzioni se gia' presenti.
 * - Pulizia: rimuove item OCR-corrotti elencati in `CORRUPT_IDS` e merga
 *   eventuali frammenti di descrizione nel parent corretto.
 * - Traduzioni: prendi il dictionary da `translations.js`. Ogni voce ha:
 *     id: { nome_it?: string, descrizione_it?: string,
 *           sotto_tipo_it?: string, sintonia_dettaglio_it?: string }
 *
 * Uso:
 *   node "risorse/oggetti magici/apply_translations.js"
 */

const fs = require('fs');
const path = require('path');

const SRC_JSON = path.join(__dirname, 'oggetti_magici.json');
const TRANSLATIONS = require('./translations.js');

// Item da rimuovere perche' frammenti OCR. Per ognuno indichiamo se la
// descrizione_en va appesa a un altro item parent (per ricomporre il
// testo originale spezzato dal PDF).
const CORRUPT_IDS = [
    {
        id: 'any-melee-spell-attack-you-make-with-the-hand-and-any-melee',
        merge_into: 'eye-and-hand-of-vecna',
    },
];

function clean(s) {
    if (s == null) return '';
    return String(s).replace(/\r\n/g, '\n').trim();
}

function main() {
    const json = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));
    let items = json.items || [];

    // 1) Pulizia frammenti OCR
    const byId = Object.fromEntries(items.map(i => [i.id, i]));
    let removed = 0;
    for (const c of CORRUPT_IDS) {
        const frag = byId[c.id];
        if (!frag) continue;
        if (c.merge_into && byId[c.merge_into]) {
            const parent = byId[c.merge_into];
            const fragDesc = clean(frag.descrizione_en);
            const parentDesc = clean(parent.descrizione_en);
            if (fragDesc && !parentDesc.includes(fragDesc.slice(0, 40))) {
                parent.descrizione_en = parentDesc + '\n' + fragDesc;
            }
        }
        items = items.filter(i => i.id !== c.id);
        removed++;
    }
    json.items = items;

    // 2) Applica traduzioni
    let nameCount = 0, descCount = 0, subCount = 0, sintCount = 0;
    for (const it of items) {
        const t = TRANSLATIONS[it.id];
        if (!t) continue;
        if (t.nome_it && it.nome_it !== t.nome_it) { it.nome_it = t.nome_it; nameCount++; }
        else if (t.nome_it) nameCount++;
        if (t.descrizione_it && it.descrizione_it !== t.descrizione_it) { it.descrizione_it = t.descrizione_it; descCount++; }
        else if (t.descrizione_it) descCount++;
        if (t.sotto_tipo_it && it.sotto_tipo_it !== t.sotto_tipo_it) { it.sotto_tipo_it = t.sotto_tipo_it; subCount++; }
        if (t.sintonia_dettaglio_it && it.sintonia_dettaglio !== t.sintonia_dettaglio_it) {
            it.sintonia_dettaglio = t.sintonia_dettaglio_it; sintCount++;
        }
    }

    // 3) Aggiorna meta + scrivi
    json.meta = json.meta || {};
    json.meta.count = items.length;
    fs.writeFileSync(SRC_JSON, JSON.stringify(json, null, 2) + '\n', 'utf8');

    console.log(`[apply_translations]`);
    console.log(`  rimossi item corrotti: ${removed}`);
    console.log(`  voci totali:        ${items.length}`);
    console.log(`  nomi IT presenti:   ${nameCount}/${items.length}`);
    console.log(`  desc IT presenti:   ${descCount}/${items.length}`);
    console.log(`  sotto_tipo IT:      ${subCount} aggiornati`);
    console.log(`  sintonia IT:        ${sintCount} aggiornati`);

    // 4) Rebuild dataset JS
    const { execSync } = require('child_process');
    execSync(`node "${path.join(__dirname, 'build_oggetti_data.js')}"`, { stdio: 'inherit' });
}

main();
