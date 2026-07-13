import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { queryKeys } from '../../query';
import { buildAppPath } from '../../router';
import { currentUserQuery } from '../auth/currentUserQuery';
import { charactersQuery } from './characterQueries';

declare global {
  interface Window {
    openTipoSchedaModal?: () => void;
    deletePersonaggio?: (id: string) => void;
    pgChangeSubclassFromCard?: (id: string) => void;
  }
}

export function CharactersPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const user = useQuery(currentUserQuery());
  const characters = useQuery(charactersQuery(user.data?.id ?? ''));

  useEffect(() => {
    const refresh = () => {
      if (user.data?.id) client.invalidateQueries({ queryKey: queryKeys.characters(user.data.id) });
    };
    window.addEventListener('companion:data-changed', refresh);
    return () => window.removeEventListener('companion:data-changed', refresh);
  }, [client, user.data?.id]);

  return <ReactPage name="personaggi"><div className="page-content">
    <div className="page-top-stack"><div className="page-header"><h1>Personaggi</h1></div></div>
    {user.isLoading || characters.isLoading ? <Placeholder text="Caricamento personaggi..." />
      : !user.data ? <Placeholder text="Accedi per vedere e creare i tuoi personaggi." />
        : characters.isError ? <Placeholder text="Impossibile caricare i personaggi." />
          : !characters.data?.length ? <Placeholder text="Non ci sono personaggi. Crea il tuo (ennesimo) alter ego!" />
            : <div className="personaggi-list">{characters.data.map(character => {
              const classes = character.classi?.length
                ? character.classi.map(item => `${item.nome} ${item.livello}`).join(' / ')
                : character.classe ?? '';
              const isMicro = character.tipo_scheda === 'micro';
              return <article className={`pg-card ${isMicro ? 'pg-card-micro' : ''}`} key={character.id}>
                <button className="react-character-main" type="button" onClick={() => navigate(buildAppPath('personaggio', { personaggioId: character.id }))}>
                  <span className="pg-card-header"><span className="pg-card-avatar">{character.nome.slice(0, 2).toUpperCase()}</span><span className="pg-card-identity"><span className="pg-card-name">{character.nome}{isMicro && <span className="pg-micro-badge"> μ</span>}</span><span className="pg-card-subtitle">{[character.razza, classes].filter(Boolean).join(' ')}</span></span><span className="pg-card-level">Lv {character.livello || 1}</span></span>
                  <span className="pg-card-campaigns">⚔ {character.campagne?.length ? character.campagne.join(', ') : 'Nessuna campagna'}</span>
                </button>
                <span className="pg-card-footer react-character-actions">
                  <button className="pg-card-action pg-card-subclass-btn" type="button" onClick={() => window.pgChangeSubclassFromCard?.(character.id)} aria-label="Cambia sottoclasse" title="Cambia sottoclasse"><Switch /></button>
                  <button className="pg-card-delete" type="button" onClick={() => window.deletePersonaggio?.(character.id)} aria-label="Elimina personaggio"><Trash /></button>
                </span>
              </article>;
            })}</div>}
    {user.data && <button className="btn-fab" type="button" onClick={() => window.openTipoSchedaModal?.()} aria-label="Crea Personaggio">+</button>}
  </div></ReactPage>;
}

function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Switch() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4m14-2v2a4 4 0 0 1-4 4H3" /></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2m3 0-1 16H6L5 6" /></svg>; }
