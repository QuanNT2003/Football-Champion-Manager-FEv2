import { Shield, Star } from 'lucide-react';
import { useState } from 'react';
import { getFacepackUrl } from '../../utils/image';

type CrestProps = { name: string; short_name?: string; logo_url?: string | null };

export function ClubCrest({ club, large = false }: { club: CrestProps; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState('');
  const logo = getFacepackUrl(club.logo_url);
  const initials = club.short_name?.trim().slice(0, 5)
    || club.name.trim().split(/\s+/).slice(0, 3).map(word => word[0]).join('').toUpperCase();
  const showLogo = logo && !logo.includes('default_logo') && logo !== failedUrl;
  return (
    <span className={large ? 'game-crest game-crest-large' : 'game-crest'} aria-hidden="true">
      {showLogo ? <img src={logo} alt="" onError={() => setFailedUrl(logo)} /> : (
        <span className="game-crest-fallback">
          <Shield size={large ? 73 : 56} strokeWidth={1.2} />
          <span>{initials}</span>
          {large && <Star size={9} fill="currentColor" />}
        </span>
      )}
    </span>
  );
}
