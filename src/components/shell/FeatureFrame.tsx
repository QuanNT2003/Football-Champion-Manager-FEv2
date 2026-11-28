import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { clubNavigation, competitionsLink, isFederationPath, worldNavigation } from './navigation';

const navigation = [...clubNavigation, ...worldNavigation].filter(item => item.to !== '/dashboard');

export function FeatureFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const page = navigation.find(item => item.to === pathname)
    ?? (isFederationPath(pathname) ? competitionsLink : null);

  if (pathname.startsWith('/clubs/') || pathname.startsWith('/matches/')) return <div className="game-feature-body">{children}</div>;
  if (pathname === '/club/transfers') return children;
  if (!page) return children;

  const Icon = page.icon;
  return (
    <div className="game-feature">
      <header className="game-feature-heading">
        <Icon size={27} strokeWidth={1.8} />
        <h1>{t(page.label)}</h1>
      </header>
      <div className="game-feature-body">{children}</div>
    </div>
  );
}

