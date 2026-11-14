import { ChevronRight, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { Club, DashboardData } from '../../types';
import { useTournamentLocale } from '../../utils/tournamentLocalization';

type Competition = DashboardData['competitions'][number];

function competitionPath(item: Competition, countryId?: string) {
  const params = new URLSearchParams({ id: item.id });
  if (countryId) params.set('countryId', countryId);
  const type = item.competition_type ?? item.type;
  if (type === 'DOMESTIC_LEAGUE') {
    if (item.tier) params.set('tier', String(item.tier));
    return `/competitions/league?${params}`;
  }
  if (type?.includes('YOUTH')) return `/competitions/youth?${params}`;
  if (type?.includes('CONTINENTAL')) return `/competitions/continental?${params}`;
  if (type?.includes('INTERNATIONAL') || type?.includes('WORLD')) return `/competitions/international?${params}`;
  if (type?.includes('CUP')) return `/competitions/cup?${params}`;
  return '/standings';
}

export function CompetitionBoard({ club, competitions }: { club: Club; competitions: Competition[] }) {
  const { t } = useTranslation();
  const { comp, round, status, subTitle } = useTournamentLocale();
  const [tab, setTab] = useState<'competitions' | 'friends'>('competitions');

  return (
    <section className="game-panel game-competition-card" aria-label={t('dashboard.comp.title')}>
      <div className="game-board-tabs">
        <button type="button" aria-pressed={tab === 'competitions'} onClick={() => setTab('competitions')}>
          <Trophy size={17} /> {t('dashboard.comp.tab_competitions')}
        </button>
        <button type="button" aria-pressed={tab === 'friends'} onClick={() => setTab('friends')}>
          <Users size={17} /> {t('v2.friends')}
        </button>
      </div>
      {tab === 'friends' ? (
        <p className="game-board-empty">{t('dashboard.friends.connect_prompt')}</p>
      ) : (
        <>
          <div className="game-board-list">
            {competitions.map(item => (
              <Link key={item.id} to={competitionPath(item, club.country_id)} className="game-board-row">
                <span className={`game-board-icon game-board-icon-${item.color}`}><Trophy size={17} /></span>
                <span>
                  <strong>{comp(item.name)}</strong>
                  <small>{subTitle(item.sub_title)}</small>
                </span>
                <span className="game-board-result">
                  {item.round_label
                    ? round(item.round_label)
                    : item.rank != null ? `#${item.rank}` : status(item.status_label)}
                  {item.points != null && <small>{item.points} {t('common.points')}</small>}
                </span>
                <ChevronRight size={14} />
              </Link>
            ))}
            {!competitions.length && <p className="game-board-empty">{t('v2.noCompetitions')}</p>}
          </div>
          <Link to="/standings" className="game-board-footer">{t('v2.allStandings')} <ChevronRight size={16} /></Link>
        </>
      )}
    </section>
  );
}
