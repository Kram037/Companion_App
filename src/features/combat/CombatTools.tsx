import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import {
  activeCombatConditions,
  COMBAT_CONDITIONS,
  createCombatMonsters,
  createCombatTimer,
  createPlaceholderMonster,
  duplicateCombatMonster,
  fetchCombatMonsterSources,
  fetchCompendiumMonsterSources,
  removeCombatMonster,
  removeCombatTimer,
  updateCombatMonster,
  updateCombatMonsterCounter,
  type CombatCondition,
  type CombatMonsterDraft,
  type CombatMonsterSources,
  type CombatTimer,
  type CombatToolMonster,
} from '../../api/combatToolsApi';
import { SearchToolbar } from '../../components/SearchToolbar';
import type { HomebrewItem } from '../../types/domain';

const CONDITION_LABELS: Record<CombatCondition, string> = {
  concentrazione: 'Concentrazione',
  accecato: 'Accecato',
  affascinato: 'Affascinato',
  afferrato: 'Afferrato',
  assordato: 'Assordato',
  avvelenato: 'Avvelenato',
  incapacitato: 'Incapacitato',
  invisibile: 'Invisibile',
  paralizzato: 'Paralizzato',
  pietrificato: 'Pietrificato',
  privo_di_sensi: 'Privo di sensi',
  prono: 'Prono',
  spaventato: 'Spaventato',
  stordito: 'Stordito',
  trattenuto: 'Trattenuto',
};
const ASSET_BASE = import.meta.env.BASE_URL;

type ChangeCallback = () => void | Promise<void>;
type NotifyCallback = (message: string) => void;
type PickerSource = 'laboratory' | 'compendium';
type PickerKind = 'monsters' | 'encounters';
type PickerSelection = {
  key: string;
  origin: PickerSource;
  kind: PickerKind;
  source: HomebrewItem;
  quantity: number;
};
type PickerMonsterDraft = {
  key: string;
  groupKey: string;
  label: string;
  source: Record<string, unknown>;
};

export type CombatToolsProps = {
  campagnaId: string;
  sessioneId: string;
  currentUserId: string;
  homebrewUserId: string;
  isDm: boolean;
  playerCharacterId: string | null;
  playerCharacterName: string | null;
  monsters: CombatToolMonster[];
  openMonsterId?: string | null;
  onMonsterOpened?: () => void;
  onChanged: ChangeCallback;
  onNotify?: NotifyCallback;
};

export function CombatTools({
  campagnaId,
  sessioneId,
  currentUserId,
  homebrewUserId,
  isDm,
  playerCharacterId,
  playerCharacterName,
  monsters,
  openMonsterId,
  onMonsterOpened,
  onChanged,
  onNotify,
}: CombatToolsProps) {
  const [dialog, setDialog] = useState<'picker' | 'initiative' | 'create-monster' | 'create-timer' | null>(null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [sources, setSources] = useState<CombatMonsterSources | null>(null);
  const [compendiumMonsters, setCompendiumMonsters] = useState<HomebrewItem[] | null>(null);
  const [pickerSource, setPickerSource] = useState<PickerSource | null>(null);
  const [pickerKind, setPickerKind] = useState<PickerKind>('monsters');
  const [selection, setSelection] = useState<Record<string, PickerSelection>>({});
  const [confirmingMonster, setConfirmingMonster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedMonster = monsters.find(monster => monster.id === selectedMonsterId) ?? null;
  const pickerDrafts = expandPickerSelection(Object.values(selection));

  useEffect(() => {
    if (!openMonsterId) return;
    setDialog(null);
    setSelectedMonsterId(openMonsterId);
    onMonsterOpened?.();
  }, [onMonsterOpened, openMonsterId]);

  const run = async (action: () => Promise<unknown>, success: string, close?: () => void) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      await onChanged();
      if (success) onNotify?.(success);
      close?.();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const closeAll = () => {
    if (busy) return;
    setDialog(null);
    setSelectedMonsterId(null);
    setPickerSource(null);
    setPickerKind('monsters');
    setSelection({});
    setConfirmingMonster(false);
    setError('');
  };

  const openPickerSource = async (nextSource: PickerSource) => {
    if (busy) return;
    const loaded = nextSource === 'laboratory' ? Boolean(sources) : Boolean(compendiumMonsters);
    if (nextSource === pickerSource && loaded) return;
    setPickerSource(nextSource);
    setPickerKind('monsters');
    setError('');
    if (loaded) return;
    if (nextSource === 'laboratory' && !homebrewUserId) {
      setError('Catalogo del Laboratorio non disponibile');
      return;
    }
    setBusy(true);
    try {
      if (nextSource === 'laboratory') {
        setSources(await fetchCombatMonsterSources(homebrewUserId));
      } else {
        setCompendiumMonsters(await fetchCompendiumMonsterSources());
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const updatePickerQuantity = (origin: PickerSource, kind: PickerKind, source: HomebrewItem, quantity: number) => {
    const key = pickerSelectionKey(origin, kind, source.id);
    setSelection(current => {
      const next = { ...current };
      if (quantity <= 0) delete next[key];
      else next[key] = { key, origin, kind, source, quantity: Math.min(quantity, 99) };
      return next;
    });
  };

  return <>
    {isDm && <ToolButton label="Mostro" title="Gestisci mostri" onClick={() => {
      setDialog('picker');
      setPickerSource(null);
      setPickerKind('monsters');
      setSelection({});
      setError('');
    }} icon={<PlusIcon />} />}
    <ToolButton
      label="Timer"
      title="Nuovo timer"
      disabled={!currentUserId || (!isDm && !playerCharacterId)}
      onClick={() => setDialog('create-timer')}
      icon={<ClockIcon />}
    />

    {dialog === 'picker' && <MonsterPicker
      source={pickerSource}
      kind={pickerKind}
      sources={sources}
      compendiumMonsters={compendiumMonsters}
      selection={selection}
      busy={busy}
      error={error}
      onSource={source => void openPickerSource(source)}
      onKind={setPickerKind}
      onQuantity={updatePickerQuantity}
      onPlaceholder={() => {
        setDialog('create-monster');
        setError('');
      }}
      onConfirm={() => setDialog('initiative')}
      onClose={closeAll}
    />}

    {dialog === 'create-monster' && <PlaceholderForm
      busy={busy}
      error={error}
      onCancel={() => {
        setDialog('picker');
        setError('');
      }}
      onSubmit={input => run(
        () => createPlaceholderMonster({ campagnaId, sessioneId, ...input }),
        'Mostro aggiunto',
        closeAll,
      )}
    />}

    {dialog === 'initiative' && pickerDrafts.length > 0 && <InitiativeForm
      drafts={pickerDrafts}
      busy={busy}
      error={error}
      onBack={() => {
        setDialog('picker');
        setError('');
      }}
      onClose={closeAll}
      onSubmit={drafts => void run(
        () => createCombatMonsters({ campagnaId, sessioneId, drafts }),
        `${drafts.length} ${drafts.length === 1 ? 'mostro aggiunto' : 'mostri aggiunti'} al combattimento`,
        closeAll,
      )}
    />}

    {selectedMonster && <MonsterEditor
      monster={selectedMonster}
      busy={busy}
      error={error}
      onCancel={() => setSelectedMonsterId(null)}
      onSave={input => run(
        () => updateCombatMonster(selectedMonster.id, input),
        'Mostro aggiornato',
        () => setSelectedMonsterId(null),
      )}
      onDuplicate={() => run(
        () => duplicateCombatMonster(selectedMonster.id, sessioneId),
        'Mostro duplicato',
        () => setSelectedMonsterId(null),
      )}
      onCounterChange={(field, value) => void run(
        () => updateCombatMonsterCounter(selectedMonster.id, field, value),
        '',
      )}
      onRemove={() => setConfirmingMonster(true)}
    />}

    {confirmingMonster && selectedMonster && <ConfirmDelete
      message={`Rimuovere ${selectedMonster.nome} dal combattimento?`}
      busy={busy}
      onCancel={() => setConfirmingMonster(false)}
      onConfirm={() => void run(
        () => removeCombatMonster(selectedMonster.id),
        'Mostro rimosso',
        () => {
          setConfirmingMonster(false);
          setSelectedMonsterId(null);
        },
      )}
    />}

    {dialog === 'create-timer' && <TimerForm
      monsters={monsters}
      isDm={isDm}
      playerCharacterId={playerCharacterId}
      playerCharacterName={playerCharacterName}
      busy={busy}
      error={error}
      onCancel={closeAll}
      onSubmit={input => run(
        () => createCombatTimer({ campagnaId, sessioneId, createdBy: currentUserId, ...input }),
        'Timer avviato',
        closeAll,
      )}
    />}
  </>;
}

export type CombatTimersPanelProps = {
  timers: CombatTimer[];
  currentUserId: string;
  isDm: boolean;
  playerCharacterId: string | null;
  playerCharacterName: string | null;
  onChanged: ChangeCallback;
  onNotify?: NotifyCallback;
};

export function CombatTimersPanel({
  timers,
  currentUserId,
  isDm,
  playerCharacterId,
  playerCharacterName,
  onChanged,
  onNotify,
}: CombatTimersPanelProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const visible = timers.filter(timer => isDm
    || timer.target_kind === 'global'
    || (timer.target_kind === 'player' && timer.target_id === playerCharacterId));
  const confirmingTimer = visible.find(timer => timer.id === confirmingId);
  const openedTimer = visible.find(timer => timer.id === openedId);

  if (!visible.length) return null;

  const remove = async (timer: CombatTimer) => {
    if (removingId) return;
    setRemovingId(timer.id);
    setError('');
    try {
      await removeCombatTimer(timer.id);
      await onChanged();
      onNotify?.('Timer rimosso');
      setConfirmingId(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setRemovingId(null);
    }
  };

  return <div className="combat-timers-panel">
    <div className="combat-timers-list">
      {visible.map(timer => {
        const canRemove = isDm
          || (timer.created_by === currentUserId && timer.target_kind === 'player' && timer.target_id === playerCharacterId);
        const targetLabel = timerTargetLabel(timer, playerCharacterId, playerCharacterName);
        return <div className={`combat-timer-chip ${timer.remaining_rounds <= 1 ? 'is-low' : ''}`} key={timer.id}>
          <button className="combat-timer-open" type="button" onClick={() => setOpenedId(timer.id)} aria-label={`Dettagli timer ${timer.nome}`}>
            <span className="combat-timer-rounds">{timer.remaining_rounds}</span>
            <span className="combat-timer-info">
              <span className="combat-timer-name">{timer.nome}</span>
              <span className="combat-timer-meta">
                <span className="combat-timer-target">{targetLabel}</span>
                {timer.conditions.map(condition => <span className="combat-timer-cond" key={condition}>{CONDITION_LABELS[condition]}</span>)}
              </span>
            </span>
          </button>
          {canRemove && <button
            className="combat-timer-remove"
            type="button"
            disabled={removingId === timer.id}
            onClick={() => setConfirmingId(timer.id)}
            aria-label={`Rimuovi timer ${timer.nome}`}
          >×</button>}
        </div>;
      })}
    </div>
    <InlineError>{error}</InlineError>
    {openedTimer && <TimerDetails
      timer={openedTimer}
      targetLabel={timerTargetLabel(openedTimer, playerCharacterId, playerCharacterName)}
      onClose={() => setOpenedId(null)}
    />}
    {confirmingTimer && <ConfirmDelete
      message={`Rimuovere il timer "${confirmingTimer.nome}"?`}
      busy={Boolean(removingId)}
      onCancel={() => setConfirmingId(null)}
      onConfirm={() => void remove(confirmingTimer)}
    />}
  </div>;
}

function MonsterPicker({
  source,
  kind,
  sources,
  compendiumMonsters,
  selection,
  busy,
  error,
  onSource,
  onKind,
  onQuantity,
  onPlaceholder,
  onConfirm,
  onClose,
}: {
  source: PickerSource | null;
  kind: PickerKind;
  sources: CombatMonsterSources | null;
  compendiumMonsters: HomebrewItem[] | null;
  selection: Record<string, PickerSelection>;
  busy: boolean;
  error: string;
  onSource: (source: PickerSource) => void;
  onKind: (kind: PickerKind) => void;
  onQuantity: (origin: PickerSource, kind: PickerKind, source: HomebrewItem, quantity: number) => void;
  onPlaceholder: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(''), [kind, source]);

  const items = source === 'laboratory'
    ? (kind === 'monsters' ? sources?.monsters : sources?.encounters)
    : source === 'compendium' && kind === 'monsters'
      ? compendiumMonsters
      : [];
  const query = normalizeSourceSearch(search);
  const visibleItems = (items ?? []).filter(item => !query || normalizeSourceSearch(pickerSearchText(item, kind)).includes(query));
  const selectedCount = expandPickerSelection(Object.values(selection)).length;
  const loaded = source === 'laboratory' ? Boolean(sources) : source === 'compendium' ? Boolean(compendiumMonsters) : true;

  return <Modal
    title="Aggiungi mostri"
    className={source ? 'modal-content-lg combat-picker-modal' : 'placeholder-modal-content combat-picker-source-modal'}
    onClose={onClose}
  >
    <div className="combat-picker-body">
      <div className="lab-subtabs combat-picker-source-tabs" role="tablist" aria-label="Origine mostri">
        <button className={`lab-subtab combat-picker-source-tab ${source === 'laboratory' ? 'active' : ''}`} type="button" role="tab" aria-selected={source === 'laboratory'} disabled={busy} onClick={() => onSource('laboratory')}>
          <img className="lab-subtab-icon-img" src={`${ASSET_BASE}images/Toolbar/Laboratorio.svg`} alt="" />
          <span>Laboratorio</span>
        </button>
        <button className={`lab-subtab combat-picker-source-tab ${source === 'compendium' ? 'active' : ''}`} type="button" role="tab" aria-selected={source === 'compendium'} disabled={busy} onClick={() => onSource('compendium')}>
          <img className="lab-subtab-icon-img" src={`${ASSET_BASE}images/Toolbar/Compendio-toolbar-20260521.svg`} alt="" />
          <span>Compendio</span>
        </button>
        <button className="lab-subtab combat-picker-placeholder-tab" type="button" aria-label="Placeholder" title="Crea placeholder" disabled={busy} onClick={onPlaceholder}>
          <PlaceholderIcon />
        </button>
      </div>

      {!source && <p className="monster-quickadd-sub combat-picker-hint">Scegli da dove aggiungere i mostri.</p>}
      {source && <>
        <div className="lab-subtabs comp-inner-tabs" role="tablist" aria-label="Tipo contenuto">
          <button className={`lab-subtab ${kind === 'monsters' ? 'active' : ''}`} type="button" role="tab" aria-selected={kind === 'monsters'} onClick={() => onKind('monsters')}>Mostri</button>
          <button className={`lab-subtab ${kind === 'encounters' ? 'active' : ''}`} type="button" role="tab" aria-selected={kind === 'encounters'} onClick={() => onKind('encounters')}>Combattimenti</button>
        </div>
        {kind === 'encounters' && source === 'compendium'
          ? <div className="content-placeholder"><p>I combattimenti del Compendio saranno disponibili in un prossimo aggiornamento.</p></div>
          : <>
            <SearchToolbar value={search} onChange={setSearch} placeholder={kind === 'monsters' ? 'Cerca mostro...' : 'Cerca combattimento...'} ariaLabel={kind === 'monsters' ? 'Cerca mostro' : 'Cerca combattimento'} />
            <div className="wizard-page-scroll combat-picker-scroll">
              {!loaded && busy ? <div className="content-placeholder"><p>Caricamento...</p></div> : <div className={source === 'laboratory' ? 'lab-list combat-picker-list' : 'comp-list combat-picker-list'}>
                {visibleItems.map(item => {
                  const key = pickerSelectionKey(source, kind, item.id);
                  return <PickerCard
                    origin={source}
                    kind={kind}
                    source={item}
                    quantity={selection[key]?.quantity ?? 0}
                    busy={busy}
                    onQuantity={quantity => onQuantity(source, kind, item, quantity)}
                    key={key}
                  />;
                })}
                {loaded && !visibleItems.length && <div className="content-placeholder"><p>Nessun elemento trovato.</p></div>}
              </div>}
            </div>
          </>}
      </>}
      <InlineError>{error}</InlineError>
      {selectedCount > 0 && <button className="btn-fab combat-picker-confirm" type="button" disabled={busy} onClick={onConfirm} aria-label="Conferma selezione" title={`Conferma ${selectedCount} mostri`}>
        <CheckIcon />
      </button>}
    </div>
  </Modal>;
}

function PickerCard({
  origin,
  kind,
  source,
  quantity,
  busy,
  onQuantity,
}: {
  origin: PickerSource;
  kind: PickerKind;
  source: HomebrewItem;
  quantity: number;
  busy: boolean;
  onQuantity: (quantity: number) => void;
}) {
  const encounterCount = kind === 'encounters' ? encounterMonsterCount(source) : 1;
  const selectable = encounterCount > 0;
  const className = origin === 'laboratory'
    ? `lab-card combat-picker-card ${quantity ? 'is-selected' : ''}`
    : `comp-card comp-monster-card combat-picker-card ${quantity ? 'is-selected' : ''}`;

  return <article className={className} data-source-id={source.id}>
    <input
      className="combat-picker-checkbox"
      type="checkbox"
      checked={quantity > 0}
      disabled={busy || !selectable}
      onChange={() => onQuantity(quantity > 0 ? 0 : 1)}
      aria-label={`Seleziona ${source.nome}`}
    />
    {origin === 'laboratory' && <div className="lab-card-icon"><img className="lab-card-icon-img" src={`${ASSET_BASE}images/Tabs/Mostri%20e%20Combattimenti.svg`} alt="" /></div>}
    {origin === 'laboratory'
      ? <div className="lab-card-info combat-picker-card-content">
        <p className="lab-card-name">{source.nome}</p>
        <p className="lab-card-detail">{kind === 'monsters' ? monsterSourceSubtitle(source) : encounterSourceSubtitle(source)}</p>
      </div>
      : <div className="combat-picker-card-content">
        <div className="comp-card-main"><h2 className="comp-card-title">{source.nome}</h2><span className="comp-monster-gs">GS {sourceText(source, 'grado_sfida', '-')}</span></div>
        <div className="comp-monster-card-meta"><span>{sourceText(source, 'tipo', 'Mostro')}</span><span>{sourceText(source, 'allineamento_breve', sourceText(source, 'fonte_breve', 'Compendio'))}</span></div>
      </div>}
    <QuantityStepper name={source.nome} value={quantity} disabled={busy || !selectable} onChange={onQuantity} />
  </article>;
}

function QuantityStepper({ name, value, disabled, onChange }: { name: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  return <div className="lab-sub-count-stepper combat-picker-stepper">
    <button className="lab-sub-count-btn" type="button" disabled={disabled || value === 0} onClick={() => onChange(value - 1)} aria-label={`Riduci quantità ${name}`}>−</button>
    <output className="lab-sub-count-val" aria-label={`Quantità ${name}`}>{value}</output>
    <button className="lab-sub-count-btn" type="button" disabled={disabled || value >= 99} onClick={() => onChange(value + 1)} aria-label={`Aumenta quantità ${name}`}>+</button>
  </div>;
}

function InitiativeForm({
  drafts,
  busy,
  error,
  onBack,
  onClose,
  onSubmit,
}: {
  drafts: PickerMonsterDraft[];
  busy: boolean;
  error: string;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (drafts: CombatMonsterDraft[]) => void;
}) {
  const [mode, setMode] = useState<'individual' | 'group'>('individual');
  const rows = initiativeRows(drafts, mode);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit(drafts.map(draft => {
      const field = mode === 'group' ? draft.groupKey : draft.key;
      const raw = String(data.get(field) ?? '').trim();
      return {
        source: draft.source,
        initiative: raw ? Number(raw) : undefined,
        initiativeGroup: mode === 'group' ? draft.groupKey : undefined,
      };
    }));
  };

  return <Modal title="Iniziativa mostri" className="modal-content-lg combat-initiative-modal" onClose={onClose}>
    <form onSubmit={submit}>
      <div className="lab-subtabs comp-inner-tabs" role="tablist" aria-label="Modalità iniziativa">
        <button className={`lab-subtab ${mode === 'individual' ? 'active' : ''}`} type="button" role="tab" aria-selected={mode === 'individual'} onClick={() => setMode('individual')}>Tiri singoli</button>
        <button className={`lab-subtab ${mode === 'group' ? 'active' : ''}`} type="button" role="tab" aria-selected={mode === 'group'} onClick={() => setMode('group')}>Tiro di gruppo</button>
      </div>
      <p className="monster-quickadd-sub">Inserisci i risultati totali. I campi vuoti saranno tirati automaticamente.</p>
      <div className="wizard-page-scroll combat-initiative-list">
        {rows.map((row, index) => <label className="combat-initiative-row" key={row.key}>
          <span>{row.label}{row.count > 1 ? ` × ${row.count}` : ''}</span>
          <input name={row.key} type="number" min="-100" max="100" placeholder="Auto" aria-label={`Iniziativa ${row.label}`} autoFocus={index === 0} />
        </label>)}
      </div>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <button className="btn-secondary" type="button" disabled={busy} onClick={onBack}>Indietro</button>
        <button className="btn-primary" type="submit" disabled={busy}>Aggiungi {drafts.length}</button>
      </div>
    </form>
  </Modal>;
}

function PlaceholderForm({
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (input: { nome: string; hpMax: number; armorClass: number; initiative?: number }) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const initiative = String(data.get('initiative') ?? '').trim();
    onSubmit({
      nome: String(data.get('nome') ?? ''),
      hpMax: Number(data.get('hpMax')),
      armorClass: Number(data.get('armorClass')),
      initiative: initiative ? Number(initiative) : undefined,
    });
  };

  return <Modal title="Nuovo placeholder" onClose={onCancel}>
    <form onSubmit={submit}>
      <div className="form-group"><label htmlFor="combat-placeholder-name">Nome</label><input id="combat-placeholder-name" name="nome" maxLength={80} required autoFocus /></div>
      <div className="form-row">
        <div className="form-group"><label htmlFor="combat-placeholder-hp">Punti vita</label><input id="combat-placeholder-hp" name="hpMax" type="number" min="1" defaultValue="10" required /></div>
        <div className="form-group"><label htmlFor="combat-placeholder-ca">Classe armatura</label><input id="combat-placeholder-ca" name="armorClass" type="number" min="1" defaultValue="10" required /></div>
      </div>
      <div className="form-group"><label htmlFor="combat-placeholder-init">Iniziativa (opzionale)</label><input id="combat-placeholder-init" name="initiative" type="number" /></div>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <button className="btn-secondary" type="button" disabled={busy} onClick={onCancel}>Annulla</button>
        <button className="btn-primary" type="submit" disabled={busy}>Aggiungi</button>
      </div>
    </form>
  </Modal>;
}

function MonsterEditor({
  monster,
  busy,
  error,
  onCancel,
  onSave,
  onDuplicate,
  onCounterChange,
  onRemove,
}: {
  monster: CombatToolMonster;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSave: (input: { hp: number; hpMax: number; armorClass: number; exhaustion: number; conditions: CombatCondition[] }) => void;
  onDuplicate: () => void;
  onCounterChange: (field: 'res_legg_attuali' | 'azioni_legg_attuali', value: number) => void;
  onRemove: () => void;
}) {
  const hpMax = monster.punti_vita_max ?? monster.pv_attuali ?? 10;
  const saves = stringArray(monster.tiri_salvezza);
  const skills = stringArray(monster.competenze_abilita);
  const expertSkills = new Set(stringArray(monster.maestrie_abilita));
  const attacks = monsterActions(monster.attacchi);
  const legendaryActions = monsterActions(monster.azioni_leggendarie);
  const slots = monsterSpellSlots(monster.slot_incantesimo);
  const proficiency = Math.max(2, Math.floor((Number.parseFloat(monster.grado_sfida ?? '0') - 1) / 4) + 2);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextHpMax = Number(data.get('hpMax'));
    onSave({
      hp: Math.min(Number(data.get('hp')), nextHpMax),
      hpMax: nextHpMax,
      armorClass: Number(data.get('armorClass')),
      exhaustion: Number(data.get('exhaustion')),
      conditions: readConditions(data),
    });
  };

  return <Modal title={monster.nome} className="modal-content-lg combat-monster-editor" onClose={onCancel}>
    <form onSubmit={submit}>
      {!monster.is_placeholder && <p className="monster-quickadd-sub">{monster.tipologia || 'Mostro'} · {monster.taglia || 'Media'} · GS {monster.grado_sfida || '0'}</p>}
      <div className="scheda-three-boxes placeholder-boxes">
        <label className="scheda-box"><input className="scheda-box-input" name="armorClass" type="number" min="1" defaultValue={monster.classe_armatura ?? 10} required /><span className="scheda-box-label">CA</span></label>
        <label className="scheda-box"><input className="scheda-box-input" name="hp" type="number" min="0" defaultValue={monster.pv_attuali ?? hpMax} required /><span className="scheda-box-label">PV</span></label>
        <label className="scheda-box"><input className="scheda-box-input" name="hpMax" type="number" min="1" defaultValue={hpMax} required /><span className="scheda-box-label">PV Max</span></label>
      </div>
      {!monster.is_placeholder && <>
        <div className="combat-abilities-grid">
          {MONSTER_ABILITIES.map(ability => {
            const score = monster[ability.key] ?? 10;
            const save = abilityModifier(score) + (saves.includes(ability.key) ? proficiency : 0);
            return <div className="combat-ability" key={ability.key}>
              <span className="combat-ability-label">{ability.label}</span>
              <span className="combat-ability-val">{score}</span>
              <span className="combat-ability-mod">{signed(abilityModifier(score))}</span>
              <span className={`combat-ability-save-mini ${saves.includes(ability.key) ? 'prof' : ''}`}>TS {signed(save)}</span>
            </div>;
          })}
        </div>
        {skills.length > 0 && <MonsterTags title="Competenze" values={skills.map(skill => `${skill}${expertSkills.has(skill) ? ' ★' : ''}`)} />}
        {attacks.length > 0 && <div className="combat-monster-section">
          <div className="combat-section-label">Azioni</div>
          <div className="monster-attacks-list">{attacks.map((attack, index) => <div className="monster-attack-row" key={`${attack.nome}-${index}`}>
            <span className="monster-attack-name">{attack.nome}</span>
            <span className="monster-attack-hit">{attack.bonus}</span>
            <span className="monster-attack-dmg">{attack.danno}</span>
            {attack.usiMax > 0 && <span className="monster-action-uses">{Array.from({ length: attack.usiMax }, (_, use) => <span className={`monster-action-use-pip ${use < attack.usiAttuali ? 'filled' : ''}`} key={use} />)}</span>}
            {attack.descrizione && <span className="monster-attack-description">{attack.descrizione}</span>}
          </div>)}</div>
        </div>}
        {(monster.resistenze_leggendarie ?? 0) > 0 && <ResourceCounter
          label="Resistenze leggendarie"
          current={monster.res_legg_attuali ?? monster.resistenze_leggendarie ?? 0}
          max={monster.resistenze_leggendarie ?? 0}
          busy={busy}
          onChange={value => onCounterChange('res_legg_attuali', value)}
        />}
        {(monster.azioni_legg_max ?? 0) > 0 && <ResourceCounter
          label="Azioni leggendarie"
          current={monster.azioni_legg_attuali ?? monster.azioni_legg_max ?? 0}
          max={monster.azioni_legg_max ?? 0}
          busy={busy}
          onChange={value => onCounterChange('azioni_legg_attuali', value)}
        />}
        {legendaryActions.length > 0 && <div className="monster-legg-list">{legendaryActions.map((action, index) => <div className="monster-legg-row" key={`${action.nome}-${index}`}>
          <span className="monster-legg-name">{action.nome}</span>
          {action.descrizione && <span className="monster-legg-desc">{action.descrizione}</span>}
        </div>)}</div>}
        <MonsterTags title="Resistenze" values={stringArray(monster.resistenze)} />
        <MonsterTags title="Immunità" values={stringArray(monster.immunita)} />
        {slots.length > 0 && <div className="combat-monster-section">
          <div className="combat-section-label">Incantesimi</div>
          <div className="scheda-slots-table">{slots.map(slot => <div className="scheda-slot-row" key={slot.level}>
            <span className="scheda-slot-level">Lv {slot.level}</span>
            <div className="scheda-slot-pips">{Array.from({ length: slot.max }, (_, index) => <span className={`scheda-slot-pip ${index < slot.current ? 'filled' : ''}`} key={index} />)}</div>
            <span className="scheda-slot-count">{slot.current}/{slot.max}</span>
          </div>)}</div>
        </div>}
      </>}
      <div className="combat-section-label combat-section-label-spaced">Condizioni</div>
      <div className="pg-conditions-grid">
        {COMBAT_CONDITIONS.map(condition => <label className="pg-condition-item" key={condition}>
          <input name="conditions" value={condition} type="checkbox" defaultChecked={activeCombatConditions(monster).includes(condition)} />
          {CONDITION_LABELS[condition]}
        </label>)}
      </div>
      <div className="pg-exhaustion-row">
        <label htmlFor={`combat-monster-exhaustion-${monster.id}`}>Esaustione</label>
        <input id={`combat-monster-exhaustion-${monster.id}`} name="exhaustion" type="number" min="0" max="6" defaultValue={monster.esaustione ?? 0} />
      </div>
      <InlineError>{error}</InlineError>
      <div className="combat-monster-actions-stack">
        <button className="btn-primary" type="submit" disabled={busy}>Salva</button>
        <div className="combat-monster-actions-row">
          <button className="btn-secondary" type="button" disabled={busy} onClick={onDuplicate}>Duplica</button>
          <button className="btn-danger" type="button" disabled={busy} onClick={onRemove}>Rimuovi</button>
        </div>
      </div>
    </form>
  </Modal>;
}

const MONSTER_ABILITIES = [
  { key: 'forza', label: 'FOR' },
  { key: 'destrezza', label: 'DES' },
  { key: 'costituzione', label: 'COS' },
  { key: 'intelligenza', label: 'INT' },
  { key: 'saggezza', label: 'SAG' },
  { key: 'carisma', label: 'CAR' },
] as const;

function MonsterTags({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return <div className="combat-monster-section">
    <div className="combat-section-label">{title}</div>
    <div className="scheda-tags">{values.map(value => <span className="scheda-tag" key={value}>{value}</span>)}</div>
  </div>;
}

function ResourceCounter({
  label,
  current,
  max,
  busy,
  onChange,
}: {
  label: string;
  current: number;
  max: number;
  busy: boolean;
  onChange: (value: number) => void;
}) {
  return <div className="combat-monster-section">
    <div className="combat-section-label">{label}</div>
    <div className="monster-res-legg-counter">
      {Array.from({ length: max }, (_, index) => <button
        className={`monster-res-legg-pip ${index < current ? 'filled' : ''}`}
        type="button"
        disabled={busy}
        aria-label={`${label}: ${index + 1}`}
        onClick={() => onChange(index < current ? index : index + 1)}
        key={index}
      />)}
      <span className="monster-res-legg-label">{current}/{max}</span>
    </div>
  </div>;
}

function TimerForm({
  monsters,
  isDm,
  playerCharacterId,
  playerCharacterName,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  monsters: CombatToolMonster[];
  isDm: boolean;
  playerCharacterId: string | null;
  playerCharacterName: string | null;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (input: {
    nome: string;
    targetKind: 'monster' | 'player' | 'global';
    targetId: string | null;
    targetName: string | null;
    conditions: CombatCondition[];
    rounds: number;
  }) => void;
}) {
  const [target, setTarget] = useState(isDm ? 'global' : `player:${playerCharacterId ?? ''}`);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const monsterId = target.startsWith('monster:') ? target.slice('monster:'.length) : null;
    const monster = monsters.find(item => item.id === monsterId);
    const targetKind = isDm ? (monster ? 'monster' : 'global') : 'player';
    onSubmit({
      nome: String(data.get('nome') ?? ''),
      targetKind,
      targetId: targetKind === 'global' ? null : monster?.id ?? playerCharacterId,
      targetName: monster?.nome ?? (targetKind === 'player' ? playerCharacterName : null),
      conditions: targetKind === 'global' ? [] : readConditions(data),
      rounds: Number(data.get('rounds')),
    });
  };

  return <Modal title="Nuovo timer" className="combat-timer-modal" onClose={onCancel}>
    <form onSubmit={submit}>
      <div className="combat-timer-form">
        <div className="combat-timer-field"><label htmlFor="combat-timer-name">Nome</label><input id="combat-timer-name" name="nome" type="text" maxLength={60} required autoFocus /></div>
        <div className="combat-timer-field"><label htmlFor="combat-timer-rounds">Durata</label><div className="combat-timer-duration-row"><input id="combat-timer-rounds" name="rounds" type="number" min="1" max="9999" defaultValue="10" required /><span className="combat-timer-duration-suffix">round</span></div></div>
        {isDm && <div className="combat-timer-field"><label htmlFor="combat-timer-target">Target</label><select id="combat-timer-target" className="combat-timer-select" value={target} onChange={event => setTarget(event.target.value)}>
          <option value="global">Globale</option>
          {monsters.map(monster => <option value={`monster:${monster.id}`} key={monster.id}>{monster.nome}</option>)}
        </select></div>}
        <div className="combat-timer-field">
          <label>Condizioni <span className="combat-timer-field-hint">(opzionali)</span></label>
          <div className="combat-timer-conditions">
            {COMBAT_CONDITIONS.map(condition => <label className="combat-timer-cond-chip" key={condition}>
              <input name="conditions" value={condition} type="checkbox" disabled={target === 'global'} />
              <span>{CONDITION_LABELS[condition]}</span>
            </label>)}
          </div>
        </div>
      </div>
      <InlineError>{error}</InlineError>
      <div className="combat-timer-actions">
        <button className="btn-secondary btn-small" type="button" disabled={busy} onClick={onCancel}>Annulla</button>
        <button className="btn-primary btn-small" type="submit" disabled={busy}>Avvia</button>
      </div>
    </form>
  </Modal>;
}

function TimerDetails({ timer, targetLabel, onClose }: {
  timer: CombatTimer;
  targetLabel: string;
  onClose: () => void;
}) {
  return <Modal title={timer.nome} className="combat-timer-modal" onClose={onClose}>
    <dl className="combat-timer-details">
      <div><dt>Target</dt><dd>{targetLabel}</dd></div>
      <div><dt>Tipo</dt><dd>{timer.target_kind === 'global' ? 'Globale' : timer.target_kind === 'player' ? 'Personaggio' : 'Mostro'}</dd></div>
      <div><dt>Durata</dt><dd>{timer.duration_rounds} round</dd></div>
      <div><dt>Rimanenti</dt><dd>{timer.remaining_rounds} round</dd></div>
      <div><dt>Condizioni</dt><dd>{timer.conditions.length ? timer.conditions.map(condition => CONDITION_LABELS[condition]).join(', ') : 'Nessuna'}</dd></div>
    </dl>
  </Modal>;
}

function Modal({
  title,
  className = 'placeholder-modal-content',
  onClose,
  children,
}: {
  title: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };
  return createPortal(<div className="modal active" role="dialog" aria-modal="true" aria-label={title} onMouseDown={closeFromBackdrop}>
    <div className={`modal-content ${className}`}>
      <button className="modal-close" type="button" onClick={onClose} aria-label="Chiudi">×</button>
      <h2 className="placeholder-title">{title}</h2>
      {children}
    </div>
  </div>, document.body);
}

function ToolButton({ label, icon, ...props }: { label: string; icon: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="combat-toolbar-btn" type="button" {...props}>{icon}<span>{label}</span></button>;
}

function InlineError({ children }: { children: string }) {
  return children ? <p className="modal-footer-text" role="alert">{children}</p> : null;
}

function ConfirmDelete({
  message,
  busy,
  onCancel,
  onConfirm,
}: {
  message: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return <Modal title="Conferma" onClose={onCancel}>
    <p>{message}</p>
    <div className="form-actions">
      <button className="btn-secondary" type="button" disabled={busy} onClick={onCancel}>Annulla</button>
      <button className="btn-danger" type="button" disabled={busy} onClick={onConfirm}>Rimuovi</button>
    </div>
  </Modal>;
}

function readConditions(data: FormData): CombatCondition[] {
  const values = new Set(data.getAll('conditions').map(String));
  return COMBAT_CONDITIONS.filter(condition => values.has(condition));
}

export function timerTargetLabel(timer: CombatTimer, playerCharacterId: string | null, playerCharacterName: string | null) {
  if (timer.target_name) return timer.target_name;
  if (timer.target_kind === 'global') return 'Globale';
  if (timer.target_kind === 'player' && timer.target_id === playerCharacterId && playerCharacterName) return playerCharacterName;
  return 'Target sconosciuto';
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function monsterActions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const action = objectValue(item);
    if (!action) return [];
    const nome = sourceText(action, 'nome', '').trim();
    if (!nome) return [];
    const usiMax = safeCount(action.usi_max);
    return [{
      nome,
      bonus: sourceText(action, 'bonus', ''),
      danno: sourceText(action, 'danno', ''),
      descrizione: sourceText(action, 'descrizione', ''),
      usiMax,
      usiAttuali: Math.min(safeCount(action.usi_attuali, usiMax), usiMax),
    }];
  });
}

function monsterSpellSlots(value: unknown) {
  const slots = objectValue(value);
  if (!slots) return [];
  return Object.entries(slots).flatMap(([level, entry]) => {
    const slot = objectValue(entry);
    if (!slot) return [];
    const max = safeCount(slot.max);
    if (!max) return [];
    return [{ level, max, current: Math.min(safeCount(slot.current, max), max) }];
  }).sort((left, right) => Number(left.level) - Number(right.level));
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function safeCount(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, 100) : fallback;
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function sourceText(source: Record<string, unknown>, key: string, fallback: string) {
  const value = source[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function monsterSourceSubtitle(source: HomebrewItem) {
  return `${sourceText(source, 'tipo', 'Mostro')} · GS ${sourceText(source, 'grado_sfida', '0')} · PV ${sourceText(source, 'punti_vita_max', sourceText(source, 'punti_ferita', '?'))}`;
}

function compendiumMonsterSearchText(source: HomebrewItem) {
  return ['nome', 'nome_en', 'tipo', 'grado_sfida', 'fonte', 'fonte_breve'].map(key => sourceText(source, key, '')).join(' ');
}

function normalizeSourceSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').trim();
}

function pickerSelectionKey(origin: PickerSource, kind: PickerKind, id: string) {
  return `${origin}:${kind}:${id}`;
}

function pickerSearchText(source: HomebrewItem, kind: PickerKind) {
  if (kind === 'monsters') return compendiumMonsterSearchText(source);
  return `${source.nome} ${encounterMonsterEntries(source).map(entry => sourceText(entry.source, 'nome', '')).join(' ')}`;
}

function expandPickerSelection(selections: PickerSelection[]): PickerMonsterDraft[] {
  return selections.flatMap(selection => {
    if (selection.kind === 'monsters') {
      return Array.from({ length: selection.quantity }, (_, index) => ({
        key: `${selection.key}:${index}`,
        groupKey: `${selection.origin}:${selection.source.id}`,
        label: selection.source.nome,
        source: selection.source,
      }));
    }
    const entries = encounterMonsterEntries(selection.source);
    return Array.from({ length: selection.quantity }, (_, repetition) => entries.map((entry, index) => ({
      key: `${selection.key}:${repetition}:${index}`,
      groupKey: `${selection.origin}:${entry.sourceId}`,
      label: sourceText(entry.source, 'nome', 'Mostro'),
      source: entry.source,
    }))).flat();
  });
}

function initiativeRows(drafts: PickerMonsterDraft[], mode: 'individual' | 'group') {
  if (mode === 'individual') {
    return drafts.map((draft, index) => ({ key: draft.key, label: `${index + 1}. ${draft.label}`, count: 1 }));
  }
  const groups = new Map<string, { key: string; label: string; count: number }>();
  for (const draft of drafts) {
    const row = groups.get(draft.groupKey);
    if (row) row.count += 1;
    else groups.set(draft.groupKey, { key: draft.groupKey, label: draft.label, count: 1 });
  }
  return [...groups.values()];
}

function encounterMonsterEntries(source: HomebrewItem) {
  const values = Array.isArray(source.mostri) ? source.mostri : [];
  return values.flatMap((value, index) => {
    const record = objectValue(value);
    const snapshot = objectValue(record?.snapshot) ?? record;
    if (!snapshot || !sourceText(snapshot, 'nome', '').trim()) return [];
    const fallback = sourceText(snapshot, 'id', `${source.id}:${index}`);
    return [{ source: snapshot, sourceId: record ? sourceText(record, 'source_id', fallback) : fallback }];
  });
}

function encounterMonsterCount(source: HomebrewItem) {
  return encounterMonsterEntries(source).length;
}

function encounterSourceSubtitle(source: HomebrewItem) {
  const entries = encounterMonsterEntries(source);
  if (!entries.length) return 'Nessun mostro';
  const names = entries.slice(0, 3).map(entry => sourceText(entry.source, 'nome', 'Mostro')).join(', ');
  return `${entries.length} ${entries.length === 1 ? 'mostro' : 'mostri'} · ${names}${entries.length > 3 ? ` +${entries.length - 3}` : ''}`;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>;
}

function PlaceholderIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0M19 5v6M16 8h6" /></svg>;
}
