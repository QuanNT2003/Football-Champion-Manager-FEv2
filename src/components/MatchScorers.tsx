import { useTranslation } from '../i18n';
import { MatchGoal } from '../types';
import { groupedScorers, matchMinute, shortPlayerName } from '../utils/matchPresentation';
import './match-report.css';

export function MatchScorers({ goals, homeId, awayId }: { goals: MatchGoal[]; homeId?: string; awayId?: string }) {
  const { t } = useTranslation();
  if (!goals.length) return null;
  return <div className="match-compact-scorers" aria-label={t('match_detail.scorers')}>
    {[homeId, awayId].map((clubId, index) => <div className={index === 0 ? 'home' : 'away'} key={index}>
      {groupedScorers(goals, clubId).map((group, i) => <span key={i} title={group.name || undefined}>
        {shortPlayerName(group.name || t('matches.player_fallback'))}{' '}
        <small>{group.goals.map(goal => `${matchMinute(goal)}${goal.penalty ? ` ${t('match_detail.penalty_short')}` : goal.ownGoal ? ` ${t('match_detail.own_goal_short')}` : ''}`).join(', ')}</small>
      </span>)}
    </div>)}
  </div>;
}
