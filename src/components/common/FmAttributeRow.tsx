import React from 'react';
import { useTranslation } from '../../i18n';

export interface FmAttributeRowProps {
  name: string;
  value: number;
  code?: string;
  isKey?: boolean;
  multiplier?: number;
  highlightType?: 'primary' | 'secondary' | 'none';
  description?: string;
  potentialValue?: number;
  growth?: string | null;
  maxValue?: number;
  compact?: boolean;
}

/**
 * Get display color for attribute value based on rating scale.
 * Works seamlessly for both 1-20 (FM standard) and 1-100 (DB scale).
 */
export const getAttributeValueColor = (val: number, max: number = 100): string => {
  if (max <= 20 || val <= 20) {
    if (val >= 16) return 'var(--game-accent)'; // Elite: deep emerald green
    if (val >= 13) return 'var(--game-info)'; // Good: sky blue
    if (val >= 10) return 'var(--game-text)'; // Average: slate
    return 'var(--game-dim)'; // Low: muted gray
  }

  // 1-100 Scale
  if (val >= 80) return 'var(--game-accent)'; // Elite: green
  if (val >= 68) return 'var(--game-info)'; // Great: blue
  if (val >= 55) return 'var(--game-text)'; // Average: slate
  return 'var(--game-dim)'; // Below average: muted gray
};

export const FmAttributeRow: React.FC<FmAttributeRowProps> = ({
  name,
  value,
  code,
  isKey = false,
  multiplier = 1.0,
  highlightType,
  description,
  potentialValue,
  growth,
  maxValue = 100,
  compact = false,
}) => {
  const { t } = useTranslation();
  // Determine highlight type: primary (green) vs secondary (blue) vs none
  const computedHighlight: 'primary' | 'secondary' | 'none' =
    highlightType !== undefined
      ? highlightType
      : isKey || multiplier >= 3
      ? 'primary'
      : multiplier > 1
      ? 'secondary'
      : 'none';

  const valColor = getAttributeValueColor(value, maxValue);
  const growthText = growth ? (growth.startsWith('+') || growth.startsWith('-') ? growth : `+${growth}`) : null;
  const isPositiveGrowth = growthText ? !growthText.startsWith('-') : true;

  const tooltipText = description
    ? `${name} ${code ? `[${code}]` : ''}: ${value}\n${description}`
    : `${name} ${code ? `[${code}]` : ''}: ${value}`;

  return (
    <div
      className={`fm-attr-row ${
        computedHighlight === 'primary'
          ? 'is-key-primary is-key'
          : computedHighlight === 'secondary'
          ? 'is-key-secondary is-key'
          : ''
      } ${compact ? 'is-compact' : ''}`}
      title={tooltipText}
    >
      <div className="fm-attr-left">
        <span className="fm-attr-name" title={name}>
          {name}
        </span>
      </div>

      <div className="fm-attr-right">
        <span className="fm-attr-val" style={{ color: valColor }}>
          {value}
        </span>
        {growthText && (
          <span
            className="fm-attr-growth"
            style={{ color: isPositiveGrowth ? 'var(--game-accent)' : 'var(--game-danger)' }}
            title={t('skills.season_growth_value', { growth: growthText })}
            aria-label={t('skills.season_growth_value', { growth: growthText })}
          >
            ({growthText})
          </span>
        )}
      </div>
    </div>
  );
};
