import { describe, expect, it } from 'vitest';

import { filterCompendiumItems, groupCompendiumItems, sortCompendiumItems } from './compendiumModel';

const items = [
  { type: 'incantesimi', id: 'b', title: 'Dardo di Fuoco', group: 'Trucchetto', sortLevel: 0, search: 'Evocazione' },
  { type: 'incantesimi', id: 'a', title: 'Aiuto', group: '2° livello', sortLevel: 2, search: 'Abiurazione' },
];

describe('compendium model', () => {
  it('filters accents and metadata', () => {
    expect(filterCompendiumItems(items, 'evocazione').map(item => item.id)).toEqual(['b']);
  });

  it('sorts levels and groups the visible list', () => {
    const sorted = sortCompendiumItems([...items].reverse(), 'incantesimi');
    expect(sorted.map(item => item.id)).toEqual(['b', 'a']);
    expect(groupCompendiumItems(sorted).map(group => group.label)).toEqual(['Trucchetto', '2° livello']);
  });
});
