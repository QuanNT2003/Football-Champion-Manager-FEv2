import { Player } from '../types';

export function getPlayerAvailability(player: Player, forNextMatch = false) {
  const status = player.status || player.player_status;
  const injuries = (status?.active_injuries || []).filter(injury => injury.days_remaining > 0);
  const suspensions = (status?.suspensions || []).filter(ban => ban.matches_remaining > 0 && (!forNextMatch || ban.applies_to_next_match === true));
  const yellowCards = (status?.yellow_cards || []).filter(cards => cards.count > 0 && (!forNextMatch || cards.applies_to_next_match === true));
  const days = Math.max(status?.injury_days_remaining || 0, ...injuries.map(injury => injury.days_remaining));
  return {
    injuries, suspensions, yellowCards, days,
    injured: Boolean(status?.is_injured) || days > 0,
    suspended: (!forNextMatch && status?.suspensions === undefined && Boolean(status?.is_suspended)) || suspensions.length > 0,
  };
}

export function hasPlayerRestrictions(player: Player) {
  const availability = getPlayerAvailability(player, true);
  return availability.injured || availability.suspended;
}
