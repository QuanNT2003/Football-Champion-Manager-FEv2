const aliases: Record<string, string> = {
  TRAINING: 'TRAINING_GROUND', YOUTH: 'YOUTH_ACADEMY',
  MEDICAL: 'MEDICAL_CENTRE', MEDICAL_CENTER: 'MEDICAL_CENTRE',
  SCOUTING: 'DATA_ANALYTICS', SCOUTING_NETWORK: 'DATA_ANALYTICS',
};

export function normalizeFacilityCode(code: string): string {
  const normalized = (code || '').trim().toUpperCase();
  return aliases[normalized] ?? normalized;
}

// Artwork coverage differs from gameplay levels. Use the nearest available lower
// level when artwork is missing, without changing the facility's displayed level.
const imageLevels: Record<string, number[]> = {
  TRAINING_GROUND: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  YOUTH_ACADEMY: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  MEDICAL_CENTRE: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  DATA_ANALYTICS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  COMMERCIAL_OFFICE: [1, 2, 3, 4, 5, 6],
  STADIUM: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12],
};

export function facilityImageUrl(code: string, level: number): string | undefined {
  const normalized = normalizeFacilityCode(code);
  const levels = imageLevels[normalized];
  if (!levels) return undefined;
  const current = Math.max(1, Math.floor(Number(level) || 1));
  const imageLevel = levels.findLast(value => value <= current) ?? levels[0];
  // These existing filenames contain a space before the extension.
  const suffix = normalized === 'STADIUM' && [3, 4, 5].includes(imageLevel) ? ' ' : '';
  return `${import.meta.env.BASE_URL}assets/images/facilities/${encodeURIComponent(`${normalized}_LEVEL${imageLevel}${suffix}.jpg`)}`;
}
