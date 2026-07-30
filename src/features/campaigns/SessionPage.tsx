import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import {
  deleteGenericRollGroup,
  endCampaignSession,
  requestGenericRolls,
  requestInitiativeRolls,
  startCampaignSession,
} from '../../api';
import { ReactPage } from '../../app/ReactPage';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import type {
  CampaignCharacter,
  CampaignPlayer,
  GenericRollGroup,
  GenericRollKind,
  GenericRollRequest,
} from '../../types/domain';
import { currentUserQuery } from '../auth/currentUserQuery';
import {
  activeSessionByCampaignQuery,
  campaignByIdQuery,
  campaignCharactersQuery,
  campaignPlayersQuery,
  initiativeRequestsQuery,
  latestGenericRollGroupQuery,
} from './campaignDetailQueries';

declare global {
  interface Window {
    openSchedaPersonaggio?: (id: string) => void;
    sendAppEventBroadcast?: (change: Record<string, unknown>) => Promise<void>;
    showNotification?: (message: string) => void;
  }
}

const ABILITIES = [
  ['forza', 'Forza'],
  ['destrezza', 'Destrezza'],
  ['costituzione', 'Costituzione'],
  ['intelligenza', 'Intelligenza'],
  ['saggezza', 'Saggezza'],
  ['carisma', 'Carisma'],
] as const;

const SKILLS = [
  ['acrobazia', 'Acrobazia'],
  ['addestrare_animali', 'Addestrare Animali'],
  ['arcano', 'Arcano'],
  ['atletica', 'Atletica'],
  ['furtivita', 'Furtività'],
  ['indagare', 'Indagare'],
  ['inganno', 'Inganno'],
  ['intimidire', 'Intimidire'],
  ['intrattenere', 'Intrattenere'],
  ['intuizione', 'Intuizione'],
  ['medicina', 'Medicina'],
  ['natura', 'Natura'],
  ['percezione', 'Percezione'],
  ['persuasione', 'Persuasione'],
  ['rapidita_di_mano', 'Rapidità di Mano'],
  ['religione', 'Religione'],
  ['sopravvivenza', 'Sopravvivenza'],
  ['storia', 'Storia'],
] as const;

export function SessionPage() {
  const { campagnaId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const campaign = useQuery(campaignByIdQuery(campagnaId));
  const session = useQuery(activeSessionByCampaignQuery(campagnaId));
  const characters = useQuery(campaignCharactersQuery(campagnaId));
  const players = useQuery(campaignPlayersQuery(campagnaId));
  const user = useQuery(currentUserQuery());
  const activeSessionId = session.data?.id ?? '';
  const isDm = Boolean(campaign.data && campaign.data.id_dm === user.data?.id);
  const initiative = useQuery(initiativeRequestsQuery(activeSessionId));
  const genericRolls = useQuery({
    ...latestGenericRollGroupQuery(activeSessionId),
    enabled: Boolean(activeSessionId && isDm),
  });
  const now = useSessionClock(Boolean(session.data));
  const [rollModalOpen, setRollModalOpen] = useState(false);
  const [rollKind, setRollKind] = useState<GenericRollKind>('salvezza');
  const [rollTarget, setRollTarget] = useState('forza');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const startSession = useMutation({
    mutationFn: () => startCampaignSession(campagnaId),
    onSuccess: async started => {
      await window.sendAppEventBroadcast?.({ table: 'sessioni', action: 'insert', campagnaId, sessioneId: started.id });
      window.setAppNavigationState?.({ campagnaId, sessioneId: started.id }, 'react-start-session');
      if (window.AppState) window.AppState.activeSessionCampagnaId = campagnaId;
      sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
    },
    onError: error => window.showNotification?.(`Errore nell'avvio della sessione: ${errorMessage(error)}`),
  });

  const finishSession = useMutation({
    mutationFn: (sessioneId: string) => endCampaignSession(sessioneId),
    onSuccess: async (_, sessioneId) => {
      await window.sendAppEventBroadcast?.({ table: 'sessioni', action: 'update', campagnaId, sessioneId });
      if (window.AppState) window.AppState.activeSessionCampagnaId = null;
      window.setAppNavigationState?.({ campagnaId, sessioneId: null }, 'react-session-end');
      sessionStorage.removeItem('activeSessionCampagnaId');
      window.showNotification?.('Sessione terminata!');
      navigate(buildAppPath('campagnaDetails', { campagnaId }));
    },
    onError: async (error, sessioneId) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.session(campagnaId) }),
        client.invalidateQueries({ queryKey: queryKeys.campaign(campagnaId) }),
        client.invalidateQueries({ queryKey: queryKeys.combat(sessioneId) }),
      ]);
      window.showNotification?.(`Errore nella fine della sessione: ${errorMessage(error)}`);
    },
  });

  const requestInitiative = useMutation({
    mutationFn: (sessioneId: string) => requestInitiativeRolls(sessioneId, (players.data ?? []).map(player => player.id)),
    onSuccess: async (count, sessioneId) => {
      await window.sendAppEventBroadcast?.({
        table: 'richieste_tiro_iniziativa',
        action: count ? 'insert' : 'delete',
        campagnaId,
        sessioneId,
      });
      if (!count) {
        window.showNotification?.('Nessun giocatore a cui richiedere l\'iniziativa');
        return;
      }
      window.showNotification?.('Richieste tiro iniziativa inviate!');
      client.removeQueries({ queryKey: queryKeys.combat(sessioneId), exact: true });
      navigate(buildAppPath('combattimento', { campagnaId, sessioneId }));
    },
    onError: error => window.showNotification?.(`Errore nella richiesta tiro iniziativa: ${errorMessage(error)}`),
  });

  const requestGeneric = useMutation({
    mutationFn: (input: { sessioneId: string; playerIds: string[]; kind: GenericRollKind; target: string; label: string }) =>
      requestGenericRolls(input.sessioneId, input.playerIds, {
        tipoTiro: input.kind,
        targetTiro: input.target,
        tiroLabel: input.label,
      }),
    onSuccess: async (richiestaId, input) => {
      setRollModalOpen(false);
      await window.sendAppEventBroadcast?.({
        table: 'richieste_tiro_generico',
        action: 'insert',
        campagnaId,
        sessioneId: input.sessioneId,
        richiestaId,
        tiroLabel: input.label,
        tipoTiro: input.kind,
        targetTiro: input.target,
      });
      window.showNotification?.(`${input.label} richiesto!`);
    },
    onError: error => window.showNotification?.(`Errore nella richiesta tiro: ${errorMessage(error)}`),
  });

  const closeGenericRolls = useMutation({
    mutationFn: ({ sessioneId, richiestaId }: { sessioneId: string; richiestaId: string }) =>
      deleteGenericRollGroup(sessioneId, richiestaId),
    onSuccess: async (_, input) => {
      await window.sendAppEventBroadcast?.({
        table: 'richieste_tiro_generico',
        action: 'delete',
        campagnaId,
        sessioneId: input.sessioneId,
        richiestaId: input.richiestaId,
      });
      window.showNotification?.('Tabella tiri chiusa');
    },
    onError: error => window.showNotification?.(`Errore nella chiusura della tabella: ${errorMessage(error)}`),
  });

  useEffect(() => {
    window.setAppNavigationState?.({ campagnaId, sessioneId: activeSessionId || null }, 'react-session');
  }, [activeSessionId, campagnaId]);

  if (campaign.isLoading || session.isLoading || characters.isLoading || players.isLoading || user.isLoading) {
    return <ReactPage name="sessione"><Placeholder text="Caricamento sessione..." /></ReactPage>;
  }
  if (campaign.isError || session.isError || characters.isError || players.isError || user.isError || initiative.isError || genericRolls.isError) {
    return <ReactPage name="sessione"><Placeholder text="Impossibile caricare la sessione." /></ReactPage>;
  }

  const data = campaign.data;
  if (!data) return <ReactPage name="sessione"><Placeholder text="Campagna non trovata." /></ReactPage>;

  const activeSession = session.data;
  const genericGroup = genericRolls.data;
  const sessionNumber = (data.numero_sessioni ?? 0) + 1;
  const rollPlayers = (players.data ?? []).map(player => ({
    id: player.id,
    name: playerName(player.id, players.data ?? [], characters.data ?? []),
  }));
  const openRollModal = () => {
    setSelectedPlayers(rollPlayers.map(player => player.id));
    setRollModalOpen(true);
  };

  return <ReactPage name="sessione"><div className="page-content sessione-content">
    <div className="page-top-stack"><div className="page-header page-header-with-back">
      <button className="page-header-back" type="button" onClick={() => navigate(buildAppPath('campagnaDetails', { campagnaId }))} aria-label="Torna ai dettagli"><Back /></button>
      <h1><div>{data.nome_campagna}</div>{activeSession && <div>Sessione {sessionNumber}</div>}</h1>
    </div></div>

    {!activeSession ? <div className="content-placeholder">
      <p>Nessuna sessione attiva</p>
      {isDm && <button className="btn-primary" type="button" disabled={startSession.isPending} onClick={() => startSession.mutate()}>Inizia Sessione</button>}
    </div> : <>
      <div className="sessione-timer">
        <div className="timer-display"><span className="timer-value">{formatDuration(activeSession.data_inizio, now)}</span><span className="timer-label">Durata</span></div>
        {isDm && <button className="btn-secondary btn-small" type="button" disabled={finishSession.isPending} onClick={() => finishSession.mutate(activeSession.id)}>Fine Sessione</button>}
      </div>

      <div className="sessione-actions">
        {initiative.data
          ? <button className="btn-primary btn-small" type="button" onClick={() => navigate(buildAppPath('combattimento', { campagnaId, sessioneId: activeSession.id }))}>Ritorna al combattimento</button>
          : isDm && <button className="btn-primary btn-small" type="button" disabled={players.isLoading || initiative.isLoading || requestInitiative.isPending} onClick={() => requestInitiative.mutate(activeSession.id)}>Tirate iniziativa</button>}
        {isDm && <button className="btn-secondary btn-small" type="button" disabled={players.isLoading || requestGeneric.isPending || Boolean(genericGroup)} onClick={openRollModal}>Richiedi tiro</button>}
      </div>

      {isDm && genericGroup && <GenericRollTable
        group={genericGroup}
        label={genericGroup.tiroLabel ?? 'Tiri richiesti'}
        players={players.data ?? []}
        characters={characters.data ?? []}
        closing={closeGenericRolls.isPending}
        onClose={() => closeGenericRolls.mutate({ sessioneId: activeSession.id, richiestaId: genericGroup.richiestaId })}
      />}

      <div className="session-pg-cards">
        <div className="session-pg-cards-title">Personaggi</div>
        {!characters.data?.length ? <div className="campagna-pg-empty">Nessun personaggio in questa campagna.</div> : <div className="session-pg-cards-grid">
          {characters.data.map(character => <button className="session-pg-card" type="button" key={character.id} onClick={() => window.openSchedaPersonaggio?.(character.id)} title={character.nome}>
            <span className="session-pg-card-initials">{character.nome.slice(0, 2).toUpperCase()}</span><span className="session-pg-card-name">{character.nome}</span>
          </button>)}
        </div>}
      </div>

      {rollModalOpen && <RollRequestModal
        players={rollPlayers}
        selected={selectedPlayers}
        kind={rollKind}
        target={rollTarget}
        pending={requestGeneric.isPending}
        onClose={() => setRollModalOpen(false)}
        onKindChange={kind => {
          setRollKind(kind);
          setRollTarget(rollTargets(kind)[0][0]);
        }}
        onTargetChange={setRollTarget}
        onPlayerChange={(playerId, checked) => setSelectedPlayers(current =>
          checked ? [...current, playerId] : current.filter(id => id !== playerId))}
        onSubmit={() => requestGeneric.mutate({
          sessioneId: activeSession.id,
          playerIds: selectedPlayers,
          kind: rollKind,
          target: rollTarget,
          label: rollLabel(rollKind, rollTarget),
        })}
      />}
    </>}
  </div></ReactPage>;
}

function RollRequestModal({
  players,
  selected,
  kind,
  target,
  pending,
  onClose,
  onKindChange,
  onTargetChange,
  onPlayerChange,
  onSubmit,
}: {
  players: { id: string; name: string }[];
  selected: string[];
  kind: GenericRollKind;
  target: string;
  pending: boolean;
  onClose: () => void;
  onKindChange: (kind: GenericRollKind) => void;
  onTargetChange: (target: string) => void;
  onPlayerChange: (playerId: string, checked: boolean) => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return <div className="modal active" role="dialog" aria-modal="true" aria-labelledby="react-roll-title" onMouseDown={event => {
    if (event.currentTarget === event.target) onClose();
  }}>
    <div className="modal-content">
      <button className="modal-close" type="button" onClick={onClose} aria-label="Chiudi">×</button>
      <h2 id="react-roll-title">Richiedi Tiro</h2>
      <form className="richiedi-tiro-options" onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}>
        <div className="form-group">
          <label htmlFor="react-roll-kind">Tipo di tiro</label>
          <select id="react-roll-kind" value={kind} disabled={pending} onChange={event => onKindChange(event.target.value as GenericRollKind)}>
            <option value="salvezza">Tiro Salvezza</option>
            <option value="abilita">Tiro di Abilità</option>
            <option value="caratteristica">Prova di Caratteristica</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="react-roll-target">{kind === 'abilita' ? 'Abilità' : 'Caratteristica'}</label>
          <select id="react-roll-target" value={target} disabled={pending} onChange={event => onTargetChange(event.target.value)}>
            {rollTargets(kind).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <span>Giocatori</span>
          <div className="tiro-players-list">
            {!players.length ? <p>Nessun giocatore</p> : players.map(player => <div className="tiro-player-item" key={player.id}>
              <input id={`react-roll-player-${player.id}`} type="checkbox" checked={selected.includes(player.id)} disabled={pending} onChange={event => onPlayerChange(player.id, event.target.checked)} />
              <label htmlFor={`react-roll-player-${player.id}`}>{player.name}</label>
            </div>)}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" disabled={pending} onClick={onClose}>Annulla</button>
          <button type="submit" className="btn-primary" disabled={pending || !selected.length}>Richiedi</button>
        </div>
      </form>
    </div>
  </div>;
}

function GenericRollTable({
  group,
  label,
  players,
  characters,
  closing,
  onClose,
}: {
  group: GenericRollGroup;
  label: string;
  players: CampaignPlayer[];
  characters: CampaignCharacter[];
  closing: boolean;
  onClose: () => void;
}) {
  return <div className="tiro-generico-table">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
      <h3 style={{ margin: 0 }}>{label}</h3>
      <button className="btn-secondary btn-small" type="button" disabled={closing} onClick={onClose}>Chiudi</button>
    </div>
    <table>
      <thead><tr><th>Giocatore</th><th style={{ textAlign: 'right' }}>Risultato</th><th style={{ textAlign: 'center' }}>Stato</th></tr></thead>
      <tbody>{group.risultati.map(result => <tr key={result.id}>
        <td>{playerName(result.giocatore_id, players, characters)}</td>
        <td style={{ textAlign: 'right' }}><RollResult result={result} /></td>
        <td style={{ textAlign: 'center' }}>{result.stato === 'completed' ? '✓' : '⏳'}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function RollResult({ result }: { result: GenericRollRequest }) {
  if (result.valore == null) return <>-</>;
  const natural = result.tiro_naturale;
  if (natural !== 1 && natural !== 20) return <>{result.valore}</>;
  const modifier = result.valore - natural;
  return <><span style={{ color: '#e74c3c', fontWeight: 700 }}>{natural}</span><span style={{ fontSize: '0.8em', opacity: 0.7, marginLeft: 2 }}>{modifier >= 0 ? `+${modifier}` : modifier}</span> = {result.valore}</>;
}

function useSessionClock(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(interval);
  }, [active]);
  return now;
}

function rollTargets(kind: GenericRollKind) {
  return kind === 'abilita' ? SKILLS : ABILITIES;
}

function rollLabel(kind: GenericRollKind, target: string) {
  const targetName = rollTargets(kind).find(([value]) => value === target)?.[1] ?? target;
  if (kind === 'salvezza') return `Tiro salvezza su ${targetName}`;
  if (kind === 'abilita') return `Tiro di ${targetName}`;
  return `Prova di ${targetName}`;
}

function playerName(playerId: string, players: CampaignPlayer[], characters: CampaignCharacter[]) {
  return characters.find(character => character.player_user_id === playerId)?.nome
    ?? players.find(player => player.id === playerId)?.nome_utente
    ?? 'Giocatore';
}

function formatDuration(start: string | null | undefined, now: number) {
  if (!start) return '00:00';
  const minutes = Math.max(0, Math.floor((now - new Date(start).getTime()) / 60_000));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : String(error); }
function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>; }
