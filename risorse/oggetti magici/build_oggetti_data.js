#!/usr/bin/env node
/**
 * Genera js/data/oggetti_magici_data.js a partire dal JSON canonico
 * `risorse/oggetti magici/oggetti_magici.json`.
 *
 * Schema del dataset prodotto:
 *   window.OGGETTI_MAGICI_DATA = [{
 *     id, slug,
 *     nome,            // IT se presente, altrimenti EN
 *     nome_en,
 *     tipo, sotto_tipo, sotto_tipo_en,
 *     rarita,
 *     richiede_sintonia, sintonia_dettaglio,
 *     incantamento,
 *     descrizione,     // IT se presente, altrimenti EN
 *     descrizione_en,
 *     _nome_pending,   // true se il nome IT manca
 *     _desc_pending,   // true se la descrizione IT manca
 *   }, ...]
 *
 * Idempotente: rilanciabile dopo aver tradotto altre voci nel JSON.
 *
 * Uso:
 *   node "risorse/oggetti magici/build_oggetti_data.js"
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_JSON = path.join(__dirname, 'oggetti_magici.json');
const OUT_JS = path.join(ROOT, 'js', 'data', 'oggetti_magici_data.js');

function clean(s) {
  if (s == null) return '';
  return String(s).replace(/\r\n/g, '\n').trim();
}

function buildEntry(raw) {
  const nome_en = clean(raw.nome);
  const nome_it = clean(raw.nome_it);
  const desc_en = clean(raw.descrizione_en);
  const desc_it = clean(raw.descrizione_it);
  const sotto_it = clean(raw.sotto_tipo_it);
  const sotto_en = clean(raw.sotto_tipo);
  return {
    id: raw.id,
    slug: raw.id,
    nome: nome_it || nome_en,
    nome_en,
    tipo: clean(raw.tipo),
    sotto_tipo: sotto_it || sotto_en,
    sotto_tipo_en: sotto_en,
    rarita: clean(raw.rarita),
    richiede_sintonia: !!raw.richiede_sintonia,
    sintonia_dettaglio: clean(raw.sintonia_dettaglio),
    incantamento: parseInt(raw.incantamento) || 0,
    descrizione: desc_it || desc_en,
    descrizione_en: desc_en,
    _nome_pending: !nome_it,
    _desc_pending: !desc_it,
  };
}

function main() {
  const json = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));
  const items = (json.items || []).map(buildEntry);
  items.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));

  const totale = items.length;
  const tradotti_nome = items.filter(i => !i._nome_pending).length;
  const tradotti_desc = items.filter(i => !i._desc_pending).length;

  const header = `// AUTOGENERATO da risorse/oggetti magici/build_oggetti_data.js - non modificare a mano.
// Per arricchire le traduzioni IT modifica risorse/oggetti magici/oggetti_magici.json
// e ri-esegui \`node "risorse/oggetti magici/build_oggetti_data.js"\`.
//
// Stato traduzione:
//   - Voci totali: ${totale}
//   - Nomi IT: ${tradotti_nome}/${totale}
//   - Descrizioni IT: ${tradotti_desc}/${totale}
`;

  const body = `window.OGGETTI_MAGICI_DATA = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(OUT_JS, header + body, 'utf8');

  console.log(`[build_oggetti_data] scritto ${OUT_JS}`);
  console.log(`  voci totali:        ${totale}`);
  console.log(`  nomi tradotti:      ${tradotti_nome}/${totale}`);
  console.log(`  descrizioni tradotte: ${tradotti_desc}/${totale}`);
}

main();
