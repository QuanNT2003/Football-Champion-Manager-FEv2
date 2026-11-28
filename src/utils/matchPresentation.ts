import { Match, MatchEvent, MatchGoal, MatchReportPlayer } from '../types';

export const isMatchFinished = (status: string) => status === 'FINISHED' || status === 'COMPLETED';
export function orderedMatchEvents(events: MatchEvent[]) {
  const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const phases = ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_FIRST', 'EXTRA_SECOND', 'SHOOTOUT'];
  return events.map((event, index) => ({ event, index })).sort((a, b) => {
    const left = a.event.metadata, right = b.event.metadata;
    const sequenceA = numeric(left?.sequence), sequenceB = numeric(right?.sequence);
    if (sequenceA != null && sequenceB != null) return sequenceA - sequenceB || a.index - b.index;
    const elapsedA = numeric(left?.elapsed), elapsedB = numeric(right?.elapsed);
    if (elapsedA != null && elapsedB != null) return elapsedA - elapsedB || a.index - b.index;
    const phaseA = phases.indexOf(left?.phase || ''), phaseB = phases.indexOf(right?.phase || '');
    if (phaseA >= 0 && phaseB >= 0 && phaseA !== phaseB) return phaseA - phaseB;
    return a.event.minute - b.event.minute || Number(left?.addedTime || 0) - Number(right?.addedTime || 0) || a.index - b.index;
  }).map(row => row.event);
}
export function matchMinute(event: { minute: number; addedTime?: number; metadata?: MatchEvent['metadata'] }) {
  const added = event.addedTime ?? event.metadata?.addedTime ?? 0;
  return `${event.minute}${added ? `+${added}` : ''}′`;
}
export function shortPlayerName(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? `${words[0][0]}. ${words.slice(-2).join(' ')}` : name;
}
export function matchGoals(match: Pick<Match, 'scorers' | 'events'>): MatchGoal[] {
  if (match.scorers) return match.scorers;
  return (match.events || []).filter(e => e.eventType === 'GOAL' || e.eventType === 'OWN_GOAL').map(e => ({
    clubId: e.clubId || null, playerId: e.player?.id || null, playerName: e.player?.name || null,
    minute: e.minute, addedTime: e.metadata?.addedTime || 0,
    ownGoal: e.eventType === 'OWN_GOAL', penalty: e.metadata?.shotType === 'PENALTY',
  }));
}
export function groupedScorers(goals: MatchGoal[], clubId?: string) {
  const groups = new Map<string, { name: string | null; goals: MatchGoal[] }>();
  for (const goal of goals.filter(g => g.clubId === clubId)) {
    const key = goal.playerId || goal.playerName || 'unknown';
    const group = groups.get(key) || { name: goal.playerName, goals: [] };
    group.goals.push(goal); groups.set(key, group);
  }
  return [...groups.values()];
}
/** Legacy reports may lack coordinates; distribute their original XI by position line. */
export function lineupCoordinates(players: MatchReportPlayer[]) {
  const rows = [
    players.filter(p => p.position === 'GK'),
    players.filter(p => ['CB', 'SW', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position || '')),
    players.filter(p => ['DM', 'CM', 'LM', 'RM'].includes(p.position || '')),
    players.filter(p => !['GK', 'CB', 'SW', 'LB', 'RB', 'LWB', 'RWB', 'DM', 'CM', 'LM', 'RM'].includes(p.position || '')),
  ];
  return players.map(player => {
    const row = rows.findIndex(r => r.includes(player));
    const peers = rows[row];
    const fallback = { x: (peers.indexOf(player) + 1) * 100 / (peers.length + 1), y: [10, 30, 54, 79][row] };
    const raw = player.coordinates;
    const point = raw && Number.isFinite(raw.x) && Number.isFinite(raw.y) ? raw : fallback;
    return { player, x: Math.min(90, Math.max(10, point.x)), y: Math.min(88, Math.max(12, 100 - point.y)) };
  });
}
