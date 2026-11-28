import { useEffect, useState } from 'react';

export function MatchClubBadge({ name, logoUrl, large = false }: { name: string; logoUrl?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logoUrl]);
  const className = `match-club-crest${large ? ' large' : ''}`;
  return logoUrl && !failed
    ? <img className={className} src={logoUrl} alt="" onError={() => setFailed(true)} />
    : <span className={`${className} fallback`} aria-hidden="true">{name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('')}</span>;
}
