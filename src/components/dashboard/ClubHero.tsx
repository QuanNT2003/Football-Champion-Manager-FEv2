import { ArrowRight, Check, MapPin, Share2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { Club, DashboardData } from '../../types';
import { useTournamentLocale } from '../../utils/tournamentLocalization';
import { ClubCrest } from './ClubCrest';

export function ClubHero({ club, data }: { club: Club; data: DashboardData['club'] | undefined }) {
  const { t } = useTranslation();
  const { comp } = useTournamentLocale();
  const [copied, setCopied] = useState(false);
  const clubPath = `/clubs/${club.id}`;
  const league = data?.competition_name || club.current_competition?.name;
  const venue = club.stadium?.name || club.stadiums?.[0]?.name || club.city;
  const trophies = data?.trophies_count ?? club.trophiesCount;

  async function shareClub() {
    const url = new URL(clubPath, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t('dashboard.share_tooltip'), url);
    }
  }

  return (
    <section className="club-hero" aria-labelledby="club-hero-title">
      <div className="club-hero-body">
        <div className="club-hero-meta"><span /> {t('v2.clubhouse')}</div>
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link className="shrink-0" to={clubPath} aria-label={club.name}><ClubCrest club={club} large /></Link>
          <div className="min-w-0">
            <h1 id="club-hero-title"><Link to={clubPath}>{club.name}</Link></h1>
            {(league || venue) && (
              <div className="club-hero-subtitle">
                {league && <span><Trophy size={13} /> {comp(league)}</span>}
                {venue && <span><MapPin size={13} /> {venue}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="club-hero-actions">
          <Link to={clubPath} className="game-action game-action-primary">{t('v2.clubProfile')} <ArrowRight size={16} /></Link>
          <Link to="/trophies" className="game-action game-action-outline">
            <Trophy size={15} /> {t('v2.trophies')}{trophies != null && <span>{trophies}</span>}
          </Link>
          <button type="button" className="game-action game-action-outline" title={t('dashboard.share_tooltip')} aria-label={t(copied ? 'v2.linkCopied' : 'dashboard.share_tooltip')} onClick={shareClub}>
            {copied ? <Check size={16} /> : <Share2 size={16} />}
          </button>
        </div>
      </div>
    </section>
  );
}
