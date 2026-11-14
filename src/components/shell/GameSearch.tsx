import { ArrowUpRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { clubsApi } from '../../services/clubs.service';
import { Club } from '../../types';
import { clubNavigation, worldNavigation } from './navigation';

const destinations = [...clubNavigation, ...worldNavigation];

export function GameSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Club[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) return;

    let active = true;
    const timer = window.setTimeout(() => {
      clubsApi.getClubs(1, 6, term).then(response => {
        if (!active) return;
        setResults(response.items ?? []);
        setSearchStatus('ready');
      }).catch(() => {
        if (active) setSearchStatus('error');
      });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  function close() {
    setQuery('');
    setResults([]);
    setSearchStatus('idle');
    onClose();
  }

  function select(to: string) {
    close();
    navigate(to);
  }

  const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
  const term = normalize(query.trim());
  const links = destinations.filter(item => normalize(t(item.label)).includes(term));
  const firstDestination = links[0]?.to ?? (results[0] ? `/clubs/${results[0].id}` : undefined);

  return (
    <dialog className="game-search-dialog" ref={dialog} aria-label={t('v2.search')} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="game-search-content">
        <form onSubmit={event => { event.preventDefault(); if (firstDestination) select(firstDestination); }}>
          <Search size={19} />
          <input aria-label={t('v2.search')} placeholder={t('v2.searchPlaceholder')} value={query} onChange={event => {
            setQuery(event.target.value);
            setResults([]);
            setSearchStatus(event.target.value.trim().length >= 2 ? 'loading' : 'idle');
          }} />
          <button type="button" aria-label={t('common.close')} onClick={close}><X size={18} /></button>
        </form>
        <div className="game-search-results">
          {links.map(({ to, label, icon: Icon }) => (
            <button type="button" key={to} onClick={() => select(to)}><Icon size={16} /> {t(label)} <ArrowUpRight size={14} /></button>
          ))}
          {results.map(club => (
            <button type="button" key={club.id} onClick={() => select(`/clubs/${club.id}`)}><span>{club.name}</span><ArrowUpRight size={14} /></button>
          ))}
          {searchStatus === 'loading' && <p role="status">{t('common.loading')}</p>}
          {searchStatus === 'error' && <p role="status">{t('v2.searchError')}</p>}
          {searchStatus === 'ready' && !links.length && !results.length && <p role="status">{t('v2.searchEmpty')}</p>}
        </div>
      </div>
    </dialog>
  );
}


