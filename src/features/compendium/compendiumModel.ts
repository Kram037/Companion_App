export interface CompendiumItem {
  type: string;
  tab?: string;
  id: string;
  title: string;
  subtitle?: string;
  source?: string;
  group?: string;
  sortLevel?: number;
  sortChallenge?: number;
  search?: string;
  tags?: string[];
  data?: Record<string, unknown>;
}

export function filterCompendiumItems(items: CompendiumItem[], search: string) {
  const query = normalize(search);
  if (!query) return items;
  return items.filter(item => normalize(`${item.title} ${item.subtitle ?? ''} ${item.search ?? ''}`).includes(query));
}

export function sortCompendiumItems(items: CompendiumItem[], tab: string) {
  const collator = new Intl.Collator('it');
  return [...items].sort((a, b) => {
    if (tab === 'mostri') {
      const challenge = (a.sortChallenge ?? 999) - (b.sortChallenge ?? 999);
      if (challenge) return challenge;
    }
    if (tab === 'incantesimi') {
      const level = (a.sortLevel ?? 0) - (b.sortLevel ?? 0);
      if (level) return level;
    }
    return collator.compare(a.group ?? '', b.group ?? '') || collator.compare(a.title, b.title);
  });
}

export function groupCompendiumItems(items: CompendiumItem[]) {
  return items.reduce<Array<{ label: string; items: CompendiumItem[] }>>((groups, item) => {
    const label = item.group || 'Altro';
    const group = groups.find(entry => entry.label === label);
    if (group) group.items.push(item);
    else groups.push({ label, items: [item] });
    return groups;
  }, []);
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').trim();
}
