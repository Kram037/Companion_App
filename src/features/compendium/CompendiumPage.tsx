import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { ReactPage } from '../../app/ReactPage';
import { LegacyFragment } from '../../components/LegacyFragment';
import { compendiumDataQuery, type CompendiumData } from './compendiumQueries';
import { filterCompendiumItems, groupCompendiumItems, sortCompendiumItems, type CompendiumItem } from './compendiumModel';

interface HubEntry { key: string; label: string; iconFile: string; shortLabel?: string }
interface CompendiumConfig { tabs: HubEntry[]; equipment: HubEntry[] }
interface DetailData { title: string; content: string }
interface NavigateDetail { view?: 'hub' | 'sub'; tab?: string; section?: string; detail?: string; state?: Record<string, unknown> }

declare global {
  interface Window {
    ensureRuntimeScript?: (key: string) => Promise<void>;
    getCompendioReactConfig?: () => CompendiumConfig;
    getCompendioReactData?: (request: { tab: string; section: string; kind: string; search: string }) => Promise<CompendiumData>;
    getCompendioReactDetail?: (tab: string, id: string) => Promise<DetailData | null>;
    setCompendioReactState?: (state: Record<string, unknown>) => void;
    compendioOpenFilters?: () => void;
    compendioOpenObjectsFilters?: () => void;
    compendioOpenObjectDetail?: (source: string, id: string) => void;
    compendioOpenEquipmentDetail?: (section: string, id: string) => void;
    getDesktopDefaultGroupTab?: (page: string) => string;
    updateDesktopSidebarActive?: () => void;
    scheduleActiveBookmarkCapture?: (delay?: number) => void;
    __pendingCompendioTarget?: { tab?: string; section?: string };
  }
}

const DESKTOP_QUERY = '(min-width: 900px), (orientation: landscape) and (min-width: 760px) and (min-height: 540px)';

export function CompendiumPage() {
  const [params, setParams] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<CompendiumConfig>({ tabs: [], equipment: [] });
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [revision, setRevision] = useState(0);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pendingTargetHandled = useRef(false);
  const tab = params.get('tab') || '';
  const section = params.get('section') || '';
  const detailId = params.get('detail') || '';
  const deferredSearch = useDeferredValue(search, 120);

  useEffect(() => {
    let active = true;
    window.ensureRuntimeScript?.('compendio').then(() => {
      if (!active) return;
      setConfig(window.getCompendioReactConfig?.() ?? { tabs: [], equipment: [] });
      setReady(true);
      const pending = window.__pendingCompendioTarget;
      if (pending) {
        pendingTargetHandled.current = true;
        delete window.__pendingCompendioTarget;
        openLocation(pending.tab || 'razze', pending.section || '');
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || tab || pendingTargetHandled.current || !window.matchMedia(DESKTOP_QUERY).matches) return;
    openLocation(window.getDesktopDefaultGroupTab?.('compendio') || 'razze');
  }, [ready, tab]);

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const navigate = (event: Event) => {
      const next = (event as CustomEvent<NavigateDetail>).detail || {};
      const restored = next.state || {};
      setSearch(String(restored.search || ''));
      setKind(String(restored.kind || ''));
      setOpenGroups((restored.openGroups as Record<string, boolean>) || {});
      if (next.view === 'hub') openLocation('');
      else openLocation(next.tab || tab || 'razze', next.section || '', next.detail || String((restored.detail as { id?: string })?.id || ''));
    };
    window.addEventListener('companion:compendium-refresh', refresh);
    window.addEventListener('companion:compendium-navigate', navigate);
    return () => {
      window.removeEventListener('companion:compendium-refresh', refresh);
      window.removeEventListener('companion:compendium-navigate', navigate);
    };
  }, [tab]);

  useEffect(() => {
    window.setCompendioReactState?.({
      view: tab ? 'sub' : 'hub', tab: tab || 'razze',
      tabState: { search, kind, equipmentSection: section, detail: detailId ? { id: detailId } : null, openGroups },
    });
    window.updateDesktopSidebarActive?.();
    window.scheduleActiveBookmarkCapture?.(80);
  }, [detailId, kind, openGroups, search, section, tab]);

  const data = useQuery(compendiumDataQuery(tab, section, kind, deferredSearch, revision, ready));
  const detail = useQuery({
    queryKey: ['compendiumDetail', tab, detailId, revision],
    queryFn: () => window.getCompendioReactDetail!(tab, detailId),
    enabled: ready && Boolean(tab && detailId),
    staleTime: Infinity,
  });

  function openLocation(nextTab: string, nextSection = '', nextDetail = '') {
    const next = new URLSearchParams();
    if (nextTab) next.set('tab', nextTab);
    if (nextSection) next.set('section', nextSection);
    if (nextDetail) next.set('detail', nextDetail);
    setParams(next);
    if (nextTab !== tab) {
      setSearch('');
      setKind('');
      setOpenGroups({});
    }
  }

  function goBack() {
    if (detailId) return openLocation(tab, section);
    if (tab === 'oggetti' && section && !window.matchMedia(DESKTOP_QUERY).matches) return openLocation('oggetti');
    if (window.matchMedia(DESKTOP_QUERY).matches) return openLocation('razze');
    openLocation('');
  }

  if (!tab) return <ReactPage name="compendio"><CompendiumHub config={config} onOpen={openLocation} /></ReactPage>;

  const title = detail.data?.title || (tab === 'oggetti' && section
    ? config.equipment.find(entry => entry.key === section)?.label
    : config.tabs.find(entry => entry.key === tab)?.label) || 'Compendio';

  return <ReactPage name="compendio"><div className="page-content compendio-content react-compendium-page">
    <div className="page-top-stack">
      <div className="page-header comp-sub-header page-header-with-back">
        <button className="page-header-back" type="button" onClick={goBack} aria-label="Indietro"><Back /></button>
        <h1>{title}</h1>
      </div>
      {!detailId && section && <SearchTools value={search} setValue={setSearch} data={data.data} onFilters={() => window.compendioOpenObjectsFilters?.()} />}
      {!detailId && tab !== 'oggetti' && <SearchTools value={search} setValue={setSearch} data={data.data} onFilters={() => window.compendioOpenFilters?.()} />}
    </div>
    <main className="comp-content react-compendium-content">
      {detailId ? <DetailContent detail={detail} refresh={() => setRevision(value => value + 1)} />
        : tab === 'oggetti' && !section ? <EquipmentHub entries={config.equipment} onOpen={next => openLocation('oggetti', next)} />
          : <ListContent tab={tab} section={section} data={data.data} loading={data.isLoading} kind={kind} setKind={setKind}
            search={deferredSearch} openGroups={openGroups} setOpenGroups={setOpenGroups}
            onOpen={item => tab === 'oggetti' ? openEquipment(item, section) : openLocation(tab, section, item.id)}
            refresh={() => setRevision(value => value + 1)} />}
    </main>
  </div></ReactPage>;
}

function CompendiumHub({ config, onOpen }: { config: CompendiumConfig; onOpen: (tab: string) => void }) {
  return <div className="page-content compendio-content react-compendium-hub">
    <div className="page-top-stack"><div className="page-header"><h1>Compendio</h1></div></div>
    <p className="comp-hub-subtitle">Manuale Virtuale</p>
    <div className="comp-hub-grid">{pairRows(config.tabs).map((row, index) => <div className="comp-hub-row" key={index}>
      {row.map(entry => <HubCard entry={entry} onClick={() => onOpen(entry.key)} key={entry.key} />)}
    </div>)}</div>
  </div>;
}

function EquipmentHub({ entries, onOpen }: { entries: HubEntry[]; onOpen: (key: string) => void }) {
  return <div className="comp-equipment-hub">{pairRows(entries).map((row, index) => <div className="comp-equipment-hub-row" key={index}>
    {row.map(entry => <HubCard entry={entry} onClick={() => onOpen(entry.key)} key={entry.key} equipment />)}
  </div>)}</div>;
}

function HubCard({ entry, onClick, equipment = false }: { entry: HubEntry; onClick: () => void; equipment?: boolean }) {
  const path = `images/Tabs/${entry.iconFile.split('/').map(encodeURIComponent).join('/')}.svg`;
  return <button className={`comp-hub-card ${equipment ? 'comp-equipment-hub-card' : ''}`} type="button" onClick={onClick}>
    <span className="comp-hub-card-icon"><img className="comp-hub-icon-img" src={path} alt="" loading="lazy" /></span>
    <span className="comp-hub-card-label">{entry.shortLabel || entry.label}</span>
  </button>;
}

function SearchTools({ value, setValue, data, onFilters }: { value: string; setValue: (value: string) => void; data?: CompendiumData; onFilters: () => void }) {
  return <div className="comp-toolbar page-tools-row react-compendium-tools">
    <label className="comp-search-wrap"><Search /><input className="comp-search" type="search" value={value} onChange={event => setValue(event.target.value)} placeholder="Cerca..." /></label>
    {data?.hasFilters && <button className="comp-filter-btn" type="button" onClick={onFilters}><Sliders /><span>Filtri</span>{data.activeFilters > 0 && <strong>{data.activeFilters}</strong>}</button>}
  </div>;
}

function ListContent({ tab, section, data, loading, kind, setKind, search, openGroups, setOpenGroups, onOpen, refresh }: {
  tab: string; section: string; data?: CompendiumData; loading: boolean; kind: string; setKind: (kind: string) => void; search: string;
  openGroups: Record<string, boolean>; setOpenGroups: (groups: Record<string, boolean>) => void; onOpen: (item: CompendiumItem) => void; refresh: () => void;
}) {
  if (loading || !data) return <Placeholder text="Caricamento compendio..." />;
  if (tab === 'oggetti' && data.content) return <LegacyFragment content={data.content} onAction={refresh} />;
  const items = sortCompendiumItems(filterCompendiumItems(data.items, search), tab);
  const grouped = ['incantesimi', 'mostri'].includes(tab);
  return <>
    {tab === 'talenti_stili' && <SubTabs value={kind || 'talenti'} options={[['talenti', 'Talenti'], ['stili', 'Stili di Combattimento']]} onChange={setKind} />}
    {tab === 'mostri' && <SubTabs value={kind || 'mostri'} options={[['mostri', 'Mostri'], ['combattimenti', 'Combattimenti']]} onChange={setKind} />}
    {tab === 'mostri' && kind === 'combattimenti' ? <Placeholder text="La sezione Combattimenti sara disponibile in un prossimo aggiornamento." /> : <>
      <p className="comp-count">{items.length} risultati su {data.total}</p>
      {grouped ? <div className="comp-grouped-list">{groupCompendiumItems(items).map(group => {
        const open = openGroups[group.label] ?? tab === 'incantesimi';
        return <section className="comp-group" key={group.label}>
          <button className={`comp-group-divider ${open ? 'open' : ''}`} type="button" onClick={() => setOpenGroups({ ...openGroups, [group.label]: !open })}>
            <Chevron /><span>{group.label}</span><small>{group.items.length}</small>
          </button>
          {open && <div className="comp-list">{group.items.map(item => <CompendiumCard item={item} onOpen={onOpen} key={item.id} />)}</div>}
        </section>;
      })}</div> : <div className="comp-list">{items.map(item => <CompendiumCard item={item} onOpen={onOpen} key={item.id} />)}</div>}
      {!items.length && <Placeholder text="Nessun elemento trovato" />}
    </>}
  </>;
}

function CompendiumCard({ item, onOpen }: { item: CompendiumItem; onOpen: (item: CompendiumItem) => void }) {
  const data = item.data || {};
  if (item.type === 'incantesimi') return <article className="comp-card comp-spell-card" onClick={() => onOpen(item)}>
    <div className="comp-spell-card-body"><h2 className="comp-card-title">{item.title}</h2><div className="comp-spell-card-meta"><span>{String(data.school_it || data.school || '')}</span><span>{String(data.duration || data.duration_it || '')}</span></div></div>
    <div className="comp-spell-level">{Number(data.level) ? String(data.level) : 'T'}</div>
  </article>;
  if (item.type === 'mostri') return <article className="comp-card comp-monster-card" onClick={() => onOpen(item)}>
    <div className="comp-card-main"><h2 className="comp-card-title">{item.title}</h2><span className="comp-monster-gs">GS {String(data.grado_sfida || '-')}</span></div>
    <div className="comp-monster-card-meta"><span>{String(data.tipo || '')}</span><span>{String(data.allineamento_breve || '-')}</span></div>
  </article>;
  return <article className={`comp-card ${['razze', 'sottoclassi'].includes(item.type) ? 'comp-card-compact' : ''}`} onClick={() => onOpen(item)}>
    <div className="comp-card-main"><h2 className="comp-card-title">{item.title}</h2>{item.source && <span className="comp-card-source">{item.source}</span>}</div>
    {item.subtitle && <div className="comp-card-subtitle">{item.subtitle}</div>}
    {!!item.tags?.length && <div className="comp-card-meta">{item.tags.slice(0, 4).map(tag => <span className="comp-tag" key={tag}>{tag}</span>)}</div>}
  </article>;
}

function DetailContent({ detail, refresh }: { detail: ReturnType<typeof useQuery<DetailData | null>>; refresh: () => void }) {
  if (detail.isLoading) return <Placeholder text="Caricamento dettagli..." />;
  if (!detail.data) return <Placeholder text="Dettaglio non disponibile." />;
  return <div className="comp-detail-page"><LegacyFragment content={detail.data.content} onAction={refresh} /></div>;
}

function SubTabs({ value, options, onChange }: { value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div className="lab-subtabs comp-inner-tabs">{options.map(([key, label]) => <button className={`lab-subtab ${value === key ? 'active' : ''}`} type="button" onClick={() => onChange(key)} key={key}>{label}</button>)}</div>;
}

function openEquipment(item: CompendiumItem, section: string) {
  if (['oggetti', 'veleni'].includes(section)) window.compendioOpenObjectDetail?.(String(item.data?.source || item.source || section), item.id);
  else window.compendioOpenEquipmentDetail?.(section, item.id);
}

function useDeferredValue(value: string, delay: number) {
  const [deferred, setDeferred] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setDeferred(value), delay); return () => window.clearTimeout(timer); }, [delay, value]);
  return deferred;
}

function pairRows<T>(items: T[]) { return Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => items.slice(index * 2, index * 2 + 2)); }
function Placeholder({ text }: { text: string }) { return <div className="content-placeholder"><p>{text}</p></div>; }
function Back() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>; }
function Search() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>; }
function Sliders() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></svg>; }
function Chevron() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>; }
