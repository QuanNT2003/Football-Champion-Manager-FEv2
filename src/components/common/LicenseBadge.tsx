import React from 'react';
import { useTranslation } from '../../i18n';


interface Props {
  license: string;
  size?: 'sm' | 'md';
}

export const LicenseBadge: React.FC<Props> = ({ license, size = 'md' }) => {
  const { t } = useTranslation();
  const getBadgeStyle = (lic: string) => {
    switch (lic) {
      case 'PRO':
        return { text: 'UEFA PRO', bg: 'var(--game-gold-strong)' };
      case 'A':
        return { text: t('license.a', 'BẰNG A'), bg: 'var(--game-green-strong)' };
      case 'B':
        return { text: t('license.b', 'BẰNG B'), bg: 'var(--game-info-strong)' };
      case 'C':
        return { text: t('license.c', 'BẰNG C'), bg: 'var(--game-violet-strong)' };
      default:
        return { text: lic, bg: 'var(--game-line-active)' };
    }
  };

  const { text, bg } = getBadgeStyle(license);

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: 'var(--game-on-color)',
        fontSize: size === 'sm' ? '0.62rem' : '0.7rem',
        fontWeight: 900,
        padding: size === 'sm' ? '0.1rem 0.35rem' : '0.15rem 0.45rem',
        borderRadius: '5px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </span>
  );
};

