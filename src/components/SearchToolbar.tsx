import type { ReactNode } from 'react';

interface SearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  children?: ReactNode;
  filtersLabel?: string;
  activeFilters?: number;
  onFilters?: () => void;
}

export function SearchToolbar({
  value,
  onChange,
  placeholder = 'Cerca...',
  ariaLabel = placeholder,
  className = '',
  children,
  filtersLabel = 'Filtri',
  activeFilters = 0,
  onFilters,
}: SearchToolbarProps) {
  return <div className={`comp-toolbar page-tools-row ${className}`.trim()}>
    <label className="comp-search-wrap">
      <SearchIcon />
      <input
        className="comp-search"
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
    {children ?? (onFilters && <button className="comp-filter-btn" type="button" onClick={onFilters}>
      <SlidersIcon />
      <span>{filtersLabel}</span>
      {activeFilters > 0 && <strong>{activeFilters}</strong>}
    </button>)}
  </div>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}

function SlidersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" /></svg>;
}
