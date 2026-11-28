import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MatchPreviewLink } from './MatchPreviewLink';
import { CalendarDays, Clock, Filter, Loader2, Search, Trophy } from 'lucide-react';
import { Club, Match, TimelineData } from '../types';
import { matchesApi } from '../services/matches.service';
import { useTranslation } from '../i18n';
import { useTournamentLocale } from '../utils/tournamentLocalization';
import { formatKickoffTime } from '../utils/matchTime';
import { isMatchFinished, matchGoals } from '../utils/matchPresentation';
import { MatchClubBadge } from './MatchClubBadge';
import { MatchScorers } from './MatchScorers';
import './match-report.css';

interface Props {
  club?: Club | null;
  timeline?: TimelineData | null;
  matches?: Match[];
  onSimulateMatch?: (matchId: string) => Promise<any>;
  onMatchSimulated?: () => void;
}
type StatusFilter = 'ALL' | 'SCHEDULED' | 'FINISHED';

export const MatchCenterView: React.FC<Props> = ({ club, timeline, matches: initialMatches, onSimulateMatch, onMatchSimulated }) => {
  const { t } = useTranslation();
  const { comp, round } = useTournamentLocale();
  const [matchList, setMatchList] = useState<Match[]>(initialMatches || []);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [competitionFilter, setCompetitionFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const clubId = club?.id, seasonId = timeline?.season?.id;
  const loadMatches = useCallback(async () => {
    const current = ++request.current;
    setLoading(true); setError(false);
    try {
      const data = await matchesApi.getMatches(1, 500, clubId, undefined, seasonId);
      if (current === request.current) setMatchList(data.items || (Array.isArray(data) ? data : []));
    } catch { if (current === request.current) setError(true); }
    finally { if (current === request.current) setLoading(false); }
  }, [clubId, seasonId]);
  useEffect(() => {
    if (initialMatches) { ++request.current; setMatchList(initialMatches); setLoading(false); }
    else loadMatches();
    return () => { ++request.current; };
  }, [initialMatches, loadMatches]);

  const days = [...new Set(matchList.map(m => m.season_day))].sort((a, b) => a - b);
  const competitions = [...new Set(matchList.map(m => m.competitionSeason?.name).filter((name): name is string => !!name))].sort();
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return matchList.filter(m => {
      const stadium = typeof m.stadium === 'string' ? m.stadium : m.stadium?.name || '';
      const haystack = `${m.homeClub?.name || ''} ${m.awayClub?.name || ''} ${m.competitionSeason?.name || ''} ${stadium}`.toLowerCase();
      return (statusFilter === 'ALL' || (statusFilter === 'FINISHED' ? isMatchFinished(m.status) : !isMatchFinished(m.status))) &&
        (dayFilter === 'ALL' || m.season_day === Number(dayFilter)) &&
        (competitionFilter === 'ALL' || m.competitionSeason?.name === competitionFilter) && (!query || haystack.includes(query));
    }).sort((a, b) => (a.match_date || '').localeCompare(b.match_date || '') || formatKickoffTime(a.kickoff_time).localeCompare(formatKickoffTime(b.kickoff_time)) || a.id.localeCompare(b.id));
  }, [matchList, statusFilter, dayFilter, competitionFilter, search]);

  return <div className="match-season-view match-results-list">
    <section className="match-season-list glass-panel">
      <div className="match-season-header"><div><h2>{t('matches.title')}</h2><p>{timeline?.season ? `${timeline.season.name} · ${t('common.day')} ${timeline.season.current_day}/${timeline.season.total_days}` : t('matches.season_current')}</p></div>
        <button className="btn btn-secondary btn-sm" onClick={loadMatches} disabled={loading}>{loading ? <Loader2 className="spinner-icon" size={16} /> : <CalendarDays size={16} />}{t('common.refresh')}</button>
      </div>
      <div className="match-toolbar">
        <div className="match-search"><Search size={16} /><input aria-label={t('common.search')} placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="input-select" aria-label={t('matches.all_days')} value={dayFilter} onChange={e => setDayFilter(e.target.value)}><option value="ALL">{t('matches.all_days')}</option>{days.map(day => <option value={day} key={day}>{t('common.day')} {day}</option>)}</select>
        {competitions.length > 0 && <select className="input-select" aria-label={t('matches.comp_default')} value={competitionFilter} onChange={e => setCompetitionFilter(e.target.value)}><option value="ALL">{t('matches.all_comps').replace('{count}', String(competitions.length))}</option>{competitions.map(name => <option key={name} value={name}>{comp(name)}</option>)}</select>}
        <div className="match-status-tabs" aria-label={t('matches.status_filter_aria')}>{(['ALL', 'SCHEDULED', 'FINISHED'] as const).map(status => <button key={status} type="button" className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}><Filter size={14} />{t(status === 'ALL' ? 'matches.filter_all' : status === 'SCHEDULED' ? 'matches.filter_scheduled' : 'matches.filter_finished')}</button>)}</div>
      </div>
      {error && <div className="alert alert-danger" role="alert">{t('matches.load_error')}</div>}
      {loading && !matchList.length ? <div className="match-empty-state" role="status"><Loader2 className="spinner-icon" size={26} />{t('matches.loading_schedule')}</div>
        : !filtered.length ? <div className="match-empty-state"><CalendarDays size={30} />{t('matches.no_matches_filter')}</div>
        : <div className="season-fixture-table" role="list">{filtered.map((match, index) => {
          const previous = filtered[index - 1];
          const newDay = !previous || previous.season_day !== match.season_day || previous.match_date !== match.match_date;
          const finished = isMatchFinished(match.status);
          const mine = match.homeClub?.id === club?.id || match.awayClub?.id === club?.id;
          return <React.Fragment key={match.id}>
            {newDay && <div className="fixture-section-label" role="presentation"><span>{t('common.day')} {match.season_day} · {match.match_date?.slice(0, 10)} (UTC+7)</span></div>}
            <article role="listitem"><MatchPreviewLink matchId={match.id} initialMatch={match} onSimulateMatch={onSimulateMatch} onMatchSimulated={async () => { await loadMatches(); await onMatchSimulated?.(); }} className={`match-result-card${mine ? ' my-match' : ''}`}>
              <div className="match-result-card-meta"><span><Trophy size={13} />{comp(match.competitionSeason?.name || match.stage?.name || '')}{match.round?.name ? ` · ${round(match.round.name)}` : ''}</span><small>{finished ? t('matches.finished') : <><Clock size={12} />{formatKickoffTime(match.kickoff_time)}</>}</small></div>
              <div className="fixture-card-matchup">
                <div className="fixture-team home"><span className="club-name">{match.homeClub?.name || t('matches.home_team')}</span><MatchClubBadge name={match.homeClub?.name || ''} logoUrl={match.homeClub?.logo_url} /></div>
                <div className="match-result-card-score"><strong>{finished ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : 'VS'}</strong>{match.homePenaltyScore != null && <small>{t('match_detail.penalties_short')} {match.homePenaltyScore}–{match.awayPenaltyScore}</small>}</div>
                <div className="fixture-team away"><MatchClubBadge name={match.awayClub?.name || ''} logoUrl={match.awayClub?.logo_url} /><span className="club-name">{match.awayClub?.name || t('matches.away_team')}</span></div>
              </div>
              {finished && <MatchScorers goals={matchGoals(match)} homeId={match.homeClub?.id} awayId={match.awayClub?.id} />}
            </MatchPreviewLink></article>
          </React.Fragment>;
        })}</div>}
    </section>
  </div>;
};
