import { Bandage, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useTournamentLocale } from '../../utils/tournamentLocalization';
import { getPlayerAvailability } from '../../utils/playerAvailability';
import type { Player, PlayerDetailData } from '../../types';
import '../common/PlayerAvailabilityBadges.css';
import './PlayerAvailabilityPanel.css';

export function PlayerAvailabilityPanel({ player, detail, loading = false }: {
  player: Player; detail?: PlayerDetailData | null; loading?: boolean;
}) {
  const { t } = useTranslation();
  const { comp } = useTournamentLocale();
  const current = detail?.id === player.id ? detail : null;
  const status = current?.status ?? player.status ?? player.player_status;
  const availability = getPlayerAvailability({ ...player, status });
  const active = current?.active_injury;
  const injuries = availability.injuries.length ? availability.injuries : active && active.days_remaining > 0
    ? [{ id: active.id || 'active', name: active.injury_type, days_remaining: active.days_remaining }]
    : availability.days > 0 ? [{ id: 'status', name: null, days_remaining: availability.days }] : [];
  const injured = availability.injured || injuries.length > 0;
  if (!injured && !availability.suspended && !availability.yellowCards.length) return null;
  return <section className="player-availability-panel" aria-label={t('availability.panel_title')} aria-busy={loading} aria-live="polite">
    {availability.yellowCards.map(cards => <div key={`${cards.season_id}-${cards.competition_season_id}`} className="availability-detail yellow">
      <span className="availability-card yellow" aria-hidden="true" />
      <p><strong>{t('availability.yellow_count', { count: cards.count, threshold: cards.threshold })}</strong>
        <span> · {cards.scope === 'DOMESTIC_LEAGUE_AND_SUPER_CUP' ? t('availability.domestic_red_scope_short')
          : cards.competition_name ? comp(cards.competition_name) : t('availability.competition_unknown', { id: cards.competition_season_id })}</span></p>
    </div>)}
    {availability.suspensions.map(ban => {
      const yellow = ['FIVE_YELLOW_CARDS', 'YELLOW_CARDS', 'YELLOW_ACCUMULATION'].includes(ban.reason);
      const competition = ban.scope === 'DOMESTIC_LEAGUE_AND_SUPER_CUP' ? t('availability.domestic_red_scope_short')
        : ban.competition_season_id == null ? t('availability.all_competitions')
        : ban.competition_name ? comp(ban.competition_name) : t('availability.competition_unknown', { id: ban.competition_season_id });
      return <div key={ban.id} className={`availability-detail suspension${yellow ? ' yellow' : ''}`}>
        <span className={`availability-card${yellow ? ' yellow' : ''}${ban.reason === 'SECOND_YELLOW' ? ' second-yellow' : ''}`} aria-hidden="true" />
        <p><strong>{t('availability.ban_remaining', { count: ban.matches_remaining })}</strong><span> · {competition}</span></p>
      </div>;
    })}
    {availability.suspended && !availability.suspensions.length && <div className="availability-detail suspension">
      <ShieldAlert size={16} aria-hidden="true" /><p>{t('availability.ban_unknown')}</p>
    </div>}
    {injuries.map(injury => <div key={injury.id} className="availability-detail injury"><Bandage size={16} aria-hidden="true" />
      <p><strong>{injury.name || t('availability.injured')}</strong><span> · {t('availability.days_remaining', { count: injury.days_remaining })}</span></p>
    </div>)}
    {injured && !injuries.length && <div className="availability-detail injury"><Bandage size={16} aria-hidden="true" />
      <p>{t('availability.injury_unknown')}</p>
    </div>}
  </section>;
}
