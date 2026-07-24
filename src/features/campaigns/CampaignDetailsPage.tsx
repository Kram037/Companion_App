import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { startCampaignSession } from '../../api';
import { ReactPage } from '../../app/ReactPage';
import { buildAppPath } from '../../router';
import { currentUserQuery } from '../auth/currentUserQuery';
import {
  activeSessionByCampaignQuery,
  campaignByIdQuery,
  campaignCharactersQuery,
  campaignPlayersQuery,
} from './campaignDetailQueries';
import { CampaignIcon } from './CampaignsListPage';

declare global {
  interface Window {
    deleteCampagna?: (id: string) => void;
    editDMField?: (id: string) => void;
    editDataCreazione?: (id: string) => void;
    editNumeroSessioni?: (id: string) => void;
    editTempoGioco?: (id: string) => void;
    openInvitaGiocatoriModal?: (id: string) => void;
    openScegliPersonaggioModal?: (id: string) => void;
    openSchedaPersonaggio?: (id: string) => void;
  }
}

export function CampaignDetailsPage() {
  const { campagnaId = '' } = useParams();
  const navigate = useNavigate();
  const campaign = useQuery(campaignByIdQuery(campagnaId));
  const session = useQuery(activeSessionByCampaignQuery(campagnaId));
  const players = useQuery(campaignPlayersQuery(campagnaId));
  const characters = useQuery(campaignCharactersQuery(campagnaId));
  const user = useQuery(currentUserQuery());
  const startSession = useMutation({
    mutationFn: () => startCampaignSession(campagnaId),
    onSuccess: async started => {
      window.setAppNavigationState?.({ campagnaId, sessioneId: started.id }, 'react-start-session');
      if (window.AppState) window.AppState.activeSessionCampagnaId = campagnaId;
      sessionStorage.setItem('activeSessionCampagnaId', campagnaId);
      window.sendAppEventBroadcast?.({ table: 'sessioni', action: 'insert', campagnaId, sessioneId: started.id });
      navigate(buildAppPath('sessione', { campagnaId }));
    },
    onError: error => window.showNotification?.(`Errore nell'avvio della sessione: ${errorMessage(error)}`),
  });

  const data = campaign.data;
  if (campaign.isLoading || session.isLoading || players.isLoading || characters.isLoading || user.isLoading) {
    return <ReactPage name="dettagli"><Placeholder text="Caricamento dettagli..." /></ReactPage>;
  }
  if (campaign.isError || session.isError || players.isError || characters.isError || user.isError) {
    return <ReactPage name="dettagli"><Placeholder text="Impossibile caricare la campagna." /></ReactPage>;
  }
  if (!data) return <ReactPage name="dettagli"><Placeholder text="Campagna non trovata." /></ReactPage>;

  const isDm = data.id_dm === user.data?.id;
  const currentCharacter = characters.data?.find(character => character.player_user_id === user.data?.id);

  const openSession = () => {
    if (!isDm && !currentCharacter) {
      window.openScegliPersonaggioModal?.(campagnaId);
      return;
    }
    if (session.data) navigate(buildAppPath('sessione', { campagnaId }));
    else if (isDm) startSession.mutate();
  };

  return <ReactPage name="dettagli"><div className="page-content dettagli-content">
    <div className="page-top-stack"><div className="page-header page-header-with-back">
      <button className="page-header-back" type="button" onClick={() => navigate(buildAppPath('campagne'))} aria-label="Torna alle campagne"><Back /></button>
      <h1>{data.nome_campagna}</h1>
    </div></div>

    <div className="dettagli-header">
      <div className="dettagli-icon-container"><CampaignIcon name={data.icona_name} detail /></div>
      <div className="dettagli-actions">
        <div className="dettagli-actions-top">
          {isDm
            ? <><button className="btn-secondary btn-small" type="button" onClick={() => window.openCampagnaModal?.(campagnaId)}><Edit />Modifica</button><button className="btn-secondary btn-small" style={{ color: '#dc3545' }} type="button" onClick={() => window.deleteCampagna?.(campagnaId)}><Trash />Elimina</button></>
            : <button className="btn-secondary btn-small" type="button" onClick={() => window.openScegliPersonaggioModal?.(campagnaId)}><User />{currentCharacter?.nome ?? 'Scegli personaggio'}</button>}
        </div>
        {(isDm || session.data) && <div className="dettagli-actions-start"><button className={`btn-primary btn-small ${session.data ? '' : 'btn-start-session'}`} type="button" disabled={startSession.isPending} onClick={openSession}>{session.data ? <Clock /> : <Play />}{session.data ? 'Sessione Attiva' : 'Inizia Sessione'}</button></div>}
      </div>
    </div>

    <section className="dettagli-section dettagli-main-info">
      <h2 className="dettagli-section-title">Informazioni</h2>
      <div className="dettagli-info-grid">
        <Info label="DM" value={data.dm_nome ?? 'DM sconosciuto'} action={isDm ? () => window.editDMField?.(campagnaId) : undefined} />
        <Info label="Giocatori" value={String(players.data?.length ?? 0)} action={isDm ? () => window.openInvitaGiocatoriModal?.(campagnaId) : undefined} />
        <Info label="Creata il" value={formatDate(data.data_creazione ?? data.created_at)} action={isDm ? () => window.editDataCreazione?.(campagnaId) : undefined} />
      </div>
    </section>

    <section className="dettagli-section dettagli-stats">
      <h2 className="dettagli-section-title">Statistiche</h2>
      <div className="stats-grid">
        <Stat icon="📊" label="Sessioni" value={String(data.numero_sessioni ?? 0)} action={isDm ? () => window.editNumeroSessioni?.(campagnaId) : undefined} />
        <Stat icon="⏱️" label="Tempo di gioco" value={formatPlayTime(data.tempo_di_gioco)} action={isDm ? () => window.editTempoGioco?.(campagnaId) : undefined} />
      </div>
    </section>

    <section className="dettagli-section dettagli-personaggi-section">
      <h2 className="dettagli-section-title">Personaggi</h2>
      {!characters.data?.length ? <div className="campagna-pg-empty">Nessun personaggio in questa campagna.</div> : <div className="session-pg-cards-grid">{characters.data.map(character => <button className="session-pg-card" type="button" key={character.id} onClick={() => window.openSchedaPersonaggio?.(character.id)}><span className="session-pg-card-initials">{character.nome.slice(0, 2).toUpperCase()}</span><span className="session-pg-card-name">{character.nome}</span></button>)}</div>}
    </section>

    {!!data.note?.length && <section className="dettagli-section dettagli-notes-section"><h2 className="dettagli-section-title">Note</h2><div className="dettagli-notes-content">{data.note.join(', ')}</div></section>}
  </div></ReactPage>;
}

function Info({ label, value, action }: { label: string; value: string; action?: () => void }) {
  return <div className="info-item"><span className="info-label">{label}:</span><span className="info-value">{value}</span>{action ? <button className="btn-icon-small" type="button" onClick={action} aria-label={`Modifica ${label}`}><Edit /></button> : <span />}</div>;
}

function Stat({ icon, label, value, action }: { icon: string; label: string; value: string; action?: () => void }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div className="stat-content"><span className="stat-label">{label}</span><span className="stat-value">{value}</span></div>{action && <button className="btn-icon-small stat-edit" type="button" onClick={action} aria-label={`Modifica ${label}`}><Edit /></button>}</div>;
}

function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('it-IT') : 'N/A'; }
function formatPlayTime(minutes?: number | null) { return minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '0 min'; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : String(error); }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>; }
function Edit() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v16h16v-7M18.5 2.5l3 3L12 15l-4 1 1-4z" /></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>; }
function User() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function Clock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function Play() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>; }
