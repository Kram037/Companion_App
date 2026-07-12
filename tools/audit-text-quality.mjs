#!/usr/bin/env node
/*
 * Text quality audit for Companion App.
 *
 * Finds likely localization/encoding issues in source and generated data:
 * - UTF-8 mojibake fragments such as Ã, â€, Â
 * - replacement character �
 * - suspicious question marks inside Italian words, e.g. Divinit?
 * - ASCII apostrophe accents in common Italian words, e.g. puo', piu'
 *
 * Usage:
 *   node tools/audit-text-quality.mjs
 *   node tools/audit-text-quality.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const JSON_MODE = process.argv.includes('--json');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.nx', 'dist', 'build', '.cache', '.vite',
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md', '.html',
  '.css', '.sql', '.py', '.txt', '.yml', '.yaml', '.xml', '.svg',
]);

const SUSPICIOUS_PATTERNS = [
  {
    key: 'mojibake',
    label: 'Possibile mojibake UTF-8',
    regex: /(?:Ã.|â€.|â€™|â€œ|â€|â€“|â€”|Â.)/g,
  },
  {
    key: 'replacement_char',
    label: 'Carattere replacement �',
    regex: /�/g,
  },
  {
    key: 'question_mark_word',
    label: 'Punto interrogativo sospetto dentro parola',
    regex: /\b[A-Za-zÀ-ÖØ-öø-ÿ]{3,}\?(?=\b|[\s.,;:!\)\]\}\"'»]|$)/g,
  },
  {
    key: 'ascii_accent',
    label: 'Possibile accento perso con apostrofo ASCII',
    regex: /\b(?:abilita|immunita|vulnerabilita|velocita|identita|rarita|reperibilita|proprieta|quantita|possibilita|opportunita|volonta|utilita|puo|piu|perche|finche|gia|cosi)'\b/gi,
  },
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function lineAndColumn(text, index) {
  const prefix = text.slice(0, index);
  const lines = prefix.split(/\n/);
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function snippet(text, index, length) {
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + length + 50);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function auditFile(file) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const findings = [];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Avoid obvious JS ternaries/import query strings and URLs for the generic ? check.
      if (pattern.key === 'question_mark_word') {
        const before = content.slice(Math.max(0, match.index - 20), match.index);
        const after = content.slice(match.index + match[0].length, match.index + match[0].length + 20);
        if (/https?:\/\//i.test(before) || /[?&][a-z0-9_-]+=/.test(after)) continue;
      }
      const loc = lineAndColumn(content, match.index);
      findings.push({
        file: rel,
        type: pattern.key,
        label: pattern.label,
        line: loc.line,
        column: loc.column,
        match: match[0],
        snippet: snippet(content, match.index, match[0].length),
      });
      if (pattern.regex.lastIndex === match.index) pattern.regex.lastIndex += 1;
    }
  }
  return findings;
}

const findings = walk(ROOT).flatMap(auditFile);

if (JSON_MODE) {
  console.log(JSON.stringify({ count: findings.length, findings }, null, 2));
} else if (!findings.length) {
  console.log('Nessun problema testuale sospetto trovato.');
} else {
  console.log(`Trovati ${findings.length} possibili problemi testuali:\n`);
  for (const f of findings) {
    console.log(`${f.file}:${f.line}:${f.column} [${f.type}] ${f.match}`);
    console.log(`  ${f.snippet}`);
  }
  console.log('\nSuggerimento: esegui con --json per output parsabile.');
  process.exitCode = 1;
}
