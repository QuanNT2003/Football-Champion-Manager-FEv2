import { Bell, CalendarDays, ChevronDown, Coins, Globe, LogOut, Search, Trophy, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { clubsApi } from '../../services/clubs.service';
import { competitionsApi, CompetitionsMenuResponse } from '../../services/competitions.service';
import { Club, ClubNews, TimelineData, User } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ClubNewsModal } from '../news/ClubNewsModal';
import { FederationMenu } from './FederationMenu';
import { GameSearch } from './GameSearch';
import { GameClock } from './GameClock';
import { isFederationPath } from './navigation';

interface GameTopBarProps {
  club: Club;
  user: User;
  timeline: TimelineData | null;
  onLogout: () => void;
}

export function GameTopBar({ club, user, timeline, onLogout }: GameTopBarProps) {
  const { t, language, languages, setLanguage } = useTranslation();
  const location = useLocation();
  const ref = useRef<HTMLElement>(null);
  const [popup, setPopup] = useState<'federation' | 'profile' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [news, setNews] = useState<ClubNews[]>([]);
  const [menu, setMenu] = useState<CompetitionsMenuResponse | null>(null);

  useEffect(() => {
    let active = true;
    clubsApi.getNews(club.id, 1, 15).then(data => {
      if (active) setNews(data.items ?? []);
    }).catch(() => {
      if (active) setNews([]);
    });
    return () => { active = false; };
  }, [club.id]);

  useEffect(() => {
    let active = true;
    competitionsApi.getMenu(String(club.country_id ?? '1')).then(data => {
      if (active) setMenu(data);
    }).catch(() => {
      if (active) setMenu(null);
    });
    return () => { active = false; };
  }, [club.country_id]);

  useEffect(() => {
    if (!popup) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setPopup(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopup(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [popup]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      setPopup(null);
      setSearchOpen(true);
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, []);

  const cash = club.financial_accounts?.[0]?.cash_balance ?? club.finances?.cash;
  const gold = club.financial_accounts?.[0]?.gold_balance ?? club.finances?.gold;
  const season = timeline?.season;

  return (
    <header className="game-topbar" ref={ref}>
      <Link to={`/clubs/${club.id}`} className="game-topbar-club">{club.name}</Link>
      {season && (
        <div className="game-season-chip">
          <CalendarDays size={14} />
          <span>{t('common.season')} {season.season_number} <b>·</b> {t('common.day')} {season.current_day}/{season.total_days}</span>
        </div>
      )}
      <div className="game-topbar-tools">
        <GameClock title={t('navbar.clock_tooltip')} />
        <button type="button" className="game-toolbar-button" title={t('v2.search')} aria-label={t('v2.search')} onClick={() => { setPopup(null); setSearchOpen(true); }}>
          <Search size={17} />
        </button>
        <button
          type="button"
          className={`game-toolbar-button ${isFederationPath(location.pathname) ? 'is-active' : ''}`}
          aria-expanded={popup === 'federation'}
          aria-controls={popup === 'federation' ? 'federation-menu' : undefined}
          aria-label={t('v2.federation')}
          title={t('v2.federation')}
          onClick={() => setPopup(popup === 'federation' ? null : 'federation')}
        >
          <Trophy size={16} /> <span>{t('v2.federation')}</span><ChevronDown size={12} />
        </button>
        <Link to="/finances" className="game-wallet" title={t('navbar.income_tooltip')} aria-label={t('nav.dock.finances')}>
          <span><Wallet size={15} /> {cash == null ? '—' : formatCurrency(cash)}</span>
          <span><Coins size={15} /> {gold == null ? '—' : Number(gold).toLocaleString(language)}</span>
        </Link>
        <button type="button" className="game-toolbar-button game-notice" title={t('cockpit.alerts')} aria-label={news.length ? t('v2.alertCount', { count: news.length }) : t('cockpit.alerts')} onClick={() => { setPopup(null); setNewsOpen(true); }}>
          <Bell size={18} />
          {news.length > 0 && <i aria-hidden="true">{news.length > 99 ? '99+' : news.length}</i>}
        </button>
        <button type="button" className="game-toolbar-button game-profile-button" title={user.username} aria-expanded={popup === 'profile'} onClick={() => setPopup(popup === 'profile' ? null : 'profile')}>
          <span className="game-profile-initials">{user.username.slice(0, 2).toUpperCase()}</span>
          <span>{user.username}</span><ChevronDown size={13} />
        </button>
      </div>
      {popup === 'federation' && <FederationMenu menu={menu} onSelect={() => setPopup(null)} />}
      {popup === 'profile' && (
        <div className="game-profile-popup">
          <strong>{user.username}</strong>
          <label><Globe size={15} /> <span>{t('v2.language')}</span>
            <select value={language} onChange={event => setLanguage(event.target.value as typeof language)}>
              {languages.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={onLogout}><LogOut size={15} /> {t('v2.logout')}</button>
        </div>
      )}
      <GameSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ClubNewsModal isOpen={newsOpen} onClose={() => setNewsOpen(false)} newsList={news} />
    </header>
  );
}



