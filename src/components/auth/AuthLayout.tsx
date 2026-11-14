import { Globe2 } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import { GameBrand } from '../shell/GameBrand';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t, language, languages, setLanguage } = useTranslation();

  return (
    <main className="game-auth">
      <div className="game-auth-art">
        <GameBrand to="/login" />
        <div className="game-auth-title">
          <h1>FOOTBALL<br /><em>CHAMPION</em></h1>
          <p>{t('v2.managerGame')}</p>
        </div>
      </div>
      <div className="game-auth-side">
        <label className="game-auth-language">
          <Globe2 size={16} />
          <span className="sr-only">{t('v2.language')}</span>
          <select value={language} onChange={event => setLanguage(event.target.value as typeof language)}>
            {languages.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
          </select>
        </label>
        {children}
      </div>
    </main>
  );
}
