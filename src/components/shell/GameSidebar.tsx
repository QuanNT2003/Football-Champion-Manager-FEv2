import { Radio } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { GameBrand } from './GameBrand';
import { clubNavigation, competitionsLink, isFederationPath, worldNavigation } from './navigation';

export function GameSidebar({ squadCount }: { squadCount: number }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const groups = [
    { id: 'club-navigation', label: 'v2.club', links: clubNavigation },
    { id: 'world-navigation', label: 'v2.world', links: worldNavigation },
  ];

  return (
    <aside className="game-sidebar">
      <div className="game-sidebar-inner">
        <div className="game-sidebar-brand"><GameBrand /></div>
        <nav className="game-nav" aria-label={t('v2.navigation')}>
          {groups.map(group => (
            <section className="game-nav-group" key={group.id} aria-labelledby={group.id}>
              <h2 id={group.id}>{t(group.label)}</h2>
              <div className="game-nav-links">
                {group.links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end
                    title={t(label)}
                    className={({ isActive }) => `game-nav-link ${isActive || (to === competitionsLink.to && isFederationPath(pathname)) ? 'is-active' : ''}`}
                  >
                    <Icon size={17} strokeWidth={1.85} />
                    <span>{t(label)}</span>
                    {to === '/squad' && squadCount > 0 && <small>{squadCount}</small>}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="game-sidebar-footer">
          <div className="game-socials">
            <a href="https://facebook.com" rel="noreferrer" target="_blank">Facebook</a>
            <a href="https://discord.com" rel="noreferrer" target="_blank">Discord</a>
          </div>
          <span className="game-engine-label"><Radio size={14} /> Match Engine</span>
        </div>
      </div>
    </aside>
  );
}
