import React, { useState, useEffect } from 'react';
import { getFacepackUrl } from '../../utils/image';
import { Shield } from 'lucide-react';

interface StaffAvatarProps {
  name?: string;
  role?: string;
  photoUrl?: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  name = 'Staff',
  role = 'HEAD_COACH',
  photoUrl,
  size = 48,
  className = '',
  style = {},
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const initials = (name || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const fullUrl = getFacepackUrl(photoUrl);

  const getRoleGradient = (r: string) => {
    switch (r) {
      case 'HEAD_COACH':
      case 'HEAD_COACH_YOUTH':
        return 'linear-gradient(135deg, var(--game-green-strong) 0%, var(--game-green-deep) 100%)';
      case 'ASSISTANT_COACH':
      case 'ASSISTANT_COACH_YOUTH':
      case 'YOUTH_COACH':
        return 'var(--game-info-strong)';
      case 'FITNESS_COACH':
        return 'var(--game-orange-strong)';
      case 'GOALKEEPING_COACH':
        return 'var(--game-violet-strong)';
      case 'SCOUT':
        return 'var(--game-violet-strong)';
      case 'PHYSIO':
        return 'var(--game-pink-strong)';
      case 'YOUTH_DIRECTOR':
        return 'var(--game-teal-strong)';
      default:
        return 'linear-gradient(135deg, var(--game-hover) 0%, var(--game-rail) 100%)';
    }
  };

  const dim = typeof size === 'number' ? `${size}px` : size;

  if (fullUrl && !imgError) {
    return (
      <div
        className={`staff-avatar-container ${className}`}
        style={{
          width: dim,
          height: dim,
          minWidth: dim,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--game-rail)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          flexShrink: 0,
          ...style,
        }}
      >
        <img
          src={fullUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`staff-avatar-fallback ${className}`}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        borderRadius: '50%',
        background: getRoleGradient(role),
        border: '2px solid rgba(255, 255, 255, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--game-on-color)',
        fontWeight: 800,
        fontSize: typeof size === 'number' ? `${Math.max(11, Math.round(size * 0.34))}px` : '0.85rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      title={`${name} (${role})`}
    >
      <Shield
        style={{
          position: 'absolute',
          width: '52%',
          height: '52%',
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{initials || 'S'}</span>
    </div>
  );
};
