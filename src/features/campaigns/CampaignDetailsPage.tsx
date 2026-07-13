import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import { currentUserQuery } from '../auth/currentUserQuery';
import {
  activeSessionByCampaignQuery,
  campaignByIdQuery,
  campaignCharactersQuery,
  campaignPlayersQuery,
} from './campaignDetailQueries';

declare global {
  interface Window {
    deleteCampagna?: (id: string) => void;
    editDMField?: (id: string) => void;
    editDataCreazione?: (id: string) => void;
    editNumeroSessioni?: (id: string) => void;
    editTempoGioco?: (id: string) => void;
    iniziaSessione?: (id: string) => void;
    openInvitaGiocatoriModal?: (id: string) => void;
    openScegliPersonaggioModal?: (id: string) => void;
    playerJoinSession?: (id: string) => void;
  }
}

export function CampaignDetailsPage() {
  const { campagnaId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const campaign = useQuery(campaignByIdQuery(campagnaId));
  const session = useQuery(activeSessionByCampaignQuery(campagnaId));
  const players = useQuery(campaignPlayersQuery(campagnaId));
  const characters = useQuery(campaignCharactersQuery(campagnaId));
  const user = useQuery(currentUserQuery());

  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ table?: string; campagnaId?: string }>).detail;
      if (detail?.campagnaId && detail.campagnaId !== campagnaId) return;
      client.invalidateQueries({ queryKey: queryKeys.campaign(campagnaId) });
      client.invalidateQueries({ queryKey: queryKeys.campaignPlayers(campagnaId) });
      client.invalidateQueries({ queryKey: queryKeys.campaignCharacters(campagnaId) });
      client.invalidateQueries({ queryKey: queryKeys.session(campagnaId) });
    };
    window.addEventListener('companion:data-changed', refresh);
    window.addEventListener('companion:campaigns-changed', refresh);
    return () => {
      window.removeEventListener('companion:data-changed', refresh);
      window.removeEventListener('companion:campaigns-changed', refresh);
    };
  }, [campagnaId, client]);

  const data = campaign.data;
  if (campaign.isLoading) return <ReactPage name="dettagli"><Placeholder text="Caricamento dettagli..." /></ReactPage>;
  if (!data) return <ReactPage name="dettagli"><Placeholder text="Campagna non trovata." /></ReactPage>;

  const isDm = data.id_dm === user.data?.id;
  const currentCharacter = characters.data?.find(character => character.player_user_id === user.data?.id);
  const openSession = () => session.data
    ? navigate(buildAppPath('sessione', { campagnaId }))
    : isDm ? window.iniziaSessione?.(campagnaId) : window.playerJoinSession?.(campagnaId);

  return <ReactPage name="dettagli"><div className="page-content dettagli-content">
    <div className="page-top-stack"><div className="page-header page-header-with-back">
      <button className="page-header-back" type="button" onClick={() => navigate(buildAppPath('campagne'))} aria-label="Torna alle campagne"><Back /></button>
      <h1>{data.nome_campagna}</h1>
    </div></div>

    <div className="dettagli-header">
      <div className="dettagli-icon-container"><span className="dettagli-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5" /></svg></span></div>
      <div className="dettagli-actions">
        <div className="dettagli-actions-top">
          {isDm
            ? <><button className="btn-secondary btn-small" type="button" onClick={() => window.openCampagnaModal?.(campagnaId)}>Modifica</button><button className="btn-secondary btn-small danger-text" type="button" onClick={() => window.deleteCampagna?.(campagnaId)}>Elimina</button></>
            : <button className="btn-secondary btn-small" type="button" onClick={() => window.openScegliPersonaggioModal?.(campagnaId)}>{currentCharacter?.nome ?? 'Scegli personaggio'}</button>}
        </div>
        {(isDm || session.data) && <div className="dettagli-actions-start"><button className="btn-primary btn-small" type="button" onClick={openSession}>{session.data ? 'Sessione Attiva' : 'Inizia Sessione'}</button></div>}
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
        <Stat label="Sessioni" value={String(data.numero_sessioni ?? 0)} action={isDm ? () => window.editNumeroSessioni?.(campagnaId) : undefined} />
        <Stat label="Tempo di gioco" value={formatPlayTime(data.tempo_di_gioco)} action={isDm ? () => window.editTempoGioco?.(campagnaId) : undefined} />
      </div>
    </section>

    <section className="dettagli-section dettagli-personaggi-section">
      <h2 className="dettagli-section-title">Personaggi</h2>
      {!characters.data?.length ? <div className="campagna-pg-empty">Nessun personaggio in questa campagna.</div> : <div className="session-pg-cards-grid">{characters.data.map(character => <button className="session-pg-card" type="button" key={character.id} onClick={() => navigate(buildAppPath('personaggio', { personaggioId: character.id }))}><span className="session-pg-card-initials">{character.nome.slice(0, 2).toUpperCase()}</span><span className="session-pg-card-name">{character.nome}</span></button>)}</div>}
    </section>

    {!!data.note?.length && <section className="dettagli-section dettagli-notes-section"><h2 className="dettagli-section-title">Note</h2><div className="dettagli-notes-content">{data.note.join(', ')}</div></section>}
  </div></ReactPage>;
}

function Info({ label, value, action }: { label: string; value: string; action?: () => void }) {
  return <div className="info-item"><span className="info-label">{label}:</span><span className="info-value">{value}</span>{action ? <button className="btn-icon-small" type="button" onClick={action} aria-label={`Modifica ${label}`}><Edit /></button> : <span />}</div>;
}

function Stat({ label, value, action }: { label: string; value: string; action?: () => void }) {
  return <div className="stat-card"><div className="stat-content"><span className="stat-label">{label}</span><span className="stat-value">{value}</span></div>{action && <button className="btn-icon-small stat-edit" type="button" onClick={action} aria-label={`Modifica ${label}`}><Edit /></button>}</div>;
}

function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('it-IT') : 'N/A'; }
function formatPlayTime(minutes?: number | null) { return minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : '0 min'; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7 7-7-7 7-7" /></svg>; }
function Edit() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v16h16v-7M18.5 2.5l3 3L12 15l-4 1 1-4z" /></svg>; }
