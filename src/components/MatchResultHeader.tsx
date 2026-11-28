import { Link } from 'react-router-dom';
import { CalendarDays, CircleDot, Clock, MapPin, Users } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useTournamentLocale } from '../utils/tournamentLocalization';
import { formatKickoffTime } from '../utils/matchTime';
import { isMatchFinished, matchMinute } from '../utils/matchPresentation';
import { Match, MatchEvent } from '../types';
import { MatchClubBadge } from './MatchClubBadge';
import './match-report.css';

export function MatchResultHeader({ match, pending = false }: { match: Match; pending?: boolean }) {
  const { t } = useTranslation();
  const { comp, round } = useTournamentLocale();
  const finished = isMatchFinished(match.status);
  const incidents = (match.events || []).filter(e => ['GOAL', 'OWN_GOAL', 'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW_RED'].includes(e.eventType));
  const stadium = typeof match.stadium === 'string' ? match.stadium : match.stadium?.name;
  const incidentIcon = (event: MatchEvent) => event.eventType.includes('GOAL') ? <CircleDot size={14} aria-hidden="true" />
    : <span className={`match-card-icon ${event.eventType === 'YELLOW_CARD' ? 'yellow' : 'red'}`} aria-hidden="true" />;
  return <header className="match-result-header">
    <div className="match-result-context"><span>{comp(match.competitionSeason?.name || '')}</span><span>{round(match.round?.name || '')}</span></div>
    <div className="match-result-scoreboard">
      {[match.homeClub, match.awayClub].map((club, side) => <div key={side} className={`match-result-club ${side ? 'away' : 'home'}`}>
        {club?.id ? <Link to={`/clubs/${club.id}`}><MatchClubBadge name={club.name} logoUrl={club.logo_url} large /><strong>{club.name}</strong></Link>
          : <strong>{t(side ? 'matches.away_team' : 'matches.home_team')}</strong>}
      </div>)}
      <div className="match-result-score">
        <span className={`match-result-status ${finished ? 'finished' : ''}`}>{t(finished ? 'matches.finished' : 'matches.upcoming')}</span>
        <strong>{finished ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : 'VS'}</strong>
        {match.resultType === 'EXTRA_TIME' && <small>{t('match_report.result_extra_time')}</small>}
        {match.homePenaltyScore != null && <small>{t('match_report.penalties')} {match.homePenaltyScore}–{match.awayPenaltyScore}</small>}
        {finished && match.homeRegularScore != null && (match.homeExtraScore != null || match.homePenaltyScore != null) &&
          <small>{t('match_report.regulation')}: {match.homeRegularScore}–{match.awayRegularScore}</small>}
      </div>
    </div>
    {finished && <div className="match-result-incidents" aria-label={t('match_detail.key_events')}>
      {[match.homeClub?.id, match.awayClub?.id].map((clubId, side) => <ul key={side} className={side ? 'away' : 'home'}>
        {incidents.filter(e => e.clubId === clubId).map(e => <li key={e.id}>
          <span title={t(`match_report.event_${e.eventType.toLowerCase()}`, e.eventType)}>{incidentIcon(e)}<span className="match-sr-only">{t(`match_report.event_${e.eventType.toLowerCase()}`, e.eventType)}</span></span>
          <span>{e.player?.name || t('matches.player_fallback')}{e.metadata?.shotType === 'PENALTY' ? ` ${t('match_detail.penalty_short')}` : e.eventType === 'OWN_GOAL' ? ` ${t('match_detail.own_goal_short')}` : ''}</span>
          <time>{matchMinute(e)}</time>
        </li>)}
      </ul>)}
      {!pending && !incidents.length && <p className="match-no-incidents">{t('match_detail.no_key_events')}</p>}
    </div>}
    <div className="match-result-metadata">
      <span><CalendarDays size={14} />{match.match_date?.slice(0, 10)} · {t('common.day')} {match.season_day}</span>
      <span><Clock size={14} />{formatKickoffTime(match.kickoff_time)} · UTC+7</span>
      {stadium && <span><MapPin size={14} />{stadium}</span>}
      {finished && match.attendance != null && <span><Users size={14} />{match.attendance.toLocaleString()}</span>}
    </div>
  </header>;
}

