import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { updateCharacterResistances } from '../../api';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import { useCharacterSheetUiStore } from '../../store';
import { characterQuery } from './characterQueries';
import {
  ABILITIES, CONDITIONS, HIT_DICE, SKILLS, SPELL_ABILITIES, classLine, hpValues, inventoryMeta,
  inventoryName, modifier, numberField, objectList, pageOneResourceTables, proficiency, raceLine, recordField, signed,
  spellName, stringList, subclassAutoResistances, subclassLine, type CharacterData,
} from './characterSheetModel';

type LegacyFeature = { name?: string; name_en?: string; description?: string; description_en?: string; level?: number | null; source_label?: string };
type LegacyResource = { key: string; nome?: string; name?: string; current: number; max: number; die?: string; recharge?: string; classeNome?: string; sottoclasseNome?: string; tipo?: string; defaultMax?: number };
type ClassResource = { nome: string; fromLevel: number; usaMod?: string; perLivello?: number[]; hpPool?: boolean; dado?: string; recharge?: string };
type LegacySheetModel = {
  classResources?: Record<string, ClassResource[]>;
  subclassResources?: LegacyResource[];
  raceResources?: LegacyResource[];
  invocationSlots?: (LegacyResource & { is_spell?: boolean; level_label?: string })[];
  classFeatures?: { className: string; features: LegacyFeature[]; subclassName?: string | null; subFeatures: LegacyFeature[] }[];
  raceTraits?: LegacyFeature[];
  background?: Record<string, any> | null;
  spells?: Record<string, any>[];
  feats?: LegacyFeature[];
  fightingStyles?: LegacyFeature[];
  invocations?: LegacyFeature[];
  inventory?: Record<string, any>[];
};

declare global {
  interface Window {
    setSchedaReactCharacter?: (character: CharacterData, tab: string) => void;
    getSchedaReactModel?: (character: CharacterData) => LegacySheetModel;
    schedaRenameCharacter?: (id: string) => void;
    schedaEditAvatar?: (id: string) => void;
    schedaOpenXpCalc?: (id: string) => void;
    schedaIspChange?: (id: string, delta: number) => void;
    schedaOpenAbilityCalc?: (id: string, key: string) => void;
    schedaToggleSave?: (id: string, key: string) => void;
    schedaOpenSaveBonus?: (id: string, key: string) => void;
    schedaToggleSkillProf?: (id: string, key: string) => void;
    schedaToggleSkillExpert?: (id: string, key: string) => void;
    schedaOpenCABonus?: (id: string) => void;
    schedaOpenStatCalc?: (id: string, field: string) => void;
    schedaOpenSpeedCalc?: (id: string) => void;
    schedaOpenHpCalcLive?: (id: string, field: string) => void;
    schedaOpenResImmEdit?: (id: string) => void;
    schedaToggleConcentrazione?: (id: string, element?: HTMLElement | null) => void;
    openConditionsModal?: (id: string) => void;
    schedaHdChange?: (id: string, key: string, current: number, delta: number, max: number) => void;
    schedaClassResChange?: (id: string, key: string, current: number, delta: number, max: number) => void;
    schedaSubclassResChange?: (id: string, key: string, current: number, delta: number, max: number) => void;
    schedaRaceResChange?: (id: string, key: string, current: number, delta: number, max: number) => void;
    schedaInvocationSlotChange?: (id: string, key: string, current: number, delta: number, max: number) => void;
    schedaCustomResChange?: (id: string, index: number, current: number, delta: number, max: number) => void;
    schedaOpenAddCustomRes?: (id: string, index?: number) => void;
    schedaOpenEditClassRes?: (id: string, key: string, defaultName: string, defaultMax: number) => void;
    schedaPortentSlotClick?: (id: string, key: string, index: number, max: number) => void;
    schedaPortentRollAll?: (id: string, key: string, max: number) => void;
    p1AddTab?: () => void;
    p1RemoveTab?: (name: string) => void;
    schedaOpenP1TabRes?: (id: string, name: string, index?: number) => void;
    schedaP1TabResChange?: (id: string, name: string, index: number, current: number, delta: number, max: number) => void;
    schedaOpenAddEquip?: (id: string) => void;
    schedaEditEquip?: (id: string, index: number) => void;
    schedaRemoveEquip?: (id: string, index: number) => void;
    schedaOpenLangProfEdit?: (id: string) => void;
    invOpenCoinKeypad?: (input: HTMLInputElement) => void;
    invEditAttune?: (id: string, index: number) => void;
    invAddItem?: (id: string) => void;
    invEditItem?: (id: string, index: number) => void;
    invQtyInlineUpdate?: (id: string, index: number, value: number | string) => void;
    schedaOpenSpellAtkBonus?: (id: string, classes: string) => void;
    schedaOpenSpellDcBonus?: (id: string, classes: string) => void;
    schedaOpenPreparedMax?: (id: string) => void;
    schedaSlotToggleInline?: (id: string, level: number, index: number) => void;
    schedaOpenSpellPicker?: (id: string, level: number) => void;
    schedaShowSpellDetail?: (name: string) => void;
    schedaTogglePrepared?: (id: string, name: string) => void;
    schedaOpenTalentiEdit?: (id: string) => void;
    schedaOpenFightingStylesEdit?: (id: string) => void;
    schedaOpenInvocationsEdit?: (id: string) => void;
    privAddCustom?: (tab: string) => void;
    privOpenCustomTabEdit?: (tab: string) => void;
    privAddTab?: () => void;
    microOpenSlotConfig?: (id: string) => void;
    microSlotToggle?: (id: string, level: number, index: number) => void;
    _normalizeImageUrl?: (url: string) => string;
    _getFactotumBonus?: (character: CharacterData) => number;
    _getSaveBonusFor?: (character: CharacterData, key: string) => number;
  }
}

const TABS = [
  ['scheda', 'Pagina 1'], ['privilegi', 'Pagina 2'], ['inventario', 'Inventario'], ['incantesimi', 'Incantesimi'],
] as const;

export function CharacterSheetPage() {
  const { personaggioId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery(characterQuery(personaggioId));
  const activeTab = useCharacterSheetUiStore(state => state.activeTabByCharacter[personaggioId] || 'scheda');
  const setTab = useCharacterSheetUiStore(state => state.setCharacterTab);
  const { mutate: persistAutoResistances } = useMutation({
    mutationFn: (resistenze: string[]) => updateCharacterResistances(personaggioId, resistenze),
    onSuccess: resistenze => client.setQueryData(queryKeys.character(personaggioId), (current: CharacterData | null | undefined) => current ? { ...current, resistenze } : current),
  });

  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ personaggioId?: string; tab?: string }>).detail;
      if (detail?.personaggioId && detail.personaggioId !== personaggioId) return;
      if (detail?.tab && detail.tab !== 'micro') setTab(personaggioId, detail.tab);
      client.invalidateQueries({ queryKey: queryKeys.character(personaggioId) });
    };
    window.addEventListener('companion:character-refresh', refresh);
    return () => {
      window.removeEventListener('companion:character-refresh', refresh);
    };
  }, [client, personaggioId, setTab]);

  const character = query.data as CharacterData | null | undefined;
  useEffect(() => {
    if (character) window.setSchedaReactCharacter?.(character, character.tipo_scheda === 'micro' ? 'micro' : activeTab);
  }, [activeTab, character]);

  useEffect(() => {
    if (!character) return;
    const stored = new Set(stringList(character, 'resistenze'));
    const missing = subclassAutoResistances(character).filter(value => !stored.has(value));
    if (missing.length) persistAutoResistances([...stored, ...missing]);
  }, [character, persistAutoResistances]);

  if (query.isLoading) return <ReactPage name="scheda"><Placeholder text="Caricamento scheda..." /></ReactPage>;
  if (!character || query.isError) return <ReactPage name="scheda"><Placeholder text="Personaggio non trovato." /></ReactPage>;

  const model = window.getSchedaReactModel?.(character) ?? {};
  const isMicro = character.tipo_scheda === 'micro';

  return <ReactPage name="scheda">
    <div className="page-content scheda-content react-character-sheet">
      <div className="page-top-stack scheda-top-stack"><div className="page-header scheda-page-header page-header-with-back">
        <button className="page-header-back scheda-header-back" type="button" onClick={() => navigate(buildAppPath('personaggi'))} aria-label="Torna ai personaggi"><Back /></button>
        <h1>{character.nome}</h1>
        <button className="page-header-action scheda-title-edit" type="button" onClick={() => window.schedaRenameCharacter?.(character.id)} aria-label="Rinomina personaggio"><Edit /></button>
      </div></div>
      <CharacterHeader character={character} />
      {isMicro ? <MicroSheet character={character} model={model} /> : activeTab === 'inventario'
        ? <InventoryTab character={character} model={model} /> : activeTab === 'incantesimi'
          ? <SpellsTab character={character} model={model} /> : activeTab === 'privilegi'
            ? <PrivilegesTab character={character} model={model} /> : <MainTab character={character} model={model} />}
    </div>
    {!isMicro && <nav className="scheda-tab-bar react-scheda-tab-bar" aria-label="Pagine scheda">{TABS.map(([key, label]) => <button key={key} type="button" className={`scheda-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setTab(personaggioId, key)}>{label}</button>)}</nav>}
  </ReactPage>;
}

function CharacterHeader({ character }: { character: CharacterData }) {
  const image = String(character.immagine_url || '');
  const src = image ? window._normalizeImageUrl?.(image) ?? image : '';
  const initials = character.nome.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const inspiration = numberField(character, 'ispirazione');
  return <div className="scheda-identity">
    <button type="button" className="scheda-avatar" onClick={() => window.schedaEditAvatar?.(character.id)} title="Cambia immagine">
      {src ? <img src={src} alt="" className="scheda-avatar-img" referrerPolicy="no-referrer" /> : <span className="scheda-avatar-initials">{initials || '?'}</span>}
    </button>
    <div className="scheda-identity-info">
      <div className="scheda-quick-line scheda-quick-classi">{classLine(character)}</div>
      <div className="scheda-quick-line scheda-quick-sottoclassi">{subclassLine(character)}</div>
      <div className="scheda-quick-line scheda-quick-razza">{raceLine(character)}</div>
    </div>
    <div className="scheda-identity-actions">
      {!!character.classi?.length && <button className="scheda-levelup-top" type="button" onClick={() => window.schedaOpenXpCalc?.(character.id)}>Avanzamento</button>}
      <div className="scheda-isp-box" title="Ispirazione">
        <button className="scheda-isp-btn" type="button" onClick={() => window.schedaIspChange?.(character.id, -1)}>−</button>
        <div className="scheda-isp-display"><span className="scheda-isp-star">★</span><span id="sIsp">{inspiration}</span></div>
        <button className="scheda-isp-btn" type="button" onClick={() => window.schedaIspChange?.(character.id, 1)}>+</button>
      </div>
    </div>
  </div>;
}

function MainTab({ character, model }: { character: CharacterData; model: LegacySheetModel }) {
  return <div className="scheda-page-grid">
    <div className="scheda-col scheda-col-left">
      <div className="scheda-perc-passiva scheda-prof-bonus"><span className="scheda-perc-val">+{proficiency(character.livello || 1)}</span><span className="scheda-perc-label">Bonus di Competenza</span></div>
      <Abilities character={character} />
      <Skills character={character} />
      <Languages character={character} />
    </div>
    <hr className="scheda-divider" />
    <div className="scheda-col scheda-col-right">
      <Statistics character={character} />
      <HitDice character={character} />
      <Equipment character={character} />
      <Resources character={character} model={model} />
    </div>
  </div>;
}

function Abilities({ character }: { character: CharacterData }) {
  const saves = stringList(character, 'tiri_salvezza');
  const prof = proficiency(character.livello || 1);
  return <Section id={`${character.id}:abilities`} title="Caratteristiche e Tiri Salvezza">
    <div className="scheda-abilities">{ABILITIES.map(ability => {
      const score = numberField(character, ability.key, 10);
      const saveExtra = window._getSaveBonusFor?.(character, ability.key) ?? 0;
      const save = modifier(score) + (saves.includes(ability.key) ? prof : 0) + saveExtra;
      return <div className="scheda-ability" key={ability.key}>
        <div className="scheda-ability-label">{ability.label}</div>
        <button type="button" className="scheda-ability-input clickable" id={`sAbil_${ability.key}`} onClick={() => window.schedaOpenAbilityCalc?.(character.id, ability.key)}>{score}</button>
        <div className="scheda-ability-mod" id={`sMod_${ability.key}`}>{signed(modifier(score))}</div>
        <div className={`scheda-ability-save ${saves.includes(ability.key) ? 'proficient' : ''}`}>
          <button type="button" className="scheda-save-dot react-dot-button" onClick={() => window.schedaToggleSave?.(character.id, ability.key)}>{saves.includes(ability.key) ? '●' : '○'}</button>
          <button type="button" className="scheda-save-clickable react-inline-button" onClick={() => window.schedaOpenSaveBonus?.(character.id, ability.key)}><span className="scheda-save-label">TS</span><span id={`sSave_${ability.key}`}>{signed(save)}{saveExtra ? '*' : ''}</span></button>
        </div>
      </div>;
    })}</div>
  </Section>;
}

function Skills({ character }: { character: CharacterData }) {
  const proficiencies = stringList(character, 'competenze_abilita');
  const expertise = stringList(character, 'maestrie_abilita');
  const prof = proficiency(character.livello || 1);
  const factotum = window._getFactotumBonus?.(character) ?? 0;
  const skillValue = (key: string, ability: string) => modifier(numberField(character, ability, 10)) + (proficiencies.includes(key) ? prof : 0) + (expertise.includes(key) ? prof : 0) + (!proficiencies.includes(key) && !expertise.includes(key) ? factotum : 0);
  const passive = 10 + skillValue('percezione', 'saggezza');
  return <Section id={`${character.id}:skills`} title="Abilita">
    <div className="scheda-skills">{SKILLS.map(([key, label, ability]) => <div className="scheda-skill" key={key}>
      <button type="button" className={`scheda-skill-dot react-dot-button ${proficiencies.includes(key) ? 'active' : ''}`} onClick={() => window.schedaToggleSkillProf?.(character.id, key)}>●</button>
      <button type="button" className={`scheda-skill-dot expert react-dot-button ${expertise.includes(key) ? 'active' : ''}`} onClick={() => window.schedaToggleSkillExpert?.(character.id, key)}>★</button>
      <span className="scheda-skill-mod" id={`sSkill_${key}`}>{signed(skillValue(key, ability))}</span>
      <span className="scheda-skill-name">{label} <small>({ability.slice(0, 3).toUpperCase()})</small></span>
    </div>)}</div>
    <div className="scheda-perc-passiva"><span className="scheda-perc-val" id="sPercPassiva">{passive}</span><span className="scheda-perc-label">Percezione Passiva</span></div>
  </Section>;
}

function Languages({ character }: { character: CharacterData }) {
  const languages = stringList(character, 'linguaggi');
  const tools = stringList(character, 'competenze_strumenti');
  return <Section id={`${character.id}:languages`} title="Linguaggi e Competenze" defaultOpen={false} action={<EditButton label="Modifica linguaggi e competenze" onClick={() => window.schedaOpenLangProfEdit?.(character.id)} />}>
    <CompactList label="Linguaggi" values={languages} />
    <CompactList label="Strumenti" values={tools} />
  </Section>;
}

function Statistics({ character }: { character: CharacterData }) {
  const hp = hpValues(character);
  const conditions = CONDITIONS.filter(([key]) => Boolean(character[key]));
  const resistances = [...new Set([...stringList(character, 'resistenze'), ...subclassAutoResistances(character)])];
  const defenses = [...resistances, ...stringList(character, 'immunita'), ...stringList(character, 'vulnerabilita')];
  return <Section id={`${character.id}:statistics`} title="Statistiche">
    <div className="scheda-three-boxes">
      <StatBox label="CA" value={numberField(character, 'classe_armatura', 10)} onClick={() => window.schedaOpenCABonus?.(character.id)} />
      <StatBox label="Iniziativa" value={signed(numberField(character, 'iniziativa', modifier(numberField(character, 'destrezza', 10))))} onClick={() => window.schedaOpenStatCalc?.(character.id, 'iniziativa')} />
      <StatBox label="Velocita" value={numberField(character, 'velocita', 9)} onClick={() => window.schedaOpenSpeedCalc?.(character.id)} />
    </div>
    <div className="scheda-hp-section">
      <HpBox label="PF Max" value={hp.max} className={hp.bonus ? 'pv-max-temp' : ''} onClick={() => window.schedaOpenHpCalcLive?.(character.id, 'punti_vita_max')} />
      <HpBox label="PF Attuali" value={hp.current} className="pv-current" onClick={() => window.schedaOpenHpCalcLive?.(character.id, 'pv_attuali')} />
      <HpBox label="PF Temp" value={hp.temporary} onClick={() => window.schedaOpenHpCalcLive?.(character.id, 'pv_temporanei')} />
    </div>
    <div className="react-sheet-summary"><button type="button" onClick={() => window.schedaOpenResImmEdit?.(character.id)}><strong>Difese</strong><span>{defenses.length ? defenses.join(', ') : 'Nessuna'}</span></button></div>
    <div className="scheda-concentrazione-row"><button type="button" className={`scheda-concentrazione-btn ${character.concentrazione ? 'active' : ''}`} onClick={event => window.schedaToggleConcentrazione?.(character.id, event.currentTarget)}>Concentrazione</button></div>
    <div className="scheda-tags">{conditions.length ? conditions.map(([key, label]) => <span className="condition-badge active" key={key}>{label}</span>) : <span className="scheda-empty">Nessuna condizione</span>}</div>
    <div className="scheda-condition-extra"><span>Esaustione: <strong>{numberField(character, 'esaustione')}</strong>/6</span></div>
    <button type="button" className="btn-secondary btn-small react-sheet-action" onClick={() => window.openConditionsModal?.(character.id)}>Modifica stato</button>
  </Section>;
}

function HitDice({ character }: { character: CharacterData }) {
  const available = recordField(character, 'dadi_vita_disponibili');
  return <Section id={`${character.id}:hit-dice`} title="Dadi Vita">
    <div className="scheda-hd-table">{(character.classi ?? []).map(item => {
      const max = item.livello || 1;
      const current = Math.min(max, Number(available[item.nome] ?? max));
      return <CounterRow key={item.nome} label={`${max}d${HIT_DICE[item.nome] || 8} (${item.nome})`} current={current} max={max}
        onChange={delta => window.schedaHdChange?.(character.id, item.nome, current, delta, max)} />;
    })}</div>
  </Section>;
}

function Equipment({ character }: { character: CharacterData }) {
  const items = objectList(character, 'equipaggiamento');
  return <Section id={`${character.id}:equipment`} title="Equipaggiamento" action={<EditButton label="Aggiungi equipaggiamento" onClick={() => window.schedaOpenAddEquip?.(character.id)} />}>
    {!items.length ? <span className="scheda-empty">Nessun equipaggiamento</span> : <div className="react-equipment-list">{items.map((item, index) => <button type="button" className="react-equipment-row" key={`${inventoryName(item)}-${index}`} onClick={() => window.schedaEditEquip?.(character.id, index)}>
      <strong>{inventoryName(item)}</strong><span>{[item.tipo, item.danni, item.tipo_danno, item.ca_base ? `CA ${item.ca_base}` : ''].filter(Boolean).join(' · ')}</span>
    </button>)}</div>}
  </Section>;
}

function Resources({ character, model }: { character: CharacterData; model: LegacySheetModel }) {
  const stored = recordField(character, 'risorse_classe');
  const overrides = stored._overrides && typeof stored._overrides === 'object' ? stored._overrides as Record<string, { nome?: string; max?: number }> : {};
  const rows: { key: string; label: string; current: number; max: number; kind: 'class' | 'subclass' | 'race' | 'invocation' | 'custom'; index?: number; defaultName?: string; defaultMax?: number; tipo?: string; portent?: unknown[] }[] = [];
  (character.classi ?? []).forEach(item => (model.classResources?.[item.nome] ?? []).forEach((resource, index) => {
    if (item.livello < resource.fromLevel) return;
    const defaultMax = resource.hpPool ? item.livello * 5 : resource.usaMod ? Math.max(1, modifier(numberField(character, resource.usaMod, 10))) : resource.perLivello?.[Math.min(item.livello, 20)] || 0;
    if (!defaultMax) return;
    const key = index ? `${item.nome}_res_${index}` : `${item.nome}_res`;
    const override = overrides[key] || {};
    const max = Number(override.max) > 0 ? Number(override.max) : defaultMax;
    rows.push({ key, label: `${override.nome || resource.nome}${resource.dado ? ` (${resource.dado})` : ''} (${item.nome}${resource.recharge ? `, ${resource.recharge}` : ''})`, current: Math.min(max, Number(stored[key] ?? max)), max, kind: 'class', defaultName: resource.nome, defaultMax });
  }));
  (model.subclassResources ?? []).forEach(item => {
    const override = overrides[item.key] || {};
    const max = Number(override.max) > 0 ? Number(override.max) : item.max;
    rows.push({ key: item.key, label: `${override.nome || item.nome || item.name || 'Risorsa'}${item.die ? ` (${item.die})` : ''}${item.sottoclasseNome ? ` (${item.sottoclasseNome}${item.recharge ? `, ${item.recharge}` : ''})` : ''}`, current: Math.min(max, item.current), max, kind: 'subclass', defaultName: item.nome || item.name || 'Risorsa', defaultMax: item.defaultMax || item.max, tipo: item.tipo, portent: Array.isArray(stored._portent?.[item.key]) ? stored._portent[item.key] : [] });
  });
  (model.raceResources ?? []).forEach(item => rows.push({ key: item.key, label: `${item.nome || item.name || 'Risorsa'} (razza${item.recharge ? `, ${item.recharge}` : ''})`, current: item.current, max: item.max, kind: 'race' }));
  (model.invocationSlots ?? []).filter(item => !item.is_spell).forEach(item => rows.push({ key: item.key, label: `${item.nome || item.name || 'Risorsa'} (supplica${item.recharge ? `, ${item.recharge}` : ''})`, current: item.current, max: item.max, kind: 'invocation' }));
  const custom = Array.isArray(stored._custom) ? stored._custom as Record<string, any>[] : [];
  const pageOneTables = pageOneResourceTables(character);
  custom.forEach((item, index) => rows.push({ key: `custom-${index}`, label: `${item.nome || 'Risorsa'}${item.dado ? ` (${item.dado})` : ''}`, current: Number(item.current ?? item.max ?? 0), max: Number(item.max ?? 0), kind: 'custom', index }));
  const change = (row: typeof rows[number], delta: number) => {
    if (row.kind === 'class') window.schedaClassResChange?.(character.id, row.key, row.current, delta, row.max);
    else if (row.kind === 'subclass') window.schedaSubclassResChange?.(character.id, row.key, row.current, delta, row.max);
    else if (row.kind === 'race') window.schedaRaceResChange?.(character.id, row.key, row.current, delta, row.max);
    else if (row.kind === 'invocation') window.schedaInvocationSlotChange?.(character.id, row.key, row.current, delta, row.max);
    else window.schedaCustomResChange?.(character.id, row.index || 0, row.current, delta, row.max);
  };
  const edit = (row: typeof rows[number]) => {
    if (row.kind === 'custom') window.schedaOpenAddCustomRes?.(character.id, row.index);
    else if ((row.kind === 'class' || row.kind === 'subclass') && row.defaultName && row.defaultMax) window.schedaOpenEditClassRes?.(character.id, row.key, row.defaultName, row.defaultMax);
  };
  return <>
    <Section id={`${character.id}:resources`} title="Risorse" action={<EditButton label="Aggiungi risorsa" onClick={() => window.schedaOpenAddCustomRes?.(character.id)} />}>
      {!rows.length ? <span className="scheda-empty">Nessuna risorsa</span> : <div className="scheda-hd-table">{rows.map(row => row.tipo === 'portent'
        ? <PortentRow key={row.key} label={row.label} values={row.portent || []} max={row.max} onEdit={() => edit(row)} onSlot={index => window.schedaPortentSlotClick?.(character.id, row.key, index, row.max)} onRoll={() => window.schedaPortentRollAll?.(character.id, row.key, row.max)} />
        : <CounterRow key={row.key} label={row.label} current={row.current} max={row.max} onEdit={row.kind === 'class' || row.kind === 'subclass' || row.kind === 'custom' ? () => edit(row) : undefined} onChange={delta => change(row, delta)} />)}</div>}
    </Section>
    {pageOneTables.map(table => <Section key={table.name} id={`${character.id}:resource-table:${table.name}`} title={table.name} action={<div className="react-section-actions"><EditButton label={`Aggiungi a ${table.name}`} onClick={() => window.schedaOpenP1TabRes?.(character.id, table.name)} /><button type="button" className="scheda-edit-btn" title={`Rimuovi ${table.name}`} aria-label={`Rimuovi ${table.name}`} onClick={event => { event.stopPropagation(); window.p1RemoveTab?.(table.name); }}>×</button></div>}>
      {!table.items.length ? <span className="scheda-empty">Nessuna risorsa</span> : <div className="scheda-hd-table">{table.items.map(item => <CounterRow key={`${table.name}-${item.index}`} label={`${item.name}${item.die ? ` (${item.die})` : ''}`} current={item.current} max={item.max} onEdit={() => window.schedaOpenP1TabRes?.(character.id, table.name, item.index)} onChange={delta => window.schedaP1TabResChange?.(character.id, table.name, item.index, item.current, delta, item.max)} />)}</div>}
    </Section>)}
    <div className="priv-add-tab-wrap"><button className="btn-secondary priv-add-tab-btn" type="button" onClick={() => window.p1AddTab?.()}><span className="priv-add-tab-plus">+</span> Nuova tabella risorse</button></div>
  </>;
}

function InventoryTab({ character, model }: { character: CharacterData; model: LegacySheetModel }) {
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rarities, setRarities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const coins = recordField(character, 'monete');
  const items = model.inventory ?? objectList(character, 'inventario');
  const rarityOf = (item: Record<string, any>) => String(item.rarita || item.rarity || '').trim();
  const typeOf = (item: Record<string, any>) => String(item.tipo || item.type || item.sotto_tipo || '').trim();
  const rarityOptions = [...new Set(items.map(rarityOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  const typeOptions = [...new Set(items.map(typeOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'it'));
  const visible = items.map((item, index) => ({ item, index })).filter(({ item }) => {
    if (!`${inventoryName(item)} ${inventoryMeta(item)}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (rarities.length && !rarities.includes(rarityOf(item))) return false;
    return !types.length || types.includes(typeOf(item));
  });
  const toggle = (values: string[], value: string, setter: (next: string[]) => void) => setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  const attunement = Array.isArray(character.sintonia) ? character.sintonia as any[] : [];
  return <>
    <Section id={`${character.id}:coins`} title="Monete">
      <div className="inv-coins-grid inv-coins-grid-2x3">{(['mr', 'ma', 'me', 'mo', 'mp'] as const).map(key => <label className={`inv-coin-cell inv-coin-${key}`} key={key}>
        <span className="inv-coin-abbr">{key.toUpperCase()}</span>
        <input className="inv-coin-input" value={Number(coins[key] || 0)} readOnly inputMode="none" data-coin={key} data-pgid={character.id} onClick={event => window.invOpenCoinKeypad?.(event.currentTarget)} />
        <span className="inv-coin-name">Monete</span>
      </label>)}</div>
    </Section>
    <Section id={`${character.id}:attunement`} title="Sintonia" defaultOpen={false}>
      <div className="inv-attune-grid">{[0, 1, 2].map(index => <button type="button" className={`inv-attune-slot ${attunement[index] ? 'filled' : 'empty'}`} key={index} onClick={() => window.invEditAttune?.(character.id, index)}><span className="inv-attune-icon">◆</span><span className="inv-attune-name">{attunement[index] ? inventoryName(typeof attunement[index] === 'object' ? attunement[index] : { nome: attunement[index] }) : 'Slot vuoto'}</span></button>)}</div>
    </Section>
    <section className="scheda-section inv-section-fixed"><div className="scheda-section-title inv-section-title-fixed"><span>Inventario</span><EditButton label="Aggiungi oggetto" onClick={() => window.invAddItem?.(character.id)} /></div>
      <div className="scheda-section-body"><div className="filters-bar inv-list-toolbar"><div className="filter-search-wrap"><Search /><input className="filter-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cerca per nome o tipo..." /></div><button className="comp-filter-btn" type="button" onClick={() => setFiltersOpen(true)}><Sliders /><span>Filtri</span>{rarities.length + types.length > 0 && <strong>{rarities.length + types.length}</strong>}</button></div>
        <div className="inv-items-grid inv-items-grid-2col">{visible.length ? visible.map(({ item, index }) => <article className="inv-item-row inv-item-card" key={`${inventoryName(item)}-${index}`}>
          <button type="button" className="inv-item-main react-inventory-main" onClick={() => window.invEditItem?.(character.id, index)}><span className="inv-item-name">{inventoryName(item)}</span>{inventoryMeta(item) && <span className="inv-item-meta">{inventoryMeta(item)}</span>}</button>
          <label className="inv-item-qty-edit"><span className="inv-item-qty-x">×</span><input className="inv-item-qty-input" type="number" min="1" value={Number(item.quantita || 1)} onChange={event => window.invQtyInlineUpdate?.(character.id, index, event.target.value)} /></label>
        </article>) : <span className="scheda-empty">Nessun oggetto</span>}</div>
      </div>
    </section>
    {filtersOpen && <div className="hp-calc-overlay comp-filter-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
      <div className="hp-calc-modal comp-filter-modal" role="dialog" aria-modal="true" aria-labelledby="inventoryFiltersTitle">
        <button type="button" className="modal-close" onClick={() => setFiltersOpen(false)} aria-label="Chiudi">×</button>
        <h2 className="comp-filter-title" id="inventoryFiltersTitle">Filtri</h2>
        <div className="comp-filter-panel react-filter-groups">
          <FilterChoices title="Rarita" options={rarityOptions} selected={rarities} onToggle={value => toggle(rarities, value, setRarities)} />
          <FilterChoices title="Tipologia" options={typeOptions} selected={types} onToggle={value => toggle(types, value, setTypes)} />
        </div>
        <div className="comp-filter-actions"><button type="button" className="btn-secondary" onClick={() => { setRarities([]); setTypes([]); }}>Reset</button></div>
      </div>
    </div>}
  </>;
}

function SpellsTab({ character, model }: { character: CharacterData; model: LegacySheetModel }) {
  const prof = proficiency(character.livello || 1);
  const classesByAbility = useMemo(() => {
    const values = new Map<string, string[]>();
    (character.classi ?? []).forEach(item => {
      const ability = SPELL_ABILITIES[item.nome];
      if (ability) values.set(ability, [...(values.get(ability) ?? []), item.nome]);
    });
    return [...values.entries()];
  }, [character.classi]);
  const slots = recordField(character, 'slot_incantesimo');
  const prepared = new Set(stringList(character, 'incantesimi_preparati').map(value => value.toLowerCase()));
  const spells = model.spells ?? [];
  const byLevel = new Map<number, Record<string, any>[]>();
  spells.forEach(spell => {
    const level = Number(spell.level ?? spell.livello ?? 0);
    byLevel.set(level, [...(byLevel.get(level) ?? []), spell]);
  });
  const levels = [...new Set([0, ...Object.keys(slots).map(Number), ...byLevel.keys()])].sort((a, b) => a - b);
  return <>
    <Section id={`${character.id}:spell-stats`} title="Statistiche Incantatore">
      {classesByAbility.length ? classesByAbility.map(([ability, classes]) => {
        const mod = modifier(numberField(character, ability, 10));
        const encoded = encodeURIComponent(JSON.stringify(classes));
        return <div className="scheda-spell-stats-row" key={ability}><StatBox label={`Car. (${ability.slice(0, 3).toUpperCase()})`} value={signed(mod)} /><StatBox label="Attacco Inc." value={signed(mod + prof)} onClick={() => window.schedaOpenSpellAtkBonus?.(character.id, encoded)} /><StatBox label="CD Inc." value={8 + mod + prof} onClick={() => window.schedaOpenSpellDcBonus?.(character.id, encoded)} /></div>;
      }) : <span className="scheda-empty">Nessuna classe incantatrice</span>}
      <button type="button" className="scheda-prepared-block react-prepared-button" onClick={() => window.schedaOpenPreparedMax?.(character.id)}><span className="scheda-prepared-label">Incantesimi preparati</span><strong>{prepared.size}</strong></button>
    </Section>
    <Section id={`${character.id}:spell-slots`} title="Slot Incantesimo">
      <div className="scheda-slots-table">{Object.entries(slots).sort(([a], [b]) => Number(a) - Number(b)).map(([level, raw]) => {
        const slot = raw as Record<string, any>; const max = Number(slot.max || 0); const current = Number(slot.current ?? max - Number(slot.used || 0));
        return <div className="scheda-slot-row" key={level}><span className="scheda-slot-level">Lv {level}</span><div className="scheda-slot-pips">{Array.from({ length: max }, (_, index) => <button type="button" aria-label={`Slot ${index + 1}`} className={`scheda-slot-pip ${index < current ? 'filled' : ''}`} key={index} onClick={() => window.schedaSlotToggleInline?.(character.id, Number(level), index)} />)}</div><span className="scheda-slot-count">{current}/{max}</span></div>;
      })}</div>
    </Section>
    <div className="scheda-spells-grid"><div className="scheda-spells-col scheda-spells-col-left">{levels.filter(level => level <= 4).map(level => <SpellLevel key={level} character={character} level={level} spells={byLevel.get(level) ?? []} prepared={prepared} />)}</div><div className="scheda-spells-col scheda-spells-col-right">{levels.filter(level => level > 4).map(level => <SpellLevel key={level} character={character} level={level} spells={byLevel.get(level) ?? []} prepared={prepared} />)}</div></div>
  </>;
}

function SpellLevel({ character, level, spells, prepared }: { character: CharacterData; level: number; spells: Record<string, any>[]; prepared: Set<string> }) {
  const title = level === 0 ? 'Trucchetti' : `Livello ${level}`;
  return <Section id={`${character.id}:spells:${level}`} title={title} action={<EditButton label={`Modifica ${title}`} onClick={() => window.schedaOpenSpellPicker?.(character.id, level)} />}>
    {!spells.length ? <span className="scheda-empty">Nessun incantesimo</span> : <div className="react-spell-list">{spells.sort((a, b) => spellName(a).localeCompare(spellName(b), 'it')).map(spell => {
      const name = spellName(spell); const isPrepared = prepared.has(name.toLowerCase());
      return <div className="react-spell-row" key={`${name}-${spell.source || ''}`}><button type="button" className="react-spell-name" onClick={() => window.schedaShowSpellDetail?.(name)}><strong>{name}</strong><span>{[spell.school || spell.scuola, spell.duration || spell.durata].filter(Boolean).join(' · ')}</span></button>{level > 0 && <button type="button" className={`react-prepare-toggle ${isPrepared ? 'active' : ''}`} onClick={() => window.schedaTogglePrepared?.(character.id, name)} aria-label={isPrepared ? 'Rimuovi dai preparati' : 'Prepara'}>✓</button>}</div>;
    })}</div>}
  </Section>;
}

function PrivilegesTab({ character, model }: { character: CharacterData; model: LegacySheetModel }) {
  const privileges = recordField(character, 'privilegi');
  const custom = privileges.custom_features && typeof privileges.custom_features === 'object' ? privileges.custom_features as Record<string, LegacyFeature[]> : {};
  const customOrder = Array.isArray(privileges.custom_tabs_order) ? privileges.custom_tabs_order.map(String) : ['Razza', 'Background'];
  return <>
    <Section id={`${character.id}:class-features`} title="Classe" defaultOpen={false}>{(model.classFeatures ?? []).map(group => <FeatureGroup key={group.className} title={group.className} features={group.features} />)}</Section>
    {(model.classFeatures ?? []).some(group => group.subFeatures?.length) && <Section id={`${character.id}:subclass-features`} title="Sottoclasse" defaultOpen={false}>{(model.classFeatures ?? []).filter(group => group.subFeatures?.length).map(group => <FeatureGroup key={`${group.className}-sub`} title={`${group.subclassName} (${group.className})`} features={group.subFeatures} />)}</Section>}
    <Section id={`${character.id}:race-features`} title="Razza" defaultOpen={false} action={<EditButton label="Aggiungi privilegio" onClick={() => window.privAddCustom?.('Razza')} />}><FeatureGroup title={raceLine(character)} features={[...(model.raceTraits ?? []), ...(custom.Razza ?? [])]} /></Section>
    <Section id={`${character.id}:background-features`} title="Background" defaultOpen={false} action={<EditButton label="Aggiungi privilegio" onClick={() => window.privAddCustom?.('Background')} />}><FeatureGroup title={String(character.background || '-')} features={[...(backgroundFeatures(model.background)), ...(custom.Background ?? [])]} /></Section>
    <Section id={`${character.id}:fighting-styles`} title={`Stili di Combattimento (${model.fightingStyles?.length || 0})`} defaultOpen={false} action={<EditButton label="Modifica stili" onClick={() => window.schedaOpenFightingStylesEdit?.(character.id)} />}><FeatureGroup features={model.fightingStyles ?? []} /></Section>
    {!!model.invocations?.length && <Section id={`${character.id}:invocations`} title={`Suppliche Occulte (${model.invocations.length})`} defaultOpen={false} action={<EditButton label="Modifica suppliche" onClick={() => window.schedaOpenInvocationsEdit?.(character.id)} />}><FeatureGroup features={model.invocations} /></Section>}
    <Section id={`${character.id}:feats`} title={`Talenti (${model.feats?.length || 0})`} defaultOpen={false} action={<EditButton label="Modifica talenti" onClick={() => window.schedaOpenTalentiEdit?.(character.id)} />}><FeatureGroup features={model.feats ?? []} /></Section>
    {customOrder.filter(name => name !== 'Razza' && name !== 'Background').map(name => <Section key={name} id={`${character.id}:custom:${name}`} title={name} defaultOpen={false} action={<EditButton label={`Modifica ${name}`} onClick={() => window.privOpenCustomTabEdit?.(name)} />}><FeatureGroup features={custom[name] ?? []} /></Section>)}
    <div className="priv-add-tab-wrap"><button className="btn-secondary priv-add-tab-btn" type="button" onClick={() => window.privAddTab?.()}><span className="priv-add-tab-plus">+</span> Nuova tabella</button></div>
  </>;
}

function MicroSheet({ character, model }: { character: CharacterData; model: LegacySheetModel }) {
  const slots = recordField(character, 'slot_incantesimo');
  return <div className="react-micro-sheet">
    <Statistics character={character} />
    <HitDice character={character} />
    <Resources character={character} model={model} />
    <Section id={`${character.id}:micro-slots`} title="Slot Incantesimo" action={<EditButton label="Configura slot" onClick={() => window.microOpenSlotConfig?.(character.id)} />}>
      <div className="scheda-slots-table">{Object.entries(slots).sort(([a], [b]) => Number(a) - Number(b)).map(([level, raw]) => {
        const slot = raw as Record<string, any>; const max = Number(slot.max || 0); const current = Number(slot.current ?? max - Number(slot.used || 0));
        return <div className="scheda-slot-row" key={level}><span className="scheda-slot-level">Lv {level}</span><div className="scheda-slot-pips">{Array.from({ length: max }, (_, index) => <button type="button" className={`scheda-slot-pip ${index < current ? 'filled' : ''}`} key={index} onClick={() => window.microSlotToggle?.(character.id, Number(level), index)} />)}</div><span className="scheda-slot-count">{current}/{max}</span></div>;
      })}</div>
    </Section>
  </div>;
}

function Section({ id, title, action, defaultOpen = true, children }: { id: string; title: string; action?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const stored = useCharacterSheetUiStore(state => state.openSections[id]);
  const setOpen = useCharacterSheetUiStore(state => state.setSectionOpen);
  const open = stored ?? defaultOpen;
  return <section className={`scheda-section ${open ? '' : 'collapsed'}`}>
    <div className="scheda-section-title"><button type="button" className="react-section-toggle" onClick={() => setOpen(id, !open)} aria-expanded={open}>{title}</button>{action}</div>
    {open && <div className="scheda-section-body">{children}</div>}
  </section>;
}

function FeatureGroup({ title, features }: { title?: string; features: LegacyFeature[] }) {
  return <div className="priv-subblock">{title && <div className="priv-subblock-title">{title}</div>}<div className="priv-feat-list-wrap">{features.length ? features.map((feature, index) => <details className="priv-feat-row" key={`${feature.name || feature.name_en}-${index}`}><summary className="priv-feat-header"><span className="priv-feat-level">{feature.level ? `Lv ${feature.level}` : '—'}</span><span className="priv-feat-name">{feature.name || feature.name_en || 'Privilegio'}</span><span className="priv-feat-arrow">⌄</span></summary><div className="priv-feat-body">{feature.description || feature.description_en || 'Nessuna descrizione.'}</div></details>) : <span className="scheda-empty">Nessun privilegio</span>}</div></div>;
}

function backgroundFeatures(background?: Record<string, any> | null): LegacyFeature[] {
  if (!background?.privilegio_nome) return [];
  return [{ name: background.privilegio_nome, description: background.privilegio_descrizione || '' }];
}

function CounterRow({ label, current, max, onChange, onEdit }: { label: string; current: number; max: number; onChange: (delta: number) => void; onEdit?: () => void }) {
  return <div className="scheda-hd-row">{onEdit ? <button type="button" className="scheda-hd-total scheda-hd-total-clickable" onClick={onEdit}>{label}</button> : <span className="scheda-hd-total">{label}</span>}<div className="scheda-hd-avail"><button className="scheda-hd-btn" type="button" onClick={() => onChange(-1)}>−</button><span className="scheda-hd-val">{current}</span><span className="scheda-hd-max">/ {max}</span><button className="scheda-hd-btn" type="button" onClick={() => onChange(1)}>+</button></div></div>;
}

function PortentRow({ label, values, max, onEdit, onSlot, onRoll }: { label: string; values: unknown[]; max: number; onEdit: () => void; onSlot: (index: number) => void; onRoll: () => void }) {
  return <div className="scheda-hd-row scheda-hd-row-portent">
    <button type="button" className="scheda-hd-total scheda-hd-total-clickable" onClick={onEdit}>{label}</button>
    <div className="scheda-hd-avail scheda-portent-slots">{Array.from({ length: max }, (_, index) => {
      const value = Number(values[index]);
      const filled = value >= 1 && value <= 20;
      return <button type="button" className={`scheda-portent-slot${filled ? ' filled' : ''}`} key={index} onClick={() => onSlot(index)} title="Imposta o usa Portento">{filled ? value : '—'}</button>;
    })}<button type="button" className="scheda-portent-roll" onClick={onRoll} title="Tira tutti i Portenti" aria-label="Tira tutti i Portenti">↻</button></div>
  </div>;
}

function StatBox({ label, value, onClick }: { label: string; value: ReactNode; onClick?: () => void }) {
  const content = <><div className="scheda-box-val">{value}</div><div className="scheda-box-label">{label}</div></>;
  return onClick ? <button type="button" className="scheda-box clickable" onClick={onClick}>{content}</button> : <div className="scheda-box">{content}</div>;
}

function HpBox({ label, value, className = '', onClick }: { label: string; value: number; className?: string; onClick: () => void }) {
  return <button type="button" className="scheda-hp-cell clickable" onClick={onClick}><div className={`scheda-hp-display ${className}`}>{value}</div><div className="scheda-hp-label">{label}</div></button>;
}

function CompactList({ label, values }: { label: string; values: string[] }) { return <div className="react-compact-list"><strong>{label}</strong><span>{values.length ? values.join(', ') : 'Nessuno'}</span></div>; }
function FilterChoices({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <fieldset className="react-filter-group"><legend>{title}</legend><div className="react-filter-options">{options.length ? options.map(option => <label className="react-filter-option" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} /><span>{option}</span></label>) : <span className="scheda-empty">Nessuna opzione</span>}</div></fieldset>;
}
function EditButton({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" className="scheda-edit-btn" title={label} aria-label={label} onClick={event => { event.stopPropagation(); onClick(); }}><Edit /></button>; }
function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>; }
function Edit() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>; }
function Search() { return <svg className="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>; }
function Sliders() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></svg>; }
