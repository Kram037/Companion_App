import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['src/app', 'src/components', 'src/features'];
const files = [];
const errors = [];
const nativeWindowMembers = new Set([
  'addEventListener', 'clearInterval', 'clearTimeout', 'location', 'matchMedia',
  'removeEventListener', 'setInterval', 'setTimeout',
]);
const legacyWindowAllowedFiles = new Set([
  'src/app/LegacyNavigationSync.tsx',
  'src/features/campaigns/CampaignDetailsPage.tsx',
  'src/features/campaigns/CampaignsRoutePage.tsx',
  'src/features/campaigns/SessionPage.tsx',
  'src/features/characters/CharacterCreationPage.tsx',
  'src/features/characters/CharacterSheetPage.tsx',
  'src/features/characters/CharactersPage.tsx',
  'src/features/combat/CombatPage.tsx',
  'src/features/compendium/CompendiumPage.tsx',
  'src/features/compendium/compendiumQueries.ts',
  'src/features/friends/FriendsPage.tsx',
  'src/features/laboratory/LaboratoryPage.tsx',
]);

function collect(path) {
  try {
    const stat = statSync(path);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(path)) collect(join(path, entry));
      return;
    }
    if (/\.(ts|tsx)$/.test(path)) files.push(path);
  } catch {
    // Optional roots such as src/components may not exist yet.
  }
}

for (const root of roots) collect(root);

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative('.', file).replaceAll('\\', '/');

  if (/\binnerHTML\b|dangerouslySetInnerHTML/.test(text)) {
    errors.push(`${rel}: React UI non deve usare innerHTML/dangerouslySetInnerHTML`);
  }
  if (/\bgetSupabaseClient\b|\bsupabase\s*\./.test(text)) {
    errors.push(`${rel}: React UI deve usare src/api, non Supabase diretto`);
  }

  const customWindowMembers = [...text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)/g)]
    .map(match => match[1])
    .filter(name => !nativeWindowMembers.has(name));
  if (customWindowMembers.length && !legacyWindowAllowedFiles.has(rel)) {
    errors.push(`${rel}: nuovi globali legacy non autorizzati: ${[...new Set(customWindowMembers)].join(', ')}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${files.length} React boundary files`);
