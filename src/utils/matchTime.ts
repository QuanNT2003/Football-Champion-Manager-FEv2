/** Kickoff is server (UTC+7) wall time, never a UTC instant.
 * Also accept the ISO-shaped MySQL TIME carriers returned by older backends.
 */
export function formatKickoffTime(value?: string | null, fallback = '--:--'): string {
  const match = value?.match(/^(?:\d{4}-\d{2}-\d{2}T)?([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?(?:Z)?$/);
  return match ? `${match[1]}:${match[2]}` : fallback;
}
