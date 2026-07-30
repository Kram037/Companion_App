import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router';

import { advanceCombatTurn, endCombat, nextCombatTurnState } from '../../api';
import {
  fetchCombatTimers,
  fetchCombatToolMonsters,
  type CombatTimer,
} from '../../api/combatToolsApi';
import { ReactPage } from '../../app/ReactPage';
import { combatLegacyAdapter } from '../../legacy/combatLegacyAdapter';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import type { CombatCharacter, MostroCombattimento } from '../../types/domain';
import { currentUserQuery } from '../auth/currentUserQuery';
import { campaignByIdQuery } from '../campaigns/campaignDetailQueries';
import { normalizeImageUrl } from '../media/imageUrls';
import { combatSnapshotQuery } from './combatQueries';
import { CombatTimersPanel, CombatTools } from './CombatTools';
import { CombatUtilities } from './CombatUtilities';
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
  const [utility, setUtility] = useState<'dice' | 'calculator' | null>(null);
  const [openMonsterId, setOpenMonsterId] = useState<string | null>(null);

  const isDm = campaign.data?.id_dm === user.data?.id;
  const currentCharacter = combat.data?.personaggi.find(character => character.player_user_id === user.data?.id);
  const timerTargetNames = useMemo(() => Object.fromEntries([
    ...(combat.data?.personaggi ?? []).map(character => [`player:${character.id}`, character.nome]),
    ...(combat.data?.mostri ?? []).map(monster => [`monster:${monster.id}`, monster.nome]),
  ]), [combat.data?.mostri, combat.data?.personaggi]);
  const timers = useQuery({
    queryKey: queryKeys.combatTimers(sessioneId),
    queryFn: () => fetchCombatTimers(sessioneId),
    enabled: Boolean(sessioneId),
  });
  const toolMonsters = useQuery({
    queryKey: queryKeys.combatMonsters(sessioneId),
    queryFn: () => fetchCombatToolMonsters(sessioneId),
    enabled: Boolean(sessioneId && isDm),
  });
  const visibleTimers = useMemo(() => (timers.data ?? []).filter(timer => isDm
    || timer.target_kind === 'global'
    || (timer.target_kind === 'player' && timer.target_id === currentCharacter?.id)), [currentCharacter?.id, isDm, timers.data]);
  const order = useMemo(() => buildCombatOrder(
    combat.data?.tiri ?? [],
    combat.data?.mostri ?? [],
    combat.data?.personaggi ?? [],
    visibleTimers,
  ), [combat.data, visibleTimers]);
  const round = combat.data?.sessione?.combat_round ?? 1;
  const turnIndex = Math.max(0, Math.min(combat.data?.sessione?.combat_turn_index ?? 0, Math.max(0, order.length - 1)));
  const nextTurn = useMutation({
    mutationFn: async () => {
      const nextIndex = nextCombatTurnState(order.length, round, turnIndex).turnIndex;
      const nextEntry = order[nextIndex];
      const result = await advanceCombatTurn({
        sessioneId,
        orderLength: order.length,
        round,
        turnIndex,
        nextMonster: nextEntry?.type === 'monster' ? nextEntry.monster ?? null : null,
      });
      return result;
    },
    onSuccess: async result => {
      if (!result.advanced) {
        combatLegacyAdapter.notify('Il turno era già stato aggiornato: dati riallineati');
        await client.invalidateQueries({ queryKey: queryKeys.combat(sessioneId) });
        return;
      }
      if (result.expiredTimers > 0) combatLegacyAdapter.notify(result.expiredTimers === 1 ? 'Un timer è scaduto' : `${result.expiredTimers} timer scaduti`);
      await combatLegacyAdapter.broadcast({
        table: 'combattimento',
        action: 'next_turn',
        id: `${sessioneId}:${result.round}:${result.turnIndex}`,
        sessioneId,
        campagnaId,
      });
    },
    onError: error => combatLegacyAdapter.notify(`Errore cambio turno: ${errorMessage(error)}`),
  });
  const stopCombat = useMutation({
    mutationFn: () => endCombat(sessioneId),
    onSuccess: async () => {
      await combatLegacyAdapter.broadcast({ table: 'combattimento', action: 'end', id: sessioneId, sessioneId, campagnaId });
      combatLegacyAdapter.notify('Combattimento terminato');
      navigate(buildAppPath('sessione', { campagnaId }));
    },
    onError: error => combatLegacyAdapter.notify(`Errore nella terminazione del combattimento: ${errorMessage(error)}`),
  });

  useEffect(() => {
    combatLegacyAdapter.setNavigation(campagnaId, sessioneId);
  }, [campagnaId, sessioneId]);

  const refreshCombat = useCallback(async () => {
    await combatLegacyAdapter.broadcast({ table: 'combattimento', action: 'update', sessioneId, campagnaId });
  }, [campagnaId, sessioneId]);

  if (campaign.isLoading || combat.isLoading || user.isLoading || timers.isLoading || (isDm && toolMonsters.isLoading)) return <ReactPage name="combattimento"><Placeholder text="Caricamento combattimento..." /></ReactPage>;
  if (campaign.isError || combat.isError || user.isError || timers.isError || (isDm && toolMonsters.isError)) return <ReactPage name="combattimento"><Placeholder text="Impossibile caricare il combattimento." /></ReactPage>;
  if (!campaign.data || !combat.data?.sessione) return <ReactPage name="combattimento"><Placeholder text="Combattimento non trovato." /></ReactPage>;
  if (!combat.data.tiri.length) return <Navigate replace to={buildAppPath('sessione', { campagnaId })} />;

  const openEntry = (entry: CombatEntry) => {
    if (entry.type === 'monster') {
      if (isDm) setOpenMonsterId(entry.id);
      return;
    }
    if ((isDm || entry.playerUserId === user.data?.id) && entry.pgId) {
      combatLegacyAdapter.openCharacter(entry.pgId);
    }
  };

  return <ReactPage name="combattimento"><div className="react-combat-page">
    <div className="combat-header">
      <button className="page-header-back combat-back" type="button" onClick={() => navigate(buildAppPath('sessione', { campagnaId }))} aria-label="Torna alla sessione"><Back /></button>
      <div className="combat-round-center"><div className="combat-round-num">Round {round}</div><div className="combat-turn-name">{order[turnIndex]?.name ?? 'In attesa...'}</div></div>
      {isDm && order.length > 0 && <button className="combat-next-btn" type="button" disabled={nextTurn.isPending} onClick={() => nextTurn.mutate()} title="Prossimo turno"><Next /></button>}
    </div>
    <CombatTimersPanel
      timers={visibleTimers}
      currentUserId={user.data?.id ?? ''}
      isDm={isDm}
      playerCharacterId={currentCharacter?.id ?? null}
      targetNames={timerTargetNames}
      onChanged={refreshCombat}
      onNotify={message => combatLegacyAdapter.notify(message)}
    />
    <div className="combat-body">
      <div className="combat-order-list">
        {!order.length ? <div className="content-placeholder"><p>In attesa dei tiri iniziativa...</p></div> : order.map((entry, index) => <div className="combat-order-row" key={`${entry.type}-${entry.id}`}>
          <button type="button" className={`combat-icon ${index === turnIndex ? 'active' : ''} ${entry.type === 'monster' ? 'monster' : ''} ${canOpen(entry, isDm, user.data?.id) ? 'is-clickable' : 'is-locked'}`} onClick={() => openEntry(entry)} disabled={!canOpen(entry, isDm, user.data?.id)} aria-label={`Apri ${entry.name}`}>
            {entry.imageUrl && <img src={normalizeImage(entry.imageUrl)} alt="" className="combat-icon-img" loading="lazy" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.display = 'none'; }} />}
            <span className="combat-icon-initials">{entry.name.slice(0, 2).toUpperCase()}</span>
            <span className="combat-icon-init" title="Iniziativa">{entry.init}</span>
          </button>
          <button type="button" className={`combat-card ${index === turnIndex ? 'is-turn' : ''} ${entry.type === 'monster' ? 'monster-card' : ''} ${canOpen(entry, isDm, user.data?.id) ? 'is-clickable' : 'is-locked'}`} onClick={() => openEntry(entry)} disabled={!canOpen(entry, isDm, user.data?.id)}>
            <span className="combat-card-meta"><span className="combat-card-name">{entry.name}</span>{(entry.type === 'player' || isDm) && entry.hpMax != null && <span className="combat-card-hp">{entry.hp ?? entry.hpMax}/{entry.hpMax}</span>}</span>
            <span className="combat-card-badges">{entry.conditions.map(condition => <span className="condition-badge-sm" key={condition}>{CONDITION_LABELS[condition] ?? condition}</span>)}</span>
          </button>
        </div>)}
      </div>
    </div>
    <div className="combat-toolbar">
      <CombatTools
        campagnaId={campagnaId}
        sessioneId={sessioneId}
        currentUserId={user.data?.id ?? ''}
        homebrewUserId={user.data?.uid ?? user.data?.id ?? ''}
        isDm={isDm}
        playerCharacterId={currentCharacter?.id ?? null}
        playerCharacterName={currentCharacter?.nome ?? null}
        monsters={toolMonsters.data ?? []}
        openMonsterId={openMonsterId}
        onMonsterOpened={() => setOpenMonsterId(null)}
        onChanged={refreshCombat}
        onNotify={message => combatLegacyAdapter.notify(message)}
      />
      <ToolbarButton label="Dadi" title="Tira dadi" onClick={() => setUtility('dice')} icon={<Dice />} />
      <ToolbarButton label="Calc" title="Calcolatrice" onClick={() => setUtility('calculator')} icon={<Calculator />} />
      {isDm && <ToolbarButton label="Fine" title="Termina combattimento" className="danger" disabled={stopCombat.isPending} onClick={() => {
        if (combatLegacyAdapter.confirm('Terminare il combattimento?')) stopCombat.mutate();
      }} icon={<Close />} />}
    </div>
    <CombatUtilities mode={utility} onClose={() => setUtility(null)} />
  </div></ReactPage>;
}

function ToolbarButton({ label, icon, className = '', ...props }: { label: string; icon: React.ReactNode; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`combat-toolbar-btn ${className}`} {...props}>{icon}<span>{label}</span></button>;
}

export function buildCombatOrder(tiri: { giocatore_id: string; giocatore_nome?: string | null; valore?: number | null; stato?: string | null; created_at?: string | null; completed_at?: string | null }[], mostri: MostroCombattimento[], personaggi: CombatCharacter[], timers: CombatTimer[] = []): CombatEntry[] {
  const characterByPlayer = new Map(personaggi.map(character => [character.player_user_id, character]));
  const players: CombatEntry[] = tiri.filter(roll => roll.stato === 'completed' && roll.valore != null).map(roll => {
    const character = characterByPlayer.get(roll.giocatore_id);
    return { type: 'player', id: roll.giocatore_id, pgId: character?.id, playerUserId: roll.giocatore_id, name: character?.nome ?? roll.giocatore_nome ?? '?', init: roll.valore ?? 0, tiebreak: roll.created_at ?? roll.completed_at, imageUrl: character?.immagine_url, hp: character?.pv_attuali, hpMax: character?.punti_vita_max, conditions: withTimerConditions(character?.condizioni ?? [], 'player', character?.id, timers) };
  });
  const monsters: CombatEntry[] = mostri.map(monster => ({ type: 'monster', id: monster.id, name: monster.nome, init: monster.iniziativa ?? 0, tiebreak: monster.created_at, hp: monster.pv_attuali, hpMax: monster.punti_vita_max ?? monster.pv_max, conditions: withTimerConditions(monsterConditions(monster), 'monster', monster.id, timers), monster }));
  return sortInitiativeOrder([...players, ...monsters]);
}

function monsterConditions(monster: MostroCombattimento) {
  const record = monster as unknown as Record<string, unknown>;
  return Object.keys(CONDITION_LABELS).filter(key => Boolean(record[key]));
}

function withTimerConditions(current: string[], targetKind: 'player' | 'monster', targetId: string | undefined, timers: CombatTimer[]) {
  const conditions = new Set(current);
  if (targetId) {
    timers
      .filter(timer => timer.target_kind === targetKind && timer.target_id === targetId)
      .forEach(timer => timer.conditions.forEach(condition => conditions.add(condition)));
  }
  return [...conditions];
}

function canOpen(entry: CombatEntry, isDm: boolean, userId?: string) { return entry.type === 'monster' ? isDm : Boolean(entry.pgId && (isDm || entry.playerUserId === userId)); }
function normalizeImage(url: string) { return normalizeImageUrl(url) ?? url; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : String(error); }
function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>; }
function Next() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>; }
function Dice() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="4" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /><circle cx="16" cy="16" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>; }
function Calculator() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h2m4 0h2M8 14h2m4 0h2M8 18h8" /></svg>; }
function Close() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 6-12 12M6 6l12 12" /></svg>; }
