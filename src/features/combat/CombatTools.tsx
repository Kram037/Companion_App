import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';

import {
  activeCombatConditions,
  COMBAT_CONDITIONS,
  createCombatTimer,
  createCombatMonsterFromSource,
  createPlaceholderMonster,
  duplicateCombatMonster,
  fetchCombatMonsterSources,
  importCombatEncounter,
  removeCombatMonster,
  removeCombatTimer,
  updateCombatMonster,
  updateCombatMonsterCounter,
  type CombatCondition,
  type CombatMonsterSources,
  type CombatTimer,
  type CombatToolMonster,
} from '../../api/combatToolsApi';
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

type ChangeCallback = () => void | Promise<void>;
type NotifyCallback = (message: string) => void;

export type CombatToolsProps = {
  campagnaId: string;
  sessioneId: string;
  currentUserId: string;
  homebrewUserId: string;
  isDm: boolean;
  playerCharacterId: string | null;
  monsters: CombatToolMonster[];
  openMonsterId?: string | null;
  onMonsterOpened?: () => void;
  onChanged: ChangeCallback;
  onOpenLaboratory?: () => void;
  onNotify?: NotifyCallback;
};

export function CombatTools({
  campagnaId,
  sessioneId,
  currentUserId,
  homebrewUserId,
  isDm,
  playerCharacterId,
  monsters,
  openMonsterId,
  onMonsterOpened,
  onChanged,
  onOpenLaboratory,
  onNotify,
}: CombatToolsProps) {
  const [dialog, setDialog] = useState<'monsters' | 'add-monster' | 'create-monster' | 'homebrew' | 'encounters' | 'create-timer' | null>(null);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<HomebrewItem | null>(null);
  const [sources, setSources] = useState<CombatMonsterSources | null>(null);
  const [confirmingMonster, setConfirmingMonster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedMonster = monsters.find(monster => monster.id === selectedMonsterId) ?? null;

  useEffect(() => {
    if (!openMonsterId) return;
    setDialog('monsters');
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
    setSelectedSource(null);
    setConfirmingMonster(false);
    setError('');
  };

  const openSources = async (nextDialog: 'homebrew' | 'encounters') => {
    if (busy || !homebrewUserId) return;
    setBusy(true);
    setError('');
    try {
      setSources(sources ?? await fetchCombatMonsterSources(homebrewUserId));
      setDialog(nextDialog);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return <>
    {isDm && <ToolButton label="Mostro" title="Gestisci mostri" onClick={() => setDialog('monsters')} icon={<PlusIcon />} />}
    <ToolButton
      label="Timer"
      title="Nuovo timer"
      disabled={!currentUserId || (!isDm && !playerCharacterId)}
      onClick={() => setDialog('create-timer')}
      icon={<ClockIcon />}
    />

    {dialog === 'monsters' && !selectedMonster && <Modal title="Mostri" onClose={closeAll}>
      <div className="monster-hb-list">
        {monsters.map(monster => <button className="monster-hb-item" type="button" key={monster.id} onClick={() => setSelectedMonsterId(monster.id)}>
          <span className="monster-hb-info">
            <span className="monster-hb-name">{monster.nome}</span>
            <span className="monster-hb-sub">PV {monster.pv_attuali ?? monster.punti_vita_max ?? 0}/{monster.punti_vita_max ?? 0} · CA {monster.classe_armatura ?? 10}</span>
          </span>
          <span className="monster-hb-arrow" aria-hidden="true">›</span>
        </button>)}
        {!monsters.length && <div className="content-placeholder"><p>Nessun mostro nel combattimento.</p></div>}
      </div>
      <div className="form-actions">
        <button className="btn-secondary" type="button" onClick={closeAll}>Chiudi</button>
        <button className="btn-primary" type="button" onClick={() => setDialog('add-monster')}>Aggiungi</button>
      </div>
      <InlineError>{error}</InlineError>
    </Modal>}

    {dialog === 'add-monster' && <Modal title="Aggiungi mostro" onClose={closeAll}>
      <div className="monster-choice-grid">
        <button className="monster-choice-card" type="button" onClick={() => setDialog('create-monster')}>
          <span className="monster-choice-icon" aria-hidden="true">👤</span>
          <span className="monster-choice-label">Placeholder</span>
          <span className="monster-choice-desc">Solo nome, PV e CA</span>
        </button>
        <button className="monster-choice-card" type="button" disabled={busy} onClick={() => void openSources('homebrew')}>
          <span className="monster-choice-icon" aria-hidden="true">📖</span>
          <span className="monster-choice-label">Da Homebrew</span>
          <span className="monster-choice-desc">Importa dal Laboratorio</span>
        </button>
        <button className="monster-choice-card" type="button" disabled={busy} onClick={() => void openSources('encounters')}>
          <span className="monster-choice-icon" aria-hidden="true">⚔</span>
          <span className="monster-choice-label">Da Combattimento</span>
          <span className="monster-choice-desc">Importa un incontro pronto</span>
        </button>
        {onOpenLaboratory && <button className="monster-choice-card" type="button" onClick={() => {
          closeAll();
          onOpenLaboratory();
        }}>
          <span className="monster-choice-icon" aria-hidden="true">✏️</span>
          <span className="monster-choice-label">Crea nuovo</span>
          <span className="monster-choice-desc">Apri il Laboratorio</span>
        </button>}
      </div>
      <InlineError>{error}</InlineError>
      <div className="form-actions"><button className="btn-secondary" type="button" onClick={() => setDialog('monsters')}>Indietro</button></div>
    </Modal>}

    {dialog === 'homebrew' && !selectedSource && <SourceList
      title="Nemici homebrew"
      items={sources?.monsters ?? []}
      empty="Nessun nemico homebrew trovato."
      subtitle={monsterSourceSubtitle}
      onBack={() => setDialog('add-monster')}
      onSelect={setSelectedSource}
      onClose={closeAll}
    />}

    {dialog === 'homebrew' && selectedSource && <HomebrewQuickAdd
      source={selectedSource}
      busy={busy}
      error={error}
      onCancel={() => setSelectedSource(null)}
      onSubmit={initiative => void run(
        () => createCombatMonsterFromSource({ campagnaId, sessioneId, source: selectedSource, initiative }),
        `${selectedSource.nome} aggiunto al combattimento`,
        closeAll,
      )}
    />}

    {dialog === 'encounters' && <SourceList
      title="Combattimenti homebrew"
      items={sources?.encounters ?? []}
      empty="Nessun combattimento homebrew trovato."
      subtitle={encounterSourceSubtitle}
      busy={busy}
      error={error}
      onBack={() => setDialog('add-monster')}
      onSelect={source => void run(
        () => importCombatEncounter({ campagnaId, sessioneId, source }),
        `${encounterMonsterCount(source)} mostri aggiunti al combattimento`,
        closeAll,
      )}
      onClose={closeAll}
    />}

    {dialog === 'create-monster' && <PlaceholderForm
      busy={busy}
      error={error}
      onCancel={() => setDialog('monsters')}
      onSubmit={input => run(
        () => createPlaceholderMonster({ campagnaId, sessioneId, ...input }),
        'Mostro aggiunto',
        () => setDialog('monsters'),
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
  onChanged: ChangeCallback;
  onNotify?: NotifyCallback;
};

export function CombatTimersPanel({
  timers,
  currentUserId,
  isDm,
  playerCharacterId,
  onChanged,
  onNotify,
}: CombatTimersPanelProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const visible = timers.filter(timer => isDm
    || timer.target_kind === 'global'
    || (timer.target_kind === 'player' && timer.target_id === playerCharacterId));
  const confirmingTimer = visible.find(timer => timer.id === confirmingId);

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
        return <div className={`combat-timer-chip ${timer.remaining_rounds <= 1 ? 'is-low' : ''}`} key={timer.id}>
          <span className="combat-timer-rounds">{timer.remaining_rounds}</span>
          <span className="combat-timer-info">
            <span className="combat-timer-name">{timer.nome}</span>
            <span className="combat-timer-meta">
              <span className="combat-timer-target">{timer.target_name || (timer.target_kind === 'global' ? 'Globale' : 'Target')}</span>
              {timer.conditions.map(condition => <span className="combat-timer-cond" key={condition}>{CONDITION_LABELS[condition]}</span>)}
            </span>
          </span>
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
    {confirmingTimer && <ConfirmDelete
      message={`Rimuovere il timer "${confirmingTimer.nome}"?`}
      busy={Boolean(removingId)}
      onCancel={() => setConfirmingId(null)}
      onConfirm={() => void remove(confirmingTimer)}
    />}
  </div>;
}

function SourceList({
  title,
  items,
  empty,
  subtitle,
  busy = false,
  error = '',
  onBack,
  onSelect,
  onClose,
}: {
  title: string;
  items: HomebrewItem[];
  empty: string;
  subtitle: (item: HomebrewItem) => string;
  busy?: boolean;
  error?: string;
  onBack: () => void;
  onSelect: (item: HomebrewItem) => void;
  onClose: () => void;
}) {
  return <Modal title={title} onClose={onClose}>
    <div className="monster-hb-list">
      {items.map(item => <button className="monster-hb-item" type="button" disabled={busy} key={item.id} onClick={() => onSelect(item)}>
        <span className="monster-hb-info">
          <span className="monster-hb-name">{item.nome}</span>
          <span className="monster-hb-sub">{subtitle(item)}</span>
        </span>
        <span className="monster-hb-arrow" aria-hidden="true">›</span>
      </button>)}
      {!items.length && <div className="content-placeholder"><p>{empty}</p></div>}
    </div>
    <InlineError>{error}</InlineError>
    <div className="form-actions"><button className="btn-secondary" type="button" disabled={busy} onClick={onBack}>Indietro</button></div>
  </Modal>;
}

function HomebrewQuickAdd({
  source,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  source: HomebrewItem;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (initiative?: number) => void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get('initiative') ?? '').trim();
    onSubmit(raw ? Number(raw) : undefined);
  };
  return <Modal title={source.nome} onClose={onCancel}>
    <form onSubmit={submit}>
      <p className="monster-quickadd-sub">{monsterSourceSubtitle(source)}</p>
      <div className="form-group">
        <label htmlFor="combat-homebrew-initiative">Iniziativa (vuota = tiro automatico)</label>
        <input id="combat-homebrew-initiative" name="initiative" type="number" min="-100" max="100" autoFocus />
      </div>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <button className="btn-secondary" type="button" disabled={busy} onClick={onCancel}>Indietro</button>
        <button className="btn-primary" type="submit" disabled={busy}>Aggiungi</button>
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
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  monsters: CombatToolMonster[];
  isDm: boolean;
  playerCharacterId: string | null;
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
      targetName: monster?.nome ?? null,
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
  return <div className="modal active" role="dialog" aria-modal="true" aria-label={title} onMouseDown={closeFromBackdrop}>
    <div className={`modal-content ${className}`}>
      <button className="modal-close" type="button" onClick={onClose} aria-label="Chiudi">×</button>
      <h2 className="placeholder-title">{title}</h2>
      {children}
    </div>
  </div>;
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
  return `${sourceText(source, 'tipo', 'Mostro')} · GS ${sourceText(source, 'grado_sfida', '0')} · PV ${sourceText(source, 'punti_vita_max', '?')}`;
}

function encounterMonsterCount(source: HomebrewItem) {
  return Array.isArray(source.mostri) ? source.mostri.length : 0;
}

function encounterSourceSubtitle(source: HomebrewItem) {
  const count = encounterMonsterCount(source);
  return `${count} ${count === 1 ? 'mostro' : 'mostri'}`;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></svg>;
}
