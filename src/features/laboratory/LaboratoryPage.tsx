import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { deleteHomebrewItem, updateUserHomebrewSettings, type HomebrewTable } from '../../api';
import { ReactPage } from '../../app/ReactPage';
import { queryKeys } from '../../query';
import type { HomebrewItem, HomebrewSettings, UserProfile } from '../../types/domain';
import { currentUserQuery } from '../auth/currentUserQuery';
import { activeLaboratoryCategory, laboratoryTable, selectLaboratoryRows } from './laboratoryModel';
import { homebrewFriendsQuery, laboratoryItemsQuery } from './laboratoryQueries';

interface LabEntry { key: string; label: string; iconFile: string }
interface LabList { items: HomebrewItem[]; activeFilters: number; hasFilters: boolean }
interface NavigateDetail { view?: 'hub' | 'sub'; tab?: string; subtab?: string; state?: Record<string, unknown> }

declare global {
  interface Window {
    getLaboratorioReactConfig?: () => LabEntry[];
    getLaboratorioReactList?: (tab: string, items: HomebrewItem[], search: string) => LabList;
    getLaboratorioReactCardDetail?: (item: HomebrewItem, tab: string) => string;
    setLaboratorioReactState?: (state: Record<string, unknown>) => void;
    openLaboratorioReactEditor?: (tab: string, activeTab: string, item?: HomebrewItem) => void;
    labListOpenFiltersDialog?: (tab: string) => void;
    showConfirm?: (message: string) => Promise<boolean>;
    showNotification?: (message: string) => void;
    __pendingLaboratorioTarget?: { tab?: string };
  }
}

const DESKTOP_QUERY = '(min-width: 900px), (orientation: landscape) and (min-width: 760px) and (min-height: 540px)';
const SUBTABS: Record<string, string[][]> = {
  classi: [['classi', 'Classi'], ['sottoclassi', 'Sottoclassi']],
  talenti: [['talenti', 'Talenti'], ['stili', 'Stili']],
  nemici: [['nemici', 'Mostri'], ['combattimenti', 'Combattimenti']],
};
const CARD_ICONS: Record<string, string> = {
  background: 'Background', classi: 'Classi', sottoclassi: 'Classi', incantesimi: 'Incantesimi',
  nemici: 'Mostri e Combattimenti', combattimenti: 'Mostri e Combattimenti', oggetti: 'Equipaggiamento',
  razze: 'Razze', stili: 'Talenti e Stili', suppliche: 'Suppliche', talenti: 'Talenti e Stili',
};

export function LaboratoryPage() {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<LabEntry[]>([]);
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  const pendingTargetHandled = useRef(false);
  const tab = params.get('tab') || '';
  const subtab = params.get('sub') || SUBTABS[tab]?.[0]?.[0] || tab;
  const activeCategory = activeLaboratoryCategory(tab, subtab);
  const table = laboratoryTable(activeCategory);
  const user = useQuery(currentUserQuery());
  const userId = user.data?.uid || user.data?.id || '';
  const items = useQuery(laboratoryItemsQuery(table, userId));

  useEffect(() => {
    let active = true;
    window.ensureRuntimeScript?.('laboratorio').then(() => {
      if (!active) return;
      setConfig(window.getLaboratorioReactConfig?.() ?? []);
      setReady(true);
      const pending = window.__pendingLaboratorioTarget;
      if (pending) {
        pendingTargetHandled.current = true;
        delete window.__pendingLaboratorioTarget;
        openTab(pending.tab || 'razze');
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || tab || pendingTargetHandled.current || !window.matchMedia(DESKTOP_QUERY).matches) return;
    openTab(window.getDesktopDefaultGroupTab?.('laboratorio') || 'razze');
  }, [ready, tab]);

  useEffect(() => {
    const refresh = () => {
      setRevision(value => value + 1);
      if (userId) client.invalidateQueries({ queryKey: queryKeys.homebrew(userId) });
    };
    const navigate = (event: Event) => {
      const next = (event as CustomEvent<NavigateDetail>).detail || {};
      const restored = next.state || {};
      setSearch(String((restored.listState as Record<string, { search?: string }>)?.[next.subtab || next.tab || '']?.search || ''));
      if (next.view === 'hub') openTab('');
      else openTab(next.tab || tab || 'razze', next.subtab || '');
    };
    window.addEventListener('companion:laboratory-refresh', refresh);
    window.addEventListener('companion:laboratory-navigate', navigate);
    return () => {
      window.removeEventListener('companion:laboratory-refresh', refresh);
      window.removeEventListener('companion:laboratory-navigate', navigate);
    };
  }, [client, tab, userId]);

  const selectedRows = useMemo(() => selectLaboratoryRows(items.data || [], activeCategory), [activeCategory, items.data]);
  const list = useMemo(() => ready
    ? window.getLaboratorioReactList?.(activeCategory, selectedRows, search) ?? { items: selectedRows, activeFilters: 0, hasFilters: false }
    : { items: [], activeFilters: 0, hasFilters: false }, [activeCategory, ready, revision, search, selectedRows]);

  useEffect(() => {
    window.setLaboratorioReactState?.({ view: tab ? 'sub' : 'hub', tab: tab || 'razze', subtab, search });
    window.updateDesktopSidebarActive?.();
    window.scheduleActiveBookmarkCapture?.(80);
  }, [search, subtab, tab]);

  const remove = useMutation({
    mutationFn: ({ targetTable, id }: { targetTable: HomebrewTable; id: string }) => deleteHomebrewItem(targetTable, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.homebrew(userId) });
      window.showNotification?.('Eliminato');
    },
    onError: () => window.showNotification?.('Errore nella cancellazione'),
  });

  function openTab(nextTab: string, nextSubtab = '') {
    const next = new URLSearchParams();
    if (nextTab) next.set('tab', nextTab);
    const initialSubtab = nextSubtab || SUBTABS[nextTab]?.[0]?.[0] || '';
    if (initialSubtab) next.set('sub', initialSubtab);
    setParams(next);
    if (nextTab !== tab || initialSubtab !== subtab) setSearch('');
  }

  async function removeItem(item: HomebrewItem) {
    if (window.showConfirm && !await window.showConfirm('Eliminare questo contenuto homebrew?')) return;
    remove.mutate({ targetTable: table, id: item.id });
  }

  if (!tab) return <ReactPage name="laboratorio"><LaboratoryHub entries={config} onOpen={openTab} /></ReactPage>;

  const entry = config.find(item => item.key === tab);
  const title = tab === 'impostazioni' ? 'Impostazioni' : entry?.label || 'Laboratorio';
  return <ReactPage name="laboratorio"><div className="page-content laboratorio-content react-laboratory-page">
    <div className="page-top-stack">
      <div className="page-header page-header-with-back"><button className="page-header-back" type="button" onClick={() => window.matchMedia(DESKTOP_QUERY).matches ? openTab('razze') : openTab('')} aria-label="Indietro"><Back /></button><h1>{title}</h1></div>
      {tab !== 'impostazioni' && <SearchTools value={search} onChange={setSearch} list={list} onFilters={() => window.labListOpenFiltersDialog?.(activeCategory)} />}
    </div>
    <main className="lab-content react-laboratory-content">
      {tab === 'impostazioni' ? <LaboratorySettings user={user.data} /> : <>
        {SUBTABS[tab] && <SubTabs options={SUBTABS[tab]} value={subtab} onChange={next => openTab(tab, next)} />}
        {!user.data && !user.isLoading ? <Placeholder text="Accedi per creare i tuoi contenuti homebrew." />
          : items.isLoading ? <Placeholder text="Caricamento contenuti homebrew..." />
            : items.isError ? <Placeholder text="Errore nel caricamento." />
              : <div className="lab-list">{list.items.map(item => <LaboratoryCard item={item} category={activeCategory}
                onOpen={() => window.openLaboratorioReactEditor?.(tab, activeCategory, item)} onDelete={() => removeItem(item)} key={item.id} />)}
                {!list.items.length && <Placeholder text="Nessun contenuto homebrew. Premi + per crearne uno." />}
              </div>}
      </>}
    </main>
    {user.data && tab !== 'impostazioni' && <button className="btn-fab" type="button" onClick={() => window.openLaboratorioReactEditor?.(tab, activeCategory)} aria-label="Crea Homebrew">+</button>}
  </div></ReactPage>;
}

function LaboratoryHub({ entries, onOpen }: { entries: LabEntry[]; onOpen: (tab: string) => void }) {
  return <div className="page-content laboratorio-content react-laboratory-hub">
    <div className="page-top-stack"><div className="page-header"><h1>Laboratorio</h1></div></div>
    <div className="lab-hub-subtitle-row"><p className="lab-hub-subtitle">Il tuo mondo, le tue regole</p><button className="lab-settings-quick-btn" type="button" onClick={() => onOpen('impostazioni')} aria-label="Impostazioni"><Cog /></button></div>
    <div className="lab-hub-grid">{pairRows(entries).map((row, index) => <div className="lab-hub-row" key={index}>{row.map(entry => <button className="lab-hub-card" type="button" onClick={() => onOpen(entry.key)} key={entry.key}>
      <span className="lab-hub-card-icon"><img className="lab-hub-icon-img" src={`images/Tabs/${encodeURIComponent(entry.iconFile)}.svg`} alt="" /></span><span className="lab-hub-card-label">{entry.label}</span>
    </button>)}</div>)}</div>
  </div>;
}

function LaboratoryCard({ item, category, onOpen, onDelete }: { item: HomebrewItem; category: string; onOpen: () => void; onDelete: () => void }) {
  const detail = window.getLaboratorioReactCardDetail?.(item, category) || '';
  const icon = CARD_ICONS[category];
  return <article className="lab-card lab-card-clickable" onClick={onOpen}>
    <div className="lab-card-icon">{icon && <img className="lab-card-icon-img" src={`images/Tabs/${encodeURIComponent(icon)}.svg`} alt="" />}</div>
    <div className="lab-card-info"><p className="lab-card-name">{item.nome}</p>{detail && <p className="lab-card-detail">{detail}</p>}</div>
    <div className="lab-card-actions"><button className="lab-delete" type="button" onClick={event => { event.stopPropagation(); onDelete(); }} aria-label="Elimina"><Trash /></button></div>
  </article>;
}

function SearchTools({ value, onChange, list, onFilters }: { value: string; onChange: (value: string) => void; list: LabList; onFilters: () => void }) {
  return <div className="comp-toolbar page-tools-row react-laboratory-tools"><label className="comp-search-wrap"><Search /><input className="comp-search" type="search" value={value} onChange={event => onChange(event.target.value)} placeholder="Cerca..." /></label>
    {list.hasFilters && <button className="comp-filter-btn" type="button" onClick={onFilters}><Sliders /><span>Filtri</span>{list.activeFilters > 0 && <strong>{list.activeFilters}</strong>}</button>}</div>;
}

function SubTabs({ options, value, onChange }: { options: string[][]; value: string; onChange: (value: string) => void }) {
  return <div className="lab-subtabs">{options.map(([key, label]) => <button className={`lab-subtab ${key === value ? 'active' : ''}`} type="button" onClick={() => onChange(key)} key={key}>{label}</button>)}</div>;
}

function LaboratorySettings({ user }: { user?: UserProfile | null }) {
  const client = useQueryClient();
  const friends = useQuery(homebrewFriendsQuery(user?.id || ''));
  const mutation = useMutation({
    mutationFn: (settings: HomebrewSettings) => updateUserHomebrewSettings(user!.id, settings),
    onSuccess: (_, settings) => client.setQueryData(queryKeys.currentUser(), (current: UserProfile | null | undefined) => current ? { ...current, homebrew_settings: settings } : current),
  });
  if (!user) return <Placeholder text="Accedi per gestire le impostazioni." />;
  const settings = user.homebrew_settings || { enabled: true, amici_abilitati: [] };
  const update = (next: HomebrewSettings) => mutation.mutate(next);
  return <div className="lab-settings">
    <section className="lab-settings-section"><div className="lab-settings-row"><span className="lab-settings-label">Mostra contenuti homebrew</span><label className="lab-toggle"><input type="checkbox" checked={settings.enabled !== false} onChange={event => update({ ...settings, enabled: event.target.checked })} /><span className="lab-toggle-slider" /></label></div>
      <p className="lab-settings-hint">Quando attivo, i contenuti homebrew tuoi e degli amici selezionati saranno visibili durante la creazione dei personaggi.</p></section>
    <section className="lab-settings-section"><h2 className="lab-settings-section-title">Homebrew degli amici</h2><p className="lab-settings-hint">Seleziona gli amici di cui vuoi visualizzare i contenuti homebrew.</p>
      <div className="lab-settings-friends">{friends.data?.map(friend => <label className="lab-settings-friend" key={friend.id}><input type="checkbox" checked={settings.amici_abilitati.includes(friend.id)} onChange={event => update({ ...settings, amici_abilitati: event.target.checked ? [...new Set([...settings.amici_abilitati, friend.id])] : settings.amici_abilitati.filter(id => id !== friend.id) })} /><span>{friend.nome}{friend.cid ? ` #${friend.cid}` : ''}</span></label>)}
        {!friends.isLoading && !friends.data?.length && <p className="lab-empty">Nessun amico aggiunto</p>}</div></section>
  </div>;
}

function pairRows<T>(items: T[]) { return Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => items.slice(index * 2, index * 2 + 2)); }
function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>; }
function Search() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>; }
function Sliders() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></svg>; }
function Cog() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.07 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.07V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.93 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>; }
function Trash() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M3 6h18M8 6V4h8v2m3 0-1 16H6L5 6" /></svg>; }
