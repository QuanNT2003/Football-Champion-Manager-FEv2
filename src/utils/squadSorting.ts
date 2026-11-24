import type { Player } from '../types';

export type SquadSortKey = 'position' | 'age' | 'ovr' | 'potential' | 'fitness' | 'value';
export interface SquadSort {
  key: SquadSortKey;
  direction: 'asc' | 'desc';
}
export const defaultSquadSort: SquadSort = { key: 'position', direction: 'asc' };

// Match the position catalogue: goalkeeper, defenders, midfielders, forwards.
const positions = ['GK', 'CB', 'SW', 'LB', 'RB', 'LWB', 'RWB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LAM', 'RAM', 'LW', 'RW', 'SS', 'ST'];

export function getSquadPosition(player: Player): string {
  const preferred = player.player_positions?.find(position => position.is_preferred) ?? player.player_positions?.[0];
  return (player.position?.code || preferred?.position_code || preferred?.position?.code || preferred?.positions?.code || '—').trim().toUpperCase();
}

export function getSquadPositionCategory(code: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (code === 'GK') return 'GK';
  if (['CB', 'SW', 'LB', 'RB', 'LWB', 'RWB', 'DF'].includes(code)) return 'DEF';
  if (['LW', 'RW', 'SS', 'ST', 'CF', 'FW'].includes(code)) return 'FWD';
  return 'MID';
}

function numeric(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export const getSquadOvr = (player: Player) => numeric(player.overall_rating ?? player.ovr);
export const getSquadPotential = (player: Player) => numeric(player.potential_rating ?? player.potential);
export const getSquadFitness = (player: Player) => numeric(player.status?.fitness ?? player.player_status?.fitness);
export const getSquadValue = (player: Player) => numeric(player.market_value);

export function nextSquadSort(current: SquadSort, key: SquadSortKey): SquadSort {
  return {
    key,
    direction: current.key === key ? (current.direction === 'asc' ? 'desc' : 'asc')
      : key === 'position' || key === 'age' ? 'asc' : 'desc',
  };
}

function positionRank(player: Player): number | null {
  const code = getSquadPosition(player);
  const rank = positions.indexOf(code === 'CDM' ? 'DM' : code === 'CAM' ? 'AM' : code === 'CF' ? 'SS' : code);
  return rank >= 0 ? rank : null;
}

function compareNumbers(a: number | null, b: number | null, direction: SquadSort['direction']): number {
  // Missing values stay last in both directions; a real zero remains sortable.
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return (a - b) * (direction === 'asc' ? 1 : -1);
}

export function sortSquadPlayers(players: Player[], sort: SquadSort): Player[] {
  const value = (player: Player) => {
    switch (sort.key) {
      case 'position': return positionRank(player);
      case 'age': return numeric(player.age);
      case 'ovr': return getSquadOvr(player);
      case 'potential': return getSquadPotential(player);
      case 'fitness': return getSquadFitness(player);
      case 'value': return getSquadValue(player);
    }
  };
  const shirt = (player: Player) => numeric(player.squad_number) && Number(player.squad_number) > 0 ? Number(player.squad_number) : null;
  const name = (player: Player) => player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || player.common_name || '';
  return [...players].sort((a, b) => compareNumbers(value(a), value(b), sort.direction)
    || compareNumbers(positionRank(a), positionRank(b), 'asc')
    || compareNumbers(shirt(a), shirt(b), 'asc')
    || name(a).localeCompare(name(b))
    || a.id.localeCompare(b.id, undefined, { numeric: true }));
}
