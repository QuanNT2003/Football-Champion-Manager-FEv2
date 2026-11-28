import { useState } from 'react';
import { Activity, BarChart3, ClipboardList, LayoutGrid, Star } from 'lucide-react';
import { useTranslation } from '../i18n';
import { Match, MatchLineupReport, MatchReportPlayer } from '../types';
import { lineupCoordinates, matchMinute, shortPlayerName } from '../utils/matchPresentation';
import { MatchClubBadge } from './MatchClubBadge';
import { MatchTimeline, TimelineMode } from './MatchTimeline';
import './match-report.css';

export const MATCH_REPORT_TABS = ['statistics', 'lineups', 'tactics', 'ratings', 'timeline'] as const;
export type MatchReportTab = typeof MATCH_REPORT_TABS[number];
const icons = { statistics: BarChart3, lineups: LayoutGrid, tactics: ClipboardList, ratings: Star, timeline: Activity };
const metrics: [string, string][] = [
  ['possession', '%'], ['shots', ''], ['shotsOnTarget', ''], ['shotsBlocked', ''], ['xG', ''],
  ['passes', ''], ['passAccuracy', '%'], ['tackles', ''], ['tacklesWon', ''], ['saves', ''],
  ['corners', ''], ['offsides', ''], ['fouls', ''], ['yellowCards', ''], ['redCards', ''], ['substitutions', ''], ['injuries', ''],
];
const number = (n: number | undefined | null, digits = 1) => n == null || !Number.isFinite(n) ? '—' : Number.isInteger(n) ? String(n) : n.toFixed(digits);
const team = (match: Match, id: string) => id === match.homeClub?.id ? match.homeClub : match.awayClub;

function TeamHeading({ match, lineup }: { match: Match; lineup: MatchLineupReport }) {
  const club = team(match, lineup.clubId);
  return <div className="match-report-team-heading"><MatchClubBadge name={club?.name || ''} logoUrl={club?.logo_url} /><h3>{club?.name}</h3>{lineup.formation?.code && <span>{lineup.formation.code}</span>}</div>;
}
function EmptyReport() {
  const { t } = useTranslation();
  return <p className="match-report-empty">{t('match_detail.no_data')}</p>;
}
function StatisticsPanel({ match }: { match: Match }) {
  const { t } = useTranslation();
  const home = match.statistics?.home, away = match.statistics?.away;
  if (!home || !away) return <EmptyReport />;
  return <div className="match-statistics-panel">
    <div className="match-statistics-teams"><strong>{match.homeClub?.name}</strong><span>{t('match_detail.comparison')}</span><strong>{match.awayClub?.name}</strong></div>
    {metrics.map(([key, suffix]) => {
      const left = home[key], right = away[key];
      const total = (left || 0) + (right || 0);
      const leftShare = total > 0 ? (left || 0) / total * 100 : 50;
      return <div className="match-statistic-row" key={key}>
        <div><strong className={left > right ? 'higher' : ''}>{number(left, key === 'xG' ? 2 : 1)}{left == null ? '' : suffix}</strong><span>{t(`match_report.${key}`)}</span><strong className={right > left ? 'higher' : ''}>{number(right, key === 'xG' ? 2 : 1)}{right == null ? '' : suffix}</strong></div>
        <div className="match-statistic-bar" aria-hidden="true"><i style={{ width: `${leftShare}%` }} /><i style={{ width: `${100 - leftShare}%` }} /></div>
      </div>;
    })}
  </div>;
}
function PlayerName({ player, match }: { player: MatchReportPlayer; match: Match }) {
  const { t } = useTranslation();
  return <span className="match-player-name">{player.shirtNumber != null && <small>{player.shirtNumber}</small>}{player.name}{player.isCaptain && <span title={t('match_detail.captain')}> ©</span>}{match.motmPlayerId === player.id && <Star size={13} className="match-player-star" aria-label={t('match_detail.motm')} />}</span>;
}
function LineupsPanel({ match }: { match: Match }) {
  const { t } = useTranslation();
  if (!match.lineups?.length) return <EmptyReport />;
  return <div className="match-report-team-grid">{match.lineups.map(lineup => <section key={lineup.clubId} className="match-report-team">
    <TeamHeading match={match} lineup={lineup} />
    <h4 className="match-report-subtitle">{t('match_report.starters')}</h4>
    <div className="match-lineup-pitch" aria-label={`${team(match, lineup.clubId)?.name} · ${t('match_report.starters')}`}>
      <i className="match-pitch-box top" aria-hidden="true" /><i className="match-pitch-box bottom" aria-hidden="true" />
      {lineupCoordinates(lineup.players.filter(p => p.started)).map(({ player, x, y }) => <div key={player.id} className="match-pitch-player" style={{ left: `${x}%`, top: `${y}%` }} title={`${player.name} · ${player.position || ''}`}>
        <span className="match-pitch-shirt">{player.shirtNumber ?? player.position}{player.isCaptain && <small>C</small>}</span>
        <strong>{shortPlayerName(player.name)}</strong>
        <small>{player.position}{player.goals > 0 ? ` · ⚽ ${player.goals}` : ''}{player.redCards > 0 ? ' · 🟥' : ''}</small>
      </div>)}
    </div>
    <h4 className="match-report-subtitle">{t('match_report.bench')}</h4>
    <ul className="match-bench-list">{lineup.players.filter(p => !p.started).map(p => <li key={p.id}>
      <PlayerName player={p} match={match} /><span>{p.enteredMinute != null ? `↗ ${p.enteredMinute}′` : '—'}</span>
    </li>)}</ul>
  </section>)}</div>;
}
function TacticsPanel({ match }: { match: Match }) {
  const { t } = useTranslation();
  if (!match.lineups?.length) return <EmptyReport />;
  const changes = (match.events || []).filter(e => ['TACTICAL_CHANGE', 'TEAM_TALK', 'SUBSTITUTION'].includes(e.eventType));
  return <>
    <div className="match-report-team-grid">{match.lineups.map(lineup => <section key={lineup.clubId} className="match-report-team">
      <TeamHeading match={match} lineup={lineup} />
      <h4 className="match-report-subtitle">{t('match_detail.coaching')}</h4>
      {lineup.coaches.length ? <ul className="match-coaching-list">{lineup.coaches.map(c => <li key={`${c.role}-${c.id}`}><span>{t(`match_report.role_${c.role.toLowerCase()}`, c.role)}</span><strong>{c.name}</strong></li>)}</ul> : <EmptyReport />}
      <h4 className="match-report-subtitle">{t('match_detail.starting_tactics')}</h4>
      {lineup.tactic ? <div className="match-tactic-settings">
        <div><span>{t('match_report.mentality')}</span><strong>{t(`match_report.mentality_${lineup.tactic.mentality.toLowerCase()}`, lineup.tactic.mentality)}</strong></div>
        <div><span>{t('match_report.passing')}</span><strong>{t(`match_report.passing_${lineup.tactic.passingStyle.toLowerCase()}`, lineup.tactic.passingStyle)}</strong></div>
        {(['tempo', 'pressing', 'defensiveLine'] as const).map(key => <div className="match-tactic-meter" key={key}>
          <span>{t(key === 'defensiveLine' ? 'match_report.defensive_line' : `match_report.${key}`)}</span><strong>{lineup.tactic![key]}/100</strong>
          <progress value={lineup.tactic![key]} max={100} />
        </div>)}
      </div> : <EmptyReport />}
      <h4 className="match-report-subtitle">{t('match_detail.player_roles')}</h4>
      <div className="match-report-scroll"><table className="match-report-table"><thead><tr><th>{t('match_report.player')}</th><th>{t('match_detail.role')}</th><th>{t('match_detail.duty')}</th></tr></thead>
        <tbody>{lineup.players.filter(p => p.started).map(p => <tr key={p.id}><td>{p.name}</td><td>{t(`match_detail.role_${p.role?.toLowerCase()}`, p.role || '—')}</td><td>{t(`match_detail.duty_${p.duty?.toLowerCase()}`, p.duty || '—')}</td></tr>)}</tbody>
      </table></div>
    </section>)}</div>
    {changes.length > 0 && <section className="match-tactical-timeline"><h3>{t('match_detail.in_game_changes')}</h3><ol>{changes.map(event => <li key={event.id}>
      <time>{matchMinute(event)}</time><span><strong>{team(match, event.clubId || '')?.name}</strong> · {t(`match_report.event_${event.eventType.toLowerCase()}`, event.eventType)}
        {event.eventType === 'SUBSTITUTION' ? ` · ${event.player?.name || ''} ↔ ${event.relatedPlayer?.name || ''}` : event.metadata?.mentality ? ` · ${t(`match_report.mentality_${String(event.metadata.mentality).toLowerCase()}`, String(event.metadata.mentality))}` : ''}
      </span>
    </li>)}</ol></section>}
  </>;
}
function RatingsPanel({ match }: { match: Match }) {
  const { t } = useTranslation();
  if (!match.lineups?.length) return <EmptyReport />;
  return <div className="match-ratings-panel">{match.lineups.map(lineup => <section className="match-report-team" key={lineup.clubId}>
    <TeamHeading match={match} lineup={lineup} />
    <div className="match-report-scroll"><table className="match-report-table match-ratings-table">
      <thead><tr><th>{t('match_report.player')}</th><th>{t('match_detail.position')}</th><th>{t('match_report.minutes')}</th><th>{t('match_detail.goals_assists')}</th><th>{t('match_report.shots')}</th><th>{t('match_report.saves')}</th><th>{t('match_report.fitness')}</th><th>{t('match_report.rating')}</th></tr></thead>
      <tbody>{[...lineup.players].sort((a, b) => Number(b.minutes > 0) - Number(a.minutes > 0) || b.rating - a.rating).map(p => <tr key={p.id} className={match.motmPlayerId === p.id ? 'match-ratings-best' : ''}>
        <td><PlayerName player={p} match={match} /><small className="match-player-status">{t(p.started ? 'match_report.starters' : 'match_report.bench')}{p.injured ? ` · ${t('match_report.injured')}` : ''}{p.yellowCards ? ` · 🟨 ${p.yellowCards}` : ''}{p.redCards ? ' · 🟥' : ''}</small></td>
        <td>{p.position || '—'}</td><td>{p.minutes || '—'}</td><td>{p.goals || 0}/{p.assists || 0}</td><td>{number(p.shots)}</td><td>{number(p.saves)}</td>
        <td>{p.fitnessEnd != null ? `${Math.round(p.fitnessEnd)}%` : '—'}</td><td><strong className={`match-player-rating ${p.rating >= 8 ? 'excellent' : p.rating >= 7 ? 'good' : ''}`}>{p.minutes ? number(p.rating) : '—'}</strong></td>
      </tr>)}</tbody>
    </table></div>
  </section>)}</div>;
}

export function MatchReportPanel({ match, tab = 'statistics', onTabChange = () => {} }: { match: Match; tab?: MatchReportTab; onTabChange?: (tab: MatchReportTab) => void }) {
  const { t } = useTranslation();
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('highlights');
  return <section className="match-report-tabs">
    <div className="match-report-tablist" role="tablist" aria-label={t('match_detail.report_tabs')}>
      {MATCH_REPORT_TABS.map((key, index) => {
        const Icon = icons[key];
        return <button key={key} id={`match-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls={`match-panel-${key}`} tabIndex={tab === key ? 0 : -1} onClick={() => onTabChange(key)} onKeyDown={event => {
          const count = MATCH_REPORT_TABS.length;
          const next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + count - 1) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : -1;
          if (next < 0) return;
          event.preventDefault(); onTabChange(MATCH_REPORT_TABS[next]);
          event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
        }}><Icon size={17} aria-hidden="true" />{t(`match_detail.tab_${key}`)}</button>;
      })}
    </div>
    {MATCH_REPORT_TABS.map(key => <div key={key} className="match-report-tabpanel" role="tabpanel" id={`match-panel-${key}`} aria-labelledby={`match-tab-${key}`} tabIndex={0} hidden={tab !== key}>
      {tab === key && (key === 'statistics' ? <StatisticsPanel match={match} /> : key === 'lineups' ? <LineupsPanel match={match} /> : key === 'tactics' ? <TacticsPanel match={match} /> : key === 'ratings' ? <RatingsPanel match={match} /> : <MatchTimeline match={match} mode={timelineMode} onModeChange={setTimelineMode} />)}
    </div>)}
  </section>;
}
