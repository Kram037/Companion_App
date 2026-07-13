import type { HomebrewTable } from '../../api/homebrewApi';
import type { HomebrewItem } from '../../types/domain';

export function activeLaboratoryCategory(tab: string, subtab: string) {
  if (tab === 'classi') return subtab === 'sottoclassi' ? 'sottoclassi' : 'classi';
  if (tab === 'talenti') return subtab === 'stili' ? 'stili' : 'talenti';
  if (tab === 'nemici') return subtab === 'combattimenti' ? 'combattimenti' : 'nemici';
  return tab;
}

export function laboratoryTable(category: string): HomebrewTable {
  const tables: Record<string, HomebrewTable> = {
    background: 'homebrew_background', classi: 'homebrew_classi', sottoclassi: 'homebrew_classi',
    incantesimi: 'homebrew_incantesimi', nemici: 'homebrew_nemici', combattimenti: 'homebrew_combattimenti',
    oggetti: 'homebrew_oggetti', razze: 'homebrew_razze', stili: 'homebrew_stili', suppliche: 'homebrew_suppliche', talenti: 'homebrew_talenti',
  };
  return tables[category] || 'homebrew_classi';
}

export function selectLaboratoryRows(items: HomebrewItem[], category: string) {
  if (category === 'classi') return items.filter(item => !String(item.parent_class_slug || '').trim());
  if (category === 'sottoclassi') return items.filter(item => String(item.parent_class_slug || '').trim());
  return items;
}
