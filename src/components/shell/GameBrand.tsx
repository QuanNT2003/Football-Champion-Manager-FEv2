import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function GameBrand({ to = '/dashboard' }: { to?: string }) {
  return (
    <Link to={to} className="game-brand" aria-label="Football Champion">
      <span className="game-brand-mark"><Shield size={21} strokeWidth={2.5} /></span>
      <span className="game-brand-name">FOOTBALL<br /><strong>CHAMPION</strong></span>
    </Link>
  );
}
