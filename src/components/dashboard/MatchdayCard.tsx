import { ArrowRight, ClipboardList, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { Club, DashboardData } from '../../types';
import { useTournamentLocale } from '../../utils/tournamentLocalization';
import { ClubCrest } from './ClubCrest';

type MatchClub = { id?: string; name: string; short_name?: string; logo_url?: string | null };

function MatchTeam({ team, venue }: { team: MatchClub; venue: string }) {
  const content = <><ClubCrest club={team} /><strong>{team.name}</strong><small>{venue}</small></>;
  return team.id
    ? <Link to={`/clubs/${team.id}`} className="game-match-team">{content}</Link>
    : <div className="game-match-team">{content}</div>;
}

function ClubName({ id, name }: { id?: string; name?: string }) {
  return id ? <Link to={`/clubs/${id}`}>{name}</Link> : <span>{name}</span>;
}

export function MatchdayCard({ club, next, last }: {
  club: Club;
  next: DashboardData['next_match'];
  last: DashboardData['last_match'];
}) {
  const { t } = useTranslation();
  const { comp } = useTournamentLocale();
  const home = next?.home_club ?? (next?.is_home ? club : next?.opponent);
  const away = next?.away_club ?? (next?.is_home ? next?.opponent : club);
  const kickoff = next?.kickoff_time?.match(/\d{2}:\d{2}/)?.[0] ?? '—';

  return (
    <section className="game-panel game-match-card" aria-labelledby="next-match-title">
      <div className="game-panel-heading">
        <h2 id="next-match-title"><Swords size={19} /> {t('dashboard.match.next_match')}</h2>
        {next && <span>{comp(next.competition_name)}</span>}
      </div>
      <div className="game-match-pitch">
        <div className="game-pitch-lines" aria-hidden="true"><i /></div>
        {next && home && away ? (
          <div className="game-match-lineup">
            <MatchTeam team={home} venue={t('common.home')} />
            <div className="game-kickoff">
              <span>VS</span>
              <strong>{kickoff}</strong>
              <small>{t('common.day')} {next.season_day}</small>
            </div>
            <MatchTeam team={away} venue={t('common.away')} />
          </div>
        ) : (
          <div className="game-match-empty">{t('dashboard.match.not_scheduled')}</div>
        )}
      </div>
      <div className="game-match-actions">
        <Link to="/matches" className="game-action game-action-primary">{t('nav.dock.matches')} <ArrowRight size={16} /></Link>
        <Link to="/tactics" className="game-action game-action-outline"><ClipboardList size={16} /> {t('dashboard.match.tactics_btn')}</Link>
      </div>
      <div className="game-last-match">
        <span>{t('dashboard.match.last_match')}</span>
        {last ? (
          <>
            <strong>
              <ClubName id={last.home_club_id} name={last.home_club_name} />
              <b>{last.home_score}–{last.away_score}</b>
              <ClubName id={last.away_club_id} name={last.away_club_name} />
            </strong>
            <small>{comp(last.competition_name)}</small>
          </>
        ) : <small>{t('dashboard.match.no_previous_match')}</small>}
      </div>
    </section>
  );
}

