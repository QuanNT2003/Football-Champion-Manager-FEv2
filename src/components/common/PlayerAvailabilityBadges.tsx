import { Bandage } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getPlayerAvailability } from '../../utils/playerAvailability';
import { Player } from '../../types';
import './PlayerAvailabilityBadges.css';

/** Lists/pitch show status icons; remaining durations belong in the player profile. */
export function PlayerAvailabilityBadges({ player, compact = false, onInspect }: {
  player: Player; compact?: boolean; onInspect?: () => void;
}) {
  const { t } = useTranslation();
  const { injured, suspended, suspensions, yellowCards } = getPlayerAvailability(player, true);
  if (!injured && !suspended && !yellowCards.length) return null;
  const cards = [...new Set(suspensions.map(ban =>
    ['FIVE_YELLOW_CARDS', 'YELLOW_CARDS', 'YELLOW_ACCUMULATION'].includes(ban.reason) ? 'yellow' :
      ban.reason === 'SECOND_YELLOW' ? 'second-yellow' : 'red'))];
  if (suspended && !cards.length) cards.push('red');
  if (yellowCards.length && !cards.includes('yellow')) cards.push('yellow');
  const icons = <>
    {injured && <span className="player-availability-icon injury" role="img" aria-label={t('availability.injured')} title={t('availability.injured')}>
      <Bandage size={14} aria-hidden="true" />
    </span>}
    {cards.map(card => <span className="player-availability-icon" role="img" key={card}
      aria-label={t(card === 'yellow' ? 'availability.yellow_accumulation' : card === 'second-yellow' ? 'availability.second_yellow' : 'availability.suspension')}
      title={t(card === 'yellow' ? 'availability.yellow_accumulation' : card === 'second-yellow' ? 'availability.second_yellow' : 'availability.suspension')}>
      <span className={`availability-card ${card}`} aria-hidden="true" />
    </span>)}
  </>;
  const className = `player-availability${compact ? ' compact' : ''}${onInspect ? ' inspectable' : ''}`;
  return onInspect ? <button type="button" className={className} aria-label={t('availability.view_details')}
    title={t('availability.view_details')} onClick={event => { event.stopPropagation(); onInspect(); }}>{icons}</button>
    : <span className={className}>{icons}</span>;
}
