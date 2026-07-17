import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { startCampaignSession } from '../../api';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import { currentUserQuery } from '../auth/currentUserQuery';
import {
  activeSessionByCampaignQuery,
  campaignByIdQuery,
  campaignCharactersQuery,
  initiativeRequestsQuery,
} from './campaignDetailQueries';

declare global {
  interface Window {
    finisciSessione?: (sessioneId: string, campagnaId: string) => void;
    richiediTiroIniziativa?: (sessioneId: string, campagnaId: string) => void;
    richiediTiroGenerico?: (sessioneId: string, campagnaId: string) => void;
  }
}

export function SessionPage() {
  const { campagnaId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const campaign = useQuery(campaignByIdQuery(campagnaId));
  const session = useQuery(activeSessionByCampaignQuery(campagnaId));
  const characters = useQuery(campaignCharactersQuery(campagnaId));
  const user = useQuery(currentUserQuery());
  const initiative = useQuery(initiativeRequestsQuery(session.data?.id ?? ''));
  const now = useSessionClock(Boolean(session.data));
  const startSession = useMutation({
    mutationFn: () => startCampaignSession(campagnaId),
    onSuccess: async started => {
      client.setQueryData(queryKeys.session(campagnaId), started);
      client.invalidateQueries({ queryKey: queryKeys.session(campagnaId) });
      window.setAppNavigationState?.({ campagnaId, sessioneId: started.id }, 'react-start-session');
      window.AppState.activeSessionCampagnaId = campagnaId;
      sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
      window.sendAppEventBroadcast?.({ table: 'sessioni', action: 'insert', campagnaId, sessioneId: started.id });
    },
  });

  useEffect(() => {
    window.setAppNavigationState?.({ campagnaId, sessioneId: session.data?.id ?? null }, 'react-session');
  }, [campagnaId, session.data?.id]);

  useEffect(() => () => {
    const legacy = window as Window & { tiroGenericoPollingInterval?: number | null };
    if (legacy.tiroGenericoPollingInterval) clearInterval(legacy.tiroGenericoPollingInterval);
    legacy.tiroGenericoPollingInterval = null;
  }, []);

  if (campaign.isLoading || session.isLoading) {
    return <ReactPage name="sessione"><Placeholder text="Caricamento sessione..." /></ReactPage>;
  }

  const data = campaign.data;
  if (!data) return <ReactPage name="sessione"><Placeholder text="Campagna non trovata." /></ReactPage>;

  const isDm = data.id_dm === user.data?.id;
  const activeSession = session.data;
  const sessionNumber = (data.numero_sessioni ?? 0) + 1;

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
        {isDm && <button className="btn-secondary btn-small" type="button" onClick={() => window.finisciSessione?.(activeSession.id, campagnaId)}>Fine Sessione</button>}
      </div>

      <div className="sessione-actions">
        {initiative.data
          ? <button className="btn-primary btn-small" type="button" onClick={() => navigate(buildAppPath('combattimento', { campagnaId, sessioneId: activeSession.id }))}>Ritorna al combattimento</button>
          : isDm && <button className="btn-primary btn-small" type="button" onClick={() => window.richiediTiroIniziativa?.(activeSession.id, campagnaId)}>Tirate iniziativa</button>}
        {isDm && <button className="btn-secondary btn-small" type="button" onClick={() => window.richiediTiroGenerico?.(activeSession.id, campagnaId)}>Richiedi tiro</button>}
      </div>

      <div id="tiroGenericoTable" className="tiro-generico-table" style={{ display: 'none' }} />
      <div className="session-pg-cards">
        <div className="session-pg-cards-title">Personaggi</div>
        {!characters.data?.length ? <div className="campagna-pg-empty">Nessun personaggio in questa campagna.</div> : <div className="session-pg-cards-grid">
          {characters.data.map(character => <button className="session-pg-card" type="button" key={character.id} onClick={() => navigate(buildAppPath('personaggio', { personaggioId: character.id }))} title={character.nome}>
            <span className="session-pg-card-initials">{character.nome.slice(0, 2).toUpperCase()}</span><span className="session-pg-card-name">{character.nome}</span>
          </button>)}
        </div>}
      </div>
    </>}
  </div></ReactPage>;
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

function formatDuration(start: string | null | undefined, now: number) {
  if (!start) return '00:00';
  const minutes = Math.max(0, Math.floor((now - new Date(start).getTime()) / 60_000));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>; }
