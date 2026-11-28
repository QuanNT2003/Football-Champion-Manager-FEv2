import { useTranslation } from '../i18n';
import { Match } from '../types';
import { matchMinute, orderedMatchEvents } from '../utils/matchPresentation';
import './match-report.css';

export type TimelineMode = 'highlights' | 'all';
const routineEvents = new Set(['PASS_COMPLETED', 'INTERCEPTION', 'TACKLE', 'DRIBBLE', 'FOUL']);

export function MatchTimeline({ match, mode = 'highlights', onModeChange = () => {} }: {
  match: Match; mode?: TimelineMode; onModeChange?: (mode: TimelineMode) => void;
}) {
  const { t } = useTranslation();
  const all = orderedMatchEvents(match.events || []);
  const events = mode === 'all' ? all : all.filter(event => !routineEvents.has(event.eventType));
  return <section className="match-timeline">
    <div className="match-timeline-toolbar"><h3>{t('match_detail.tab_timeline')}</h3><div role="group" aria-label={t('match_detail.timeline_filter')}>
      {(['highlights', 'all'] as const).map(key => <button type="button" key={key} aria-pressed={mode === key} onClick={() => onModeChange(key)}>{t(key === 'all' ? 'match_report.all_events' : 'match_report.highlights')}</button>)}
    </div></div>
    {!events.length ? <p className="match-report-empty">{t(all.length ? 'match_detail.no_highlights' : 'match_detail.no_events')}</p>
      : <ol className="match-timeline-list" aria-label={t('match_detail.tab_timeline')}>
        {events.map((event, index) => {
          const phase = event.metadata?.phase;
          const newPhase = phase && phase !== events[index - 1]?.metadata?.phase;
          const club = event.clubId === match.homeClub?.id ? match.homeClub : event.clubId === match.awayClub?.id ? match.awayClub : null;
          const isAway = !!club && club.id === match.awayClub?.id;
          const goal = event.eventType === 'GOAL' || event.eventType === 'OWN_GOAL';
          const red = event.eventType === 'RED_CARD' || event.eventType === 'SECOND_YELLOW_RED';
          const shootout = event.eventType === 'PENALTY_SCORED' || event.eventType === 'PENALTY_MISSED';
          const homeScore = event.metadata?.[shootout ? 'homePenaltyScore' : 'homeScore'];
          const awayScore = event.metadata?.[shootout ? 'awayPenaltyScore' : 'awayScore'];
          const relatedLabel = event.eventType === 'GOAL' ? 'match_detail.assist' : event.eventType === 'SUBSTITUTION' ? 'match_detail.sub_off' : 'match_detail.related_player';
          return <li key={event.id || index} className={`match-timeline-item${goal ? ' goal' : ''}${red ? ' red' : ''}${isAway ? ' away' : ''}${!club ? ' neutral' : ''}`}>
            {newPhase && <h4 className="match-timeline-phase">{t(`match_detail.phase_${phase.toLowerCase()}`, phase)}</h4>}
            <div className="match-timeline-event"><time>{matchMinute(event)}</time><span className="match-timeline-dot" aria-hidden="true" />
              <div className="match-timeline-description">
                <div className="match-timeline-event-heading"><strong>{t(`match_report.event_${event.eventType.toLowerCase()}`, event.eventType)}</strong>{club && <small>{club.name}</small>}</div>
                {event.player?.name && <p>{event.eventType === 'SUBSTITUTION' ? `${t('match_detail.sub_on')}: ` : ''}{event.player.name}</p>}
                {event.relatedPlayer?.name && <p className="match-timeline-related">{t(relatedLabel)}: {event.relatedPlayer.name}</p>}
                {event.metadata?.mentality && <p>{t('match_report.mentality')}: {t(`match_report.mentality_${String(event.metadata.mentality).toLowerCase()}`, String(event.metadata.mentality))}</p>}
                <div className="match-timeline-event-facts">
                  {homeScore != null && awayScore != null && <span>{shootout ? `${t('match_report.penalties')} ` : ''}{String(homeScore)}–{String(awayScore)}</span>}
                  {typeof event.metadata?.xG === 'number' && <small>xG {event.metadata.xG.toFixed(2)}</small>}
                  {event.metadata?.shotType === 'PENALTY' && <small>{t('match_detail.penalty_short')}</small>}
                </div>
              </div>
            </div>
          </li>;
        })}
      </ol>}
  </section>;
}
