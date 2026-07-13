import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import type { CombatCharacter, MostroCombattimento } from '../../types/domain';
import { currentUserQuery } from '../auth/currentUserQuery';
import { campaignByIdQuery } from '../campaigns/campaignDetailQueries';
import { combatSnapshotQuery } from './combatQueries';
import { sortInitiativeOrder } from './initiativeOrder';

type CombatEntry = {
  type: 'player' | 'monster';
  id: string;
  name: string;
  init: number;
  tiebreak?: string | null;
  pgId?: string | null;
  playerUserId?: string | null;
  imageUrl?: string | null;
  hp?: number | null;
  hpMax?: number | null;
  conditions: string[];
  monster?: MostroCombattimento;
};

declare global {
  interface Window {
    ensureRuntimeScript?: (key: string) => Promise<void>;
    setCombatInitiativeOrder?: (order: CombatEntry[]) => void;
    combatNextTurn?: (campagnaId: string, sessioneId: string, orderLength: number, round: number, turnIndex: number) => void;
    combatOpenMonsterFullSheet?: (monsterId: string, campagnaId: string, sessioneId: string) => void;
    openMonsterCreationModal?: (campagnaId: string, sessioneId: string) => void;
    combatDiceRoll?: () => void;
    combatCalcOpen?: () => void;
    combatOpenTimerDialog?: (campagnaId: string, sessioneId: string, mode: 'dm' | 'player', personaggioId: string | null) => void;
    terminaCombattimento?: (campagnaId: string, sessioneId: string) => void;
    renderCombatTimers?: (sessioneId: string, isDm: boolean, personaggioId: string | null) => void;
    _normalizeImageUrl?: (url: string) => string;
  }
}

const CONDITION_LABELS: Record<string, string> = {
  concentrazione: 'Concentrazione', accecato: 'Accecato', affascinato: 'Affascinato', afferrato: 'Afferrato',
  assordato: 'Assordato', avvelenato: 'Avvelenato', incapacitato: 'Incapacitato', invisibile: 'Invisibile',
  paralizzato: 'Paralizzato', pietrificato: 'Pietrificato', privo_di_sensi: 'Privo di sensi', prono: 'Prono',
  spaventato: 'Spaventato', stordito: 'Stordito', trattenuto: 'Trattenuto',
};

export function CombatPage() {
  const { campagnaId = '', sessioneId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const campaign = useQuery(campaignByIdQuery(campagnaId));
  const combat = useQuery(combatSnapshotQuery(campagnaId, sessioneId));
  const user = useQuery(currentUserQuery());
  const [legacyReady, setLegacyReady] = useState(false);

  const isDm = campaign.data?.id_dm === user.data?.id;
  const order = useMemo(() => buildCombatOrder(combat.data?.tiri ?? [], combat.data?.mostri ?? [], combat.data?.personaggi ?? []), [combat.data]);
  const round = combat.data?.sessione?.combat_round ?? 1;
  const turnIndex = Math.min(combat.data?.sessione?.combat_turn_index ?? 0, Math.max(0, order.length - 1));
  const currentCharacter = combat.data?.personaggi.find(character => character.player_user_id === user.data?.id);

  useEffect(() => {
    let live = true;
    window.ensureRuntimeScript?.('combattimento').then(() => { if (live) setLegacyReady(true); }).catch(console.error);
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const state = window.AppState as (typeof window.AppState & { currentPage?: string });
    if (state) {
      state.currentPage = 'combattimento';
      state.currentCampagnaId = campagnaId;
      state.currentSessioneId = sessioneId;
    }
    sessionStorage.setItem('currentCampagnaId', campagnaId);
    sessionStorage.setItem('currentSessioneId', sessioneId);
  }, [campagnaId, sessioneId]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ campagnaId?: string; sessioneId?: string }>).detail;
      if (detail?.campagnaId && detail.campagnaId !== campagnaId) return;
      if (detail?.sessioneId && detail.sessioneId !== sessioneId) return;
      client.invalidateQueries({ queryKey: queryKeys.combat(sessioneId) });
    };
    window.addEventListener('companion:combat-refresh', refresh);
    return () => {
      window.removeEventListener('companion:combat-refresh', refresh);
    };
  }, [campagnaId, client, sessioneId]);

  useEffect(() => {
    if (!legacyReady) return;
    window.setCombatInitiativeOrder?.(order);
    window.renderCombatTimers?.(sessioneId, isDm, isDm ? null : currentCharacter?.id ?? null);
  }, [currentCharacter?.id, isDm, legacyReady, order, sessioneId]);

  if (campaign.isLoading || combat.isLoading) return <ReactPage name="combattimento"><Placeholder text="Caricamento combattimento..." /></ReactPage>;
  if (!campaign.data || !combat.data?.sessione) return <ReactPage name="combattimento"><Placeholder text="Combattimento non trovato." /></ReactPage>;

  const openEntry = (entry: CombatEntry) => {
    if (entry.type === 'monster') {
      if (isDm) window.combatOpenMonsterFullSheet?.(entry.id, campagnaId, sessioneId);
      return;
    }
    if ((isDm || entry.playerUserId === user.data?.id) && entry.pgId) {
      navigate(buildAppPath('personaggio', { personaggioId: entry.pgId }));
    }
  };

  return <ReactPage name="combattimento"><div className="react-combat-page">
    <div className="combat-header">
      <button className="page-header-back combat-back" type="button" onClick={() => navigate(buildAppPath('sessione', { campagnaId }))} aria-label="Torna alla sessione"><Back /></button>
      <div className="combat-round-center"><div className="combat-round-num">Round {round}</div><div className="combat-turn-name">{order[turnIndex]?.name ?? 'In attesa...'}</div></div>
      {isDm && order.length > 0 && <button className="combat-next-btn" type="button" disabled={!legacyReady} onClick={() => window.combatNextTurn?.(campagnaId, sessioneId, order.length, round, turnIndex)} title="Prossimo turno"><Next /></button>}
    </div>
    <div className="combat-timers-panel" id="combatTimersPanel" style={{ display: 'none' }} />
    <div className="combat-body">
      <div className="combat-initiative-col">{order.map((entry, index) => <button type="button" key={`${entry.type}-${entry.id}`} className={`combat-icon ${index === turnIndex ? 'active' : ''} ${entry.type === 'monster' ? 'monster' : ''} ${canOpen(entry, isDm, user.data?.id) ? 'is-clickable' : 'is-locked'}`} onClick={() => openEntry(entry)} disabled={!canOpen(entry, isDm, user.data?.id)}>
        {entry.imageUrl && <img src={normalizeImage(entry.imageUrl)} alt="" className="combat-icon-img" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} />}
        <span className="combat-icon-initials">{entry.name.slice(0, 2).toUpperCase()}</span>
      </button>)}</div>
      <div className="combat-cards-col">
        {!order.length ? <div className="content-placeholder"><p>In attesa dei tiri iniziativa...</p></div> : order.map((entry, index) => <button type="button" key={`${entry.type}-${entry.id}`} className={`combat-card ${index === turnIndex ? 'is-turn' : ''} ${entry.type === 'monster' ? 'monster-card' : ''} ${canOpen(entry, isDm, user.data?.id) ? 'is-clickable' : 'is-locked'}`} onClick={() => openEntry(entry)} disabled={!canOpen(entry, isDm, user.data?.id)}>
          <span className="combat-card-init" title="Iniziativa">{entry.init}</span>
          <span className="combat-card-center"><span className="combat-card-name">{entry.name}</span>{entry.conditions.length > 0 && <span className="combat-card-badges">{entry.conditions.map(condition => <span className="condition-badge-sm" key={condition}>{CONDITION_LABELS[condition] ?? condition}</span>)}</span>}</span>
          {(entry.type === 'player' || isDm) && entry.hpMax != null && <span className="combat-card-hp">{entry.hp ?? entry.hpMax}/{entry.hpMax}</span>}
        </button>)}
      </div>
    </div>
    <CombatToolbar ready={legacyReady} isDm={isDm} campagnaId={campagnaId} sessioneId={sessioneId} personaggioId={currentCharacter?.id ?? null} />
  </div></ReactPage>;
}

function CombatToolbar({ ready, isDm, campagnaId, sessioneId, personaggioId }: { ready: boolean; isDm: boolean; campagnaId: string; sessioneId: string; personaggioId: string | null }) {
  return <div className="combat-toolbar">
    {isDm && <ToolbarButton label="Mostro" title="Aggiungi mostro" disabled={!ready} onClick={() => window.openMonsterCreationModal?.(campagnaId, sessioneId)} icon={<Plus />} />}
    <ToolbarButton label="Dadi" title="Tira dadi" disabled={!ready} onClick={() => window.combatDiceRoll?.()} icon={<Dice />} />
    <ToolbarButton label="Calc" title="Calcolatrice" disabled={!ready} onClick={() => window.combatCalcOpen?.()} icon={<Calculator />} />
    <ToolbarButton label="Timer" title="Timer combattimento" disabled={!ready || (!isDm && !personaggioId)} onClick={() => window.combatOpenTimerDialog?.(campagnaId, sessioneId, isDm ? 'dm' : 'player', personaggioId)} icon={<Clock />} />
    {isDm && <ToolbarButton label="Fine" title="Termina combattimento" className="danger" disabled={!ready} onClick={() => window.terminaCombattimento?.(campagnaId, sessioneId)} icon={<Close />} />}
  </div>;
}

function ToolbarButton({ label, icon, className = '', ...props }: { label: string; icon: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`combat-toolbar-btn ${className}`} {...props}>{icon}<span>{label}</span></button>;
}

export function buildCombatOrder(tiri: { giocatore_id: string; giocatore_nome?: string | null; valore?: number | null; stato?: string | null; created_at?: string | null; completed_at?: string | null }[], mostri: MostroCombattimento[], personaggi: CombatCharacter[]): CombatEntry[] {
  const characterByPlayer = new Map(personaggi.map(character => [character.player_user_id, character]));
  const players: CombatEntry[] = tiri.filter(roll => roll.stato === 'completed' && roll.valore != null).map(roll => {
    const character = characterByPlayer.get(roll.giocatore_id);
    return { type: 'player', id: roll.giocatore_id, pgId: character?.id, playerUserId: roll.giocatore_id, name: character?.nome ?? roll.giocatore_nome ?? '?', init: roll.valore ?? 0, tiebreak: roll.created_at ?? roll.completed_at, imageUrl: character?.immagine_url, hp: character?.pv_attuali, hpMax: character?.punti_vita_max, conditions: character?.condizioni ?? [] };
  });
  const monsters: CombatEntry[] = mostri.map(monster => ({ type: 'monster', id: monster.id, name: monster.nome, init: monster.iniziativa ?? 0, tiebreak: monster.created_at, hp: monster.pv_attuali, hpMax: monster.punti_vita_max ?? monster.pv_max, conditions: monsterConditions(monster), monster }));
  return sortInitiativeOrder([...players, ...monsters]);
}

function monsterConditions(monster: MostroCombattimento) {
  const record = monster as unknown as Record<string, unknown>;
  return Object.keys(CONDITION_LABELS).filter(key => Boolean(record[key]));
}

function canOpen(entry: CombatEntry, isDm: boolean, userId?: string) { return entry.type === 'monster' ? isDm : Boolean(entry.pgId && (isDm || entry.playerUserId === userId)); }
function normalizeImage(url: string) { return window._normalizeImageUrl?.(url) ?? url; }
function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>; }
function Next() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>; }
function Plus() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>; }
function Dice() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="4" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /><circle cx="16" cy="16" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>; }
function Calculator() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h8" /></svg>; }
function Clock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></svg>; }
function Close() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 6-12 12M6 6l12 12" /></svg>; }
