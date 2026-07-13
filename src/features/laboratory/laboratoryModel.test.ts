import { describe, expect, it } from 'vitest';

import { activeLaboratoryCategory, laboratoryTable, selectLaboratoryRows } from './laboratoryModel';

describe('laboratory model', () => {
  it('maps combined tabs to their real tables', () => {
    expect(activeLaboratoryCategory('classi', 'sottoclassi')).toBe('sottoclassi');
    expect(laboratoryTable('sottoclassi')).toBe('homebrew_classi');
    expect(laboratoryTable('stili')).toBe('homebrew_stili');
  });

  it('separates classes and subclasses stored in one table', () => {
    const rows = [{ id: '1', nome: 'Classe' }, { id: '2', nome: 'Sottoclasse', parent_class_slug: 'mago' }];
    expect(selectLaboratoryRows(rows, 'classi').map(row => row.id)).toEqual(['1']);
    expect(selectLaboratoryRows(rows, 'sottoclassi').map(row => row.id)).toEqual(['2']);
  });
});
